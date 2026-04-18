import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { setUserRole } from '../src/setUserRole.js';
import { auth, db } from '../src/lib/admin.js';
import { clearFirestore, ensureAuthUser, ft, nextUid } from './helpers.js';

// Acceptance criteria: AC-5, AC-6, AC-7, AC-8, AC-12
// Spec §VI (security), §X.4 (callable shape)

const wrapped = ft.wrap(setUserRole);

afterAll(() => {
    ft.cleanup();
});

beforeEach(async () => {
    await clearFirestore();
});

/** Build a CallableRequest-like object for the wrapped callable. */
function buildRequest(opts: {
    callerUid?: string;
    callerRole?: 'owner' | 'admin' | 'user';
    data: unknown;
    includeAppCheck?: boolean;
}) {
    const { callerUid, callerRole, data, includeAppCheck = true } = opts;
    return {
        data,
        auth: callerUid
            ? {
                  uid: callerUid,
                  token: callerRole ? { role: callerRole } : {},
              }
            : undefined,
        // firebase-functions-test's wrap doesn't enforce App Check even if
        // enforceAppCheck is configured on the function. Including this here
        // is documentation of intent — see AC-12 App Check config assertion.
        app: includeAppCheck ? { appId: 'test-app' } : undefined,
    } as unknown as Parameters<typeof wrapped>[0];
}

