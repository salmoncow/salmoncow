import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

/**
 * Shared test environment and context helpers for Firestore rules tests.
 *
 * All rules tests use the same emulator instance (spun up by
 * `firebase emulators:exec`) with the real `firestore.rules` loaded.
 * Role claims are mocked via `authenticatedContext(uid, { role })`.
 */

export const PROJECT_ID = 'salmoncow-rules-test';

export const OWNER_UID = 'owner-uid';
export const ADMIN_UID = 'admin-uid';
export const USER_UID = 'user-uid';
export const OTHER_UID = 'other-uid';

export async function createTestEnv(): Promise<RulesTestEnvironment> {
    const rulesPath = resolve(process.cwd(), 'firestore.rules');
    return initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            rules: readFileSync(rulesPath, 'utf8'),
            host: '127.0.0.1',
            port: 8080,
        },
    });
}

export function ownerCtx(env: RulesTestEnvironment) {
    return env.authenticatedContext(OWNER_UID, { role: 'owner' });
}

export function adminCtx(env: RulesTestEnvironment) {
    return env.authenticatedContext(ADMIN_UID, { role: 'admin' });
}

export function userCtx(env: RulesTestEnvironment, uid: string = USER_UID) {
    return env.authenticatedContext(uid, { role: 'user' });
}

export function anonCtx(env: RulesTestEnvironment) {
    return env.unauthenticatedContext();
}

/**
 * Seed a `users/{uid}` document with security rules disabled.
 * Used to prepare documents before testing reads/updates against them.
 */
export async function seedUser(
    env: RulesTestEnvironment,
    uid: string,
    role: 'owner' | 'admin' | 'user' = 'user',
    extra: Record<string, unknown> = {},
): Promise<void> {
    await env.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc(`users/${uid}`).set({
            uid,
            email: `${uid}@example.com`,
            displayName: uid,
            photoURL: null,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: { theme: 'system', emailNotifications: false },
            ...extra,
        });
    });
}

export async function seedContent(
    env: RulesTestEnvironment,
    id: string = 'post-1',
): Promise<void> {
    await env.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc(`content/${id}`).set({
            title: 'Seed',
            body: 'seed body',
            authorUid: OWNER_UID,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    });
}

export async function seedAudit(
    env: RulesTestEnvironment,
    id: string = 'audit-1',
): Promise<void> {
    await env.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc(`audit/${id}`).set({
            actorUid: OWNER_UID,
            targetUid: USER_UID,
            fromRole: 'user',
            toRole: 'admin',
            at: new Date(),
        });
    });
}

export async function seedRateLimit(
    env: RulesTestEnvironment,
    actorUid: string = OWNER_UID,
): Promise<void> {
    await env.withSecurityRulesDisabled(async (ctx) => {
        await ctx
            .firestore()
            .doc(`rateLimits/setUserRole/actors/${actorUid}`)
            .set({
                windowStart: new Date(),
                count: 0,
            });
    });
}
