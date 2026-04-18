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
    ownerCtx,
    seedContent,
    userCtx,
} from './helpers.js';

// Acceptance criteria: AC-11
// Content collection is a placeholder so rules have something concrete to
// gate. Reads open to any signed-in user; writes restricted to owner+admin.

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

describe('content/{id} rules', () => {
    describe('read', () => {
        it('denies anonymous reads', async () => {
            await seedContent(env);
            await assertFails(anonCtx(env).firestore().doc('content/post-1').get());
        });

        it('allows signed-in user reads', async () => {
            await seedContent(env);
            await assertSucceeds(userCtx(env).firestore().doc('content/post-1').get());
        });

        it('allows admin reads', async () => {
            await seedContent(env);
            await assertSucceeds(adminCtx(env).firestore().doc('content/post-1').get());
        });

        it('allows owner reads', async () => {
            await seedContent(env);
            await assertSucceeds(ownerCtx(env).firestore().doc('content/post-1').get());
        });
    });

    describe('write', () => {
        it('denies anonymous writes', async () => {
            await assertFails(
                anonCtx(env).firestore().doc('content/new').set({ title: 'x' }),
            );
        });

        it('denies plain user writes', async () => {
            await assertFails(
                userCtx(env).firestore().doc('content/new').set({ title: 'x' }),
            );
        });

        it('allows admin writes', async () => {
            await assertSucceeds(
                adminCtx(env).firestore().doc('content/new').set({
                    title: 'Hello',
                    body: 'World',
                    authorUid: 'admin-uid',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
            );
        });

        it('allows owner writes', async () => {
            await assertSucceeds(
                ownerCtx(env).firestore().doc('content/new').set({
                    title: 'Hello',
                    body: 'World',
                    authorUid: 'owner-uid',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
            );
        });
    });
});
