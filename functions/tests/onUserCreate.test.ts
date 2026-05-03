import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { onUserCreate } from '../src/onUserCreate.js';
import { auth, db } from '../src/lib/admin.js';
import { clearFirestore, ensureAuthUser, ft, nextUid } from './helpers.js';

// Acceptance criteria: AC-1, AC-12
// Spec §XI.4 (trigger shape)

const wrapped = ft.wrap(onUserCreate);

afterAll(() => {
    ft.cleanup();
});

beforeEach(async () => {
    await clearFirestore();
});

describe('onUserCreate auth trigger', () => {
    it('creates a users/{uid} doc with defaults and sets role=user claim', async () => {
        const uid = nextUid('newuser');
        // Simulate the real sequence: Firebase Auth creates the user, THEN
        // fires onCreate. Our trigger handler calls setCustomUserClaims which
        // needs an actual Auth record.
        await ensureAuthUser(
            uid,
            `${uid}@example.com`,
            'New User',
            'https://example.com/avatar.png',
        );
        const userRecord = ft.auth.makeUserRecord({
            uid,
            email: `${uid}@example.com`,
            displayName: 'New User',
            photoURL: 'https://example.com/avatar.png',
        });

        await wrapped(userRecord);

        const snap = await db.doc(`users/${uid}`).get();
        expect(snap.exists).toBe(true);
        const data = snap.data()!;
        expect(data.uid).toBe(uid);
        expect(data.email).toBe(`${uid}@example.com`);
        expect(data.displayName).toBe('New User');
        expect(data.role).toBe('user');
        expect(data.photoURL).toBe('https://example.com/avatar.png');
        expect(data.preferences).toEqual({
            theme: 'system',
            emailNotifications: false,
        });

        const user = await auth.getUser(uid);
        expect(user.customClaims).toMatchObject({ role: 'user' });
    });

    it('is idempotent on re-invocation for the same uid', async () => {
        const uid = nextUid('dup');
        await ensureAuthUser(uid);
        const userRecord = ft.auth.makeUserRecord({
            uid,
            email: `${uid}@example.com`,
            displayName: 'First',
        });

        await wrapped(userRecord);

        // Verify doc exists after first invocation
        const firstSnap = await db.doc(`users/${uid}`).get();
        expect(firstSnap.exists).toBe(true);

        // Re-fire the trigger with the same uid. Firebase Auth never fires
        // onCreate twice for the same uid in production, but we want our
        // handler to be safe if replayed (e.g. retried after a transient
        // error). The merge:true in the handler prevents crashing; the role
        // may reset to 'user' here, which is why setUserRole is the owner's
        // only path to change roles after creation.
        await wrapped(userRecord);

        const secondSnap = await db.doc(`users/${uid}`).get();
        expect(secondSnap.exists).toBe(true);
        // Doc count per uid should still be 1 — we're not creating duplicates
        const byUid = await db
            .collection('users')
            .where('uid', '==', uid)
            .get();
        expect(byUid.size).toBe(1);
    });

    it('handles missing email/displayName/photoURL gracefully', async () => {
        const uid = nextUid('minimal');
        // Create the Auth user without optional fields
        await auth.createUser({ uid });
        const userRecord = ft.auth.makeUserRecord({
            uid,
            // no email/displayName/photoURL provided
        });

        await wrapped(userRecord);

        const snap = await db.doc(`users/${uid}`).get();
        const data = snap.data()!;
        expect(data.email).toBeNull();
        expect(data.displayName).toBeNull();
        expect(data.photoURL).toBeNull();
        expect(data.role).toBe('user');
    });
});
