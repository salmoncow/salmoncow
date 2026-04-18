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
    seedRateLimit,
    userCtx,
} from './helpers.js';

// Acceptance criteria: AC-11
// Rate-limit counters: Cloud Function-only writes (Admin SDK); owner-readable
// for visibility. Any client write attempt must be rejected regardless of role.

const DOC_PATH = 'rateLimits/setUserRole/actors/owner-uid';

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

describe('rateLimits/{action}/actors/{actorUid} rules', () => {
    it('allows owner to read a rate-limit counter', async () => {
        await seedRateLimit(env);
        await assertSucceeds(ownerCtx(env).firestore().doc(DOC_PATH).get());
    });

    it('denies admin from reading rate-limit counters', async () => {
        await seedRateLimit(env);
        await assertFails(adminCtx(env).firestore().doc(DOC_PATH).get());
    });

    it('denies plain user from reading rate-limit counters', async () => {
        await seedRateLimit(env);
        await assertFails(userCtx(env).firestore().doc(DOC_PATH).get());
    });

    it('denies anonymous from reading rate-limit counters', async () => {
        await seedRateLimit(env);
        await assertFails(anonCtx(env).firestore().doc(DOC_PATH).get());
    });

    it('denies owner from writing a rate-limit counter (Admin SDK only)', async () => {
        await assertFails(
            ownerCtx(env).firestore().doc(DOC_PATH).set({
                windowStart: new Date(),
                count: 1,
            }),
        );
    });
});
