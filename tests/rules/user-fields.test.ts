import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
    assertFails,
    assertSucceeds,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { createTestEnv, seedUser, USER_UID, userCtx } from './helpers.js';

/**
 * Field-level validation on users/{uid}.
 *
 * Before this suite the rules pinned only `role`, so any signed-in user could
 * write arbitrary fields and values to their own profile — including a
 * photoURL carrying an XSS payload that an owner would later render in the
 * Admin Portal, or a spoofed `email` shown in the admin table.
 *
 * The "allows" cases at the bottom are as important as the denials: they are
 * the real client payloads, and they guard against a rules change that locks
 * legitimate users out of their own profile.
 */

let env: RulesTestEnvironment;

beforeAll(async () => {
    env = await createTestEnv();
});

afterAll(async () => {
    await env.cleanup();
});

beforeEach(async () => {
    await env.clearFirestore();
});

function selfDoc() {
    return userCtx(env).firestore().doc(`users/${USER_UID}`);
}

describe('users/{uid} field allowlist', () => {
    it('denies creating with a field outside the allowlist', async () => {
        await assertFails(
            selfDoc().set({ uid: USER_UID, email: 'u@example.com', isAdmin: true }),
        );
    });

    it('denies adding an arbitrary field on update', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ injected: 'anything' }));
    });

    it('denies writing the server-owned roleChangedAt field', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ roleChangedAt: new Date() }));
    });

    it('denies writing the server-owned lastSignInAt field', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ lastSignInAt: new Date() }));
    });

    it('denies creating a doc whose uid does not match the document id', async () => {
        await assertFails(selfDoc().set({ uid: 'someone-else', email: 'u@example.com' }));
    });

    it('denies changing uid on update', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ uid: 'someone-else' }));
    });
});

describe('users/{uid} field types and sizes', () => {
    it('denies a non-string displayName', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ displayName: 42 }));
    });

    it('denies an oversized displayName', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ displayName: 'x'.repeat(256) }));
    });

    it('denies an oversized photoURL', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ photoURL: `https://e.com/${'x'.repeat(2048)}` }));
    });

    it('denies a non-string email', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ email: { nested: 'object' } }));
    });

    it('denies a preferences map with an unknown key', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ 'preferences.isAdmin': true }));
    });

    it('denies an unrecognised theme value', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ 'preferences.theme': 'neon' }));
    });

    it('denies a non-boolean emailNotifications', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ 'preferences.emailNotifications': 'yes' }));
    });

    it('denies replacing preferences with a non-map', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertFails(selfDoc().update({ preferences: 'system' }));
    });
});

describe('users/{uid} legitimate client payloads still succeed', () => {
    it('allows the create payload the client actually sends', async () => {
        // Mirrors createUserProfileFromAuth() + the repository's updatedAt.
        await assertSucceeds(
            selfDoc().set({
                uid: USER_UID,
                email: 'u@example.com',
                displayName: 'U',
                photoURL: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                preferences: { theme: 'system', emailNotifications: true },
            }),
        );
    });

    it('allows a dotted-path preference update', async () => {
        await seedUser(env, USER_UID, 'user');
        await assertSucceeds(
            selfDoc().update({ 'preferences.theme': 'dark', updatedAt: new Date() }),
        );
    });

    it('allows a merge-save that re-sends uid and createdAt', async () => {
        // getOrCreateProfile() re-sends the full profile over a doc the
        // onUserCreate trigger already made. If the allowlist omitted uid or
        // createdAt this would start failing for every existing user.
        await seedUser(env, USER_UID, 'user');
        await assertSucceeds(
            selfDoc().set(
                {
                    uid: USER_UID,
                    email: 'u@example.com',
                    displayName: 'U',
                    photoURL: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    preferences: { theme: 'system', emailNotifications: true },
                },
                { merge: true },
            ),
        );
    });

    it('allows a profile whose provider supplied no displayName or photo', async () => {
        // onUserCreate seeds these as null; a later preference update must not
        // trip the string validators.
        await seedUser(env, USER_UID, 'user', { displayName: null, photoURL: null, email: null });
        await assertSucceeds(selfDoc().update({ 'preferences.theme': 'light' }));
    });
});