describe('setUserRole callable', () => {
    it('rejects unauthenticated callers with permission-denied', async () => {
        await expect(
            wrapped(
                buildRequest({
                    data: { targetUid: nextUid('t'), role: 'admin' },
                }),
            ),
        ).rejects.toThrow(/owner role required/);
    });

    it('rejects non-owner callers with permission-denied', async () => {
        await expect(
            wrapped(
                buildRequest({
                    callerUid: 'caller-admin',
                    callerRole: 'admin',
                    data: { targetUid: nextUid('t'), role: 'admin' },
                }),
            ),
        ).rejects.toThrow(/owner role required/);
    });

    it('rejects a plain user caller with permission-denied', async () => {
        await expect(
            wrapped(
                buildRequest({
                    callerUid: 'caller-user',
                    callerRole: 'user',
                    data: { targetUid: nextUid('t'), role: 'admin' },
                }),
            ),
        ).rejects.toThrow(/owner role required/);
    });

    it('rejects invalid role values with invalid-argument', async () => {
        const ownerUid = nextUid('o');
        await seedOwner(ownerUid);
        await expect(
            wrapped(
                buildRequest({
                    callerUid: ownerUid,
                    callerRole: 'owner',
                    data: { targetUid: nextUid('t'), role: 'super-admin' },
                }),
            ),
        ).rejects.toThrow(/invalid input/);
    });

    it('rejects missing targetUid with invalid-argument', async () => {
        const ownerUid = nextUid('o');
        await seedOwner(ownerUid);
        await expect(
            wrapped(
                buildRequest({
                    callerUid: ownerUid,
                    callerRole: 'owner',
                    data: { role: 'admin' },
                }),
            ),
        ).rejects.toThrow(/invalid input/);
    });

    it('succeeds on a valid promotion and keeps claim + doc + audit in sync', async () => {
        const ownerUid = nextUid('o');
        const targetUid = nextUid('t');
        await seedOwner(ownerUid);
        await seedUserDoc(targetUid, 'user');

        const result = await wrapped(
            buildRequest({
                callerUid: ownerUid,
                callerRole: 'owner',
                data: { targetUid, role: 'admin' },
            }),
        );

        expect(result).toEqual({ ok: true, fromRole: 'user', toRole: 'admin' });

        // Claim updated
        const user = await auth.getUser(targetUid);
        expect(user.customClaims).toMatchObject({ role: 'admin' });

        // Mirror doc updated
        const doc = await db.doc(`users/${targetUid}`).get();
        expect(doc.data()?.role).toBe('admin');
        expect(doc.data()?.roleChangedAt).toBeDefined();

        // Audit entry written with correct fields
        const auditSnap = await db
            .collection('audit')
            .where('targetUid', '==', targetUid)
            .get();
        expect(auditSnap.size).toBe(1);
        const audit = auditSnap.docs[0].data();
        expect(audit).toMatchObject({
            actorUid: ownerUid,
            targetUid,
            fromRole: 'user',
            toRole: 'admin',
        });
    });

    it('refuses to demote the last owner', async () => {
        const ownerUid = nextUid('o');
        await seedOwner(ownerUid);

        await expect(
            wrapped(
                buildRequest({
                    callerUid: ownerUid,
                    callerRole: 'owner',
                    data: { targetUid: ownerUid, role: 'user' },
                }),
            ),
        ).rejects.toThrow(/cannot demote the last owner/);
    });

    it('allows demoting an owner when another owner exists', async () => {
        const ownerA = nextUid('o');
        const ownerB = nextUid('o');
        await seedOwner(ownerA);
        await seedOwner(ownerB);

        const result = await wrapped(
            buildRequest({
                callerUid: ownerA,
                callerRole: 'owner',
                data: { targetUid: ownerB, role: 'user' },
            }),
        );

        expect(result.toRole).toBe('user');
        expect(result.fromRole).toBe('owner');
    });

    it('enforces the rate limit at the 21st call in the window', async () => {
        const ownerUid = nextUid('o');
        await seedOwner(ownerUid);

        // Pre-seed the counter at 20 to avoid executing 20 real calls.
        await db
            .doc(`rateLimits/setUserRole/actors/${ownerUid}`)
            .set({
                windowStart: Timestamp.now(),
                count: 20,
            });

        const targetUid = nextUid('t');
        await seedUserDoc(targetUid, 'user');

        await expect(
            wrapped(
                buildRequest({
                    callerUid: ownerUid,
                    callerRole: 'owner',
                    data: { targetUid, role: 'admin' },
                }),
            ),
        ).rejects.toThrow(/rate limit exceeded/);
    });

    it('resets the rate-limit window after an hour', async () => {
        const ownerUid = nextUid('o');
        await seedOwner(ownerUid);

        // Counter at 20, but window is 2 hours old.
        const twoHoursAgo = Timestamp.fromMillis(Date.now() - 2 * 60 * 60 * 1000);
        await db
            .doc(`rateLimits/setUserRole/actors/${ownerUid}`)
            .set({
                windowStart: twoHoursAgo,
                count: 20,
            });

        const targetUid = nextUid('t');
        await seedUserDoc(targetUid, 'user');

        const result = await wrapped(
            buildRequest({
                callerUid: ownerUid,
                callerRole: 'owner',
                data: { targetUid, role: 'admin' },
            }),
        );
        expect(result.ok).toBe(true);

        const counter = await db
            .doc(`rateLimits/setUserRole/actors/${ownerUid}`)
            .get();
        expect(counter.data()?.count).toBe(1);
    });

    it('declares App Check enforcement in source (regression guard)', () => {
        // firebase-functions v6 stores enforceAppCheck in a closure, not on
        // __endpoint or __trigger, so we can't inspect it at runtime.
        // Transport-layer enforcement is exercised only in real deploys.
        // This source-level assertion catches accidental removal of the guard
        // in code review / refactors.
        const src = readFileSync(
            resolve(process.cwd(), 'src/setUserRole.ts'),
            'utf8',
        );
        expect(src).toMatch(/enforceAppCheck:\s*true/);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────

/** Create an Auth user with `owner` claim + a mirror doc with role='owner'. */
async function seedOwner(uid: string): Promise<void> {
    await ensureAuthUser(uid);
    await auth.setCustomUserClaims(uid, { role: 'owner' });
    await seedUserDoc(uid, 'owner');
}

/**
 * Seed both the Auth record and the Firestore users/{uid} doc.
 * Both are required: setUserRole calls setCustomUserClaims(target), which
 * fails if the Auth user doesn't exist.
 */
async function seedUserDoc(
    uid: string,
    role: 'owner' | 'admin' | 'user',
): Promise<void> {
    await ensureAuthUser(uid);
    await db.doc(`users/${uid}`).set({
        uid,
        email: `${uid}@example.com`,
        displayName: uid,
        photoURL: null,
        role,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        preferences: { theme: 'system', emailNotifications: false },
    });
}
