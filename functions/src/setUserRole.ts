import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { auth, db, type Role } from './lib/admin.js';
import { assertNotLastOwner } from './lib/lastOwnerGuard.js';
import { checkAndBumpInTransaction } from './lib/rateLimit.js';
import { setUserRoleInput } from './lib/validate.js';

// Production posture: App Check enforced.
// Local-emulator posture: App Check relaxed, because the emulator doesn't
// mock the App Check token-exchange endpoint and we can't get a valid token
// without round-tripping through real Firebase. FUNCTIONS_EMULATOR is set
// automatically by the Functions emulator; it's never set in prod.
const opts = { enforceAppCheck: true };
if (process.env.FUNCTIONS_EMULATOR) {
    opts.enforceAppCheck = false;
}

/**
 * setUserRole — owner-only callable that writes a user's role.
 *
 * Defense in depth (in order):
 *   1. App Check enforced in production (relaxed under FUNCTIONS_EMULATOR
 *      so the emulator E2E walkthrough works).
 *   2. Caller must be authenticated AND have role:'owner' in their
 *      Firebase ID-token claim.
 *   3. zod-validated inputs ({ targetUid, role }).
 *   4. Inside a single Firestore transaction:
 *      - Target user doc exists.
 *      - Last-owner guard: cannot demote the only `owner`.
 *      - Rate limit: ≤20 calls/hour/actor (fixed-window). Counter
 *        write is queued in this same TX so a failed commit doesn't
 *        bump the count.
 *      - **setCustomUserClaims (Auth API)** — called BEFORE the queued
 *        Firestore writes. The claim is the security boundary that
 *        Firestore rules read; ordering it ahead of the mirror+audit
 *        commit gives fail-closed-on-revocation semantics if the TX
 *        commit later fails. See spec.md §VI Design Decisions for the
 *        full failure-mode table and rationale.
 *      - Queued writes: update users/{targetUid} (role + roleChangedAt
 *        + updatedAt), create audit/{auto}, bump rateLimits counter.
 *   5. TX commits → all four Firestore writes apply atomically.
 *
 * Failure modes (HttpsError codes):
 *   - permission-denied: caller missing or not owner
 *   - invalid-argument: bad input
 *   - not-found: target user doc doesn't exist
 *   - failed-precondition: would demote last owner
 *   - resource-exhausted: rate limit hit
 *
 * TX retry note: Firestore retries the TX function on contention.
 * setCustomUserClaims is therefore called once per attempt with the
 * same payload — idempotent, no security impact, marginal extra Auth
 * API cost only on contention.
 *
 * Client contract (AC-5, AC-6, AC-7, AC-8):
 *   - { ok: true, fromRole, toRole } on success
 */
export const setUserRole = onCall(
    opts,
    async (request): Promise<{ ok: true; fromRole: Role | null; toRole: Role }> => {
        const { auth: callerAuth, data } = request;

        // 1. Owner-only entry gate
        if (!callerAuth || callerAuth.token.role !== 'owner') {
            throw new HttpsError('permission-denied', 'owner role required');
        }

        // 2. Input validation
        const parsed = setUserRoleInput.safeParse(data);
        if (!parsed.success) {
            throw new HttpsError(
                'invalid-argument',
                `invalid input: ${parsed.error.message}`,
            );
        }
        const { targetUid, role: toRole } = parsed.data;

        const userRef = db.doc(`users/${targetUid}`);

        // 3. Single TX: reads → checks → claim → queued writes.
        const result = await db.runTransaction(async (tx) => {
            // Reads first (Firestore TX rule: all reads before any writes).
            const userSnap = await tx.get(userRef);
            if (!userSnap.exists) {
                throw new HttpsError('not-found', `users/${targetUid} not found`);
            }
            const fromRole = (userSnap.data()?.role as Role | undefined) ?? null;

            await assertNotLastOwner(tx, db, fromRole, toRole);
            await checkAndBumpInTransaction(tx, db, callerAuth.uid);

            // Claim-first: see spec §VI.1 for the full failure-mode rationale.
            //   - Throws here → queued writes never apply (TX returns
            //     pre-commit). Safe.
            //   - Succeeds here, commit fails later → claim is the
            //     rules-engine source of truth and has already taken
            //     effect. Fail-closed for revocation. Mirror+audit drift
            //     is recoverable on retry.
            await auth.setCustomUserClaims(targetUid, { role: toRole });

            tx.update(userRef, {
                role: toRole,
                roleChangedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });
            tx.create(db.collection('audit').doc(), {
                actorUid: callerAuth.uid,
                targetUid,
                fromRole,
                toRole,
                at: FieldValue.serverTimestamp(),
            });

            return { fromRole, toRole };
        });

        return { ok: true, ...result };
    },
);
