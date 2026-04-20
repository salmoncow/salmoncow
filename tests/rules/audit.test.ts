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
    seedAudit,
    userCtx,
} from './helpers.js';

// Acceptance criteria: AC-11
// Audit entries are append-only and owner-readable. Admin SDK (Cloud
// Function) is the only writer; client writes are denied for all roles.

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

describe('audit/{id} rules', () => {
    it('allows owner to read audit entries', async () => {
        await seedAudit(env);
        await assertSucceeds(ownerCtx(env).firestore().doc('audit/audit-1').get());
    });

    it('denies admin from reading audit entries', async () => {
        await seedAudit(env);
        await assertFails(adminCtx(env).firestore().doc('audit/audit-1').get());
    });

    it('denies plain user from reading audit entries', async () => {
        await seedAudit(env);
        await assertFails(userCtx(env).firestore().doc('audit/audit-1').get());
    });

    it('denies anonymous from reading audit entries', async () => {
        await seedAudit(env);
        await assertFails(anonCtx(env).firestore().doc('audit/audit-1').get());
    });

    it('denies every client from writing audit entries (even owner)', async () => {
        await assertFails(
            ownerCtx(env).firestore().doc('audit/new').set({
                actorUid: 'owner-uid',
                targetUid: 'user-uid',
                fromRole: 'user',
                toRole: 'admin',
                at: new Date(),
            }),
        );
    });
});
