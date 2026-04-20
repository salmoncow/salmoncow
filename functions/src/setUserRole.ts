import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { auth, db, type Role } from './lib/admin.js';
import { assertNotLastOwnerDemotion } from './lib/lastOwnerGuard.js';
import { checkAndIncrementRateLimit } from './lib/rateLimit.js';
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
 * setUserRole — owner-only callable that changes a user's role claim + mirror.
 *
 * Defense in depth (spec §VI, §X.4):
 *   1. App Check enforced at the transport layer
 *   2. Auth entry check: context.auth.token.role === 'owner'
 *   3. Zod input validation
 *   4. Rate limit (20 calls / hour / actor)
 *   5. Last-owner guard (no self-lockout)
 *   6. Atomic Firestore TX for doc update + audit entry
 *
 * Client contract (AC-5, AC-6, AC-7, AC-8):
 *   - permission-denied if caller is not owner
 *   - invalid-argument for malformed input
 *   - resource-exhausted when rate-limited
 *   - failed-precondition when demoting the last owner
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

        // 3. Rate limit (charges the actor, not the target)
        await checkAndIncrementRateLimit('setUserRole', callerAuth.uid);

        // 4. Last-owner guard
        await assertNotLastOwnerDemotion(targetUid, toRole);

        // 5. Read current role for audit metadata
        const targetSnap = await db.doc(`users/${targetUid}`).get();
        const fromRole = (targetSnap.data()?.role as Role | undefined) ?? null;

        // 6. Set custom claim (propagates on next ID-token refresh)
        await auth.setCustomUserClaims(targetUid, { role: toRole });

        // 7. Atomic mirror update + audit entry
        await db.runTransaction(async (tx) => {
            tx.set(
                db.doc(`users/${targetUid}`),
                {
                    role: toRole,
                    roleChangedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true },
            );
            const auditRef = db.collection('audit').doc();
            tx.set(auditRef, {
                actorUid: callerAuth.uid,
                targetUid,
                fromRole,
                toRole,
                at: FieldValue.serverTimestamp(),
            });
        });

        return { ok: true, fromRole, toRole };
    },
);
