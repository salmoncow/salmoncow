import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    it,
} from 'vitest';
import {
    assertFails,
    assertSucceeds,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
    adminCtx,
    anonCtx,
    createTestEnv,
    OTHER_UID,
    ownerCtx,
    OWNER_UID,
    seedUser,
    USER_UID,
    userCtx,
} from './helpers.js';

// Acceptance criteria: AC-10, AC-11, AC-16
// Spec §VI (security requirements), §VII (rules sketch), §X.4

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

describe('users/{uid} rules', () => {
    describe('anonymous', () => {
        it('denies reading any user doc', async () => {
            await seedUser(env, USER_UID, 'user');
            await assertFails(anonCtx(env).firestore().doc(`users/${USER_UID}`).get());
        });

        it('denies creating a user doc', async () => {
            await assertFails(
                anonCtx(env).firestore().doc(`users/${USER_UID}`).set({ uid: USER_UID }),
            );
        });
    });

    describe('role: user', () => {
        it('allows reading own user doc', async () => {
            await seedUser(env, USER_UID, 'user');
            await assertSucceeds(
                userCtx(env).firestore().doc(`users/${USER_UID}`).get(),
            );
        });

        it("denies reading another user's doc", async () => {
            await seedUser(env, OTHER_UID, 'user');
            await assertFails(
                userCtx(env).firestore().doc(`users/${OTHER_UID}`).get(),
            );
        });

        it('allows creating own doc without a role field', async () => {
            await assertSucceeds(
                userCtx(env).firestore().doc(`users/${USER_UID}`).set({
                    uid: USER_UID,
                    email: 'u@example.com',
                    displayName: 'U',
                }),
            );
        });

        it('denies creating own doc when including a role field', async () => {
            await assertFails(
                userCtx(env).firestore().doc(`users/${USER_UID}`).set({
                    uid: USER_UID,
                    role: 'admin',
                }),
            );
        });

        it("denies creating another user's doc", async () => {
            await assertFails(
                userCtx(env).firestore().doc(`users/${OTHER_UID}`).set({
                    uid: OTHER_UID,
                }),
            );
        });

        it('allows updating own non-role fields', async () => {
            await seedUser(env, USER_UID, 'user');
            await assertSucceeds(
                userCtx(env)
                    .firestore()
                    .doc(`users/${USER_UID}`)
                    .update({ displayName: 'Updated' }),
            );
        });

        it('denies updating own role field', async () => {
            await seedUser(env, USER_UID, 'user');
            await assertFails(
                userCtx(env)
                    .firestore()
                    .doc(`users/${USER_UID}`)
                    .update({ role: 'admin' }),
            );
        });

        it("denies updating another user's doc", async () => {
            await seedUser(env, OTHER_UID, 'user');
            await assertFails(
                userCtx(env)
                    .firestore()
                    .doc(`users/${OTHER_UID}`)
                    .update({ displayName: 'Hax' }),
            );
        });

        it('denies deleting own doc', async () => {
            await seedUser(env, USER_UID, 'user');
            await assertFails(
                userCtx(env).firestore().doc(`users/${USER_UID}`).delete(),
            );
        });
    });

    describe('role: admin', () => {
        it('allows reading own doc', async () => {
            await seedUser(env, 'admin-uid', 'admin');
            await assertSucceeds(
                adminCtx(env).firestore().doc('users/admin-uid').get(),
            );
        });

        it("allows reading another user's doc", async () => {
            await seedUser(env, OTHER_UID, 'user');
            await assertSucceeds(
                adminCtx(env).firestore().doc(`users/${OTHER_UID}`).get(),
            );
        });

        it('denies updating own role field', async () => {
            await seedUser(env, 'admin-uid', 'admin');
            await assertFails(
                adminCtx(env)
                    .firestore()
                    .doc('users/admin-uid')
                    .update({ role: 'owner' }),
            );
        });

        it("denies updating another user's any field", async () => {
            await seedUser(env, OTHER_UID, 'user');
            await assertFails(
                adminCtx(env)
                    .firestore()
                    .doc(`users/${OTHER_UID}`)
                    .update({ displayName: 'Hax' }),
            );
        });

        it("denies updating another user's role field", async () => {
            await seedUser(env, OTHER_UID, 'user');
            await assertFails(
                adminCtx(env)
                    .firestore()
                    .doc(`users/${OTHER_UID}`)
                    .update({ role: 'admin' }),
            );
        });

        it('denies deleting any user doc', async () => {
            await seedUser(env, OTHER_UID, 'user');
            await assertFails(
                adminCtx(env).firestore().doc(`users/${OTHER_UID}`).delete(),
            );
        });
    });

    describe('role: owner', () => {
        it('allows reading own doc', async () => {
            await seedUser(env, OWNER_UID, 'owner');
            await assertSucceeds(
                ownerCtx(env).firestore().doc(`users/${OWNER_UID}`).get(),
            );
        });

        it("allows reading another user's doc", async () => {
            await seedUser(env, OTHER_UID, 'user');
            await assertSucceeds(
                ownerCtx(env).firestore().doc(`users/${OTHER_UID}`).get(),
            );
        });

        it('denies updating own role field', async () => {
            await seedUser(env, OWNER_UID, 'owner');
            await assertFails(
                ownerCtx(env)
                    .firestore()
                    .doc(`users/${OWNER_UID}`)
                    .update({ role: 'user' }),
            );
        });

        it("denies updating another user's role field", async () => {
            await seedUser(env, OTHER_UID, 'user');
            await assertFails(
                ownerCtx(env)
                    .firestore()
                    .doc(`users/${OTHER_UID}`)
                    .update({ role: 'admin' }),
            );
        });

        it('denies deleting any user doc (delete disabled)', async () => {
            await seedUser(env, OTHER_UID, 'user');
            await assertFails(
                ownerCtx(env).firestore().doc(`users/${OTHER_UID}`).delete(),
            );
        });
    });

    describe('claims hygiene', () => {
        it('treats a signed-in user with no role claim as least-privilege', async () => {
            await seedUser(env, OTHER_UID, 'user');
            const ctx = env.authenticatedContext('stranger-uid', {}); // no role claim
            // Stranger can read their own (but there is none)
            await assertFails(
                ctx.firestore().doc(`users/${OTHER_UID}`).get(),
            );
        });
    });
});
