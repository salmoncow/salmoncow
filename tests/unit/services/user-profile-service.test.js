/**
 * Unit tests for UserProfileService.updatePreferences.
 *
 * Regression coverage for issue #42: writing one preference must not clobber
 * sibling preferences in the persisted `preferences` map. The service must
 * emit Firestore dotted-path updates so the repo merges field-by-field
 * instead of replacing the whole map.
 */
import { describe, expect, it } from 'vitest';
import { UserProfileService } from '../../../src/services/user-profile-service.js';
import { success } from '../../../src/repositories/user-profile-repository.js';

/**
 * In-memory fake repo that mirrors Firestore `updateDoc` semantics:
 * top-level keys overwrite, but a single-level dotted key (`a.b`) merges
 * into the nested map at `a`. That asymmetry is the whole point of the
 * fix — these tests would pass against a buggy repo if we didn't model it.
 */
function makeFakeRepo(initialDoc = null) {
    const store = new Map();
    if (initialDoc?.uid) {
        store.set(initialDoc.uid, structuredClone(initialDoc));
    }
    const calls = [];

    return {
        store,
        calls,
        async findById(uid) {
            const doc = store.get(uid);
            return success(doc ? structuredClone(doc) : null);
        },
        async update(uid, updates) {
            calls.push({ uid, updates: structuredClone(updates) });
            const doc = store.get(uid) ?? { uid };
            for (const [key, value] of Object.entries(updates)) {
                if (key.includes('.')) {
                    const [head, ...rest] = key.split('.');
                    if (rest.length !== 1) {
                        throw new Error(`fake supports single-level dotted paths only, got "${key}"`);
                    }
                    doc[head] = { ...(doc[head] ?? {}), [rest[0]]: value };
                } else {
                    doc[key] = value;
                }
            }
            store.set(uid, doc);
            return success(structuredClone(doc));
        },
        async save(profile) {
            store.set(profile.uid, structuredClone(profile));
            return success(structuredClone(profile));
        },
        async delete() {
            return success({ deleted: true });
        },
        async exists(uid) {
            return success(store.has(uid));
        },
    };
}

describe('UserProfileService.updatePreferences', () => {
    it('emits dotted-path keys so a single-field update merges into the map', async () => {
        const repo = makeFakeRepo({
            uid: 'u1',
            preferences: { theme: 'system', emailNotifications: false },
        });
        const service = new UserProfileService(repo);

        const result = await service.updatePreferences('u1', { theme: 'dark' });

        expect(result.success).toBe(true);
        expect(repo.calls).toHaveLength(1);
        expect(repo.calls[0].updates).toEqual({ 'preferences.theme': 'dark' });
        expect(repo.store.get('u1').preferences).toEqual({
            theme: 'dark',
            emailNotifications: false,
        });
    });

    it('flattens multiple keys in a single call', async () => {
        const repo = makeFakeRepo({ uid: 'u1', preferences: { other: 'keep' } });
        const service = new UserProfileService(repo);

        await service.updatePreferences('u1', { theme: 'dark', emailNotifications: false });

        expect(repo.calls[0].updates).toEqual({
            'preferences.theme': 'dark',
            'preferences.emailNotifications': false,
        });
        expect(repo.store.get('u1').preferences).toEqual({
            other: 'keep',
            theme: 'dark',
            emailNotifications: false,
        });
    });

    it('two sequential preference updates both persist (regression for #42)', async () => {
        const repo = makeFakeRepo({ uid: 'u1', preferences: {} });
        const service = new UserProfileService(repo);

        await service.updatePreferences('u1', { emailNotifications: false });
        await service.updatePreferences('u1', { theme: 'dark' });

        expect(repo.store.get('u1').preferences).toEqual({
            emailNotifications: false,
            theme: 'dark',
        });
    });

    it('updates the in-memory cache with the merged profile', async () => {
        const repo = makeFakeRepo({
            uid: 'u1',
            preferences: { theme: 'system', emailNotifications: false },
        });
        const service = new UserProfileService(repo);

        await service.updatePreferences('u1', { theme: 'dark' });
        const cached = service.getCached('u1');

        expect(cached.preferences).toEqual({
            theme: 'dark',
            emailNotifications: false,
        });
    });

    it('notifies state-change listeners with the merged profile', async () => {
        const repo = makeFakeRepo({
            uid: 'u1',
            preferences: { theme: 'system', emailNotifications: false },
        });
        const service = new UserProfileService(repo);

        const observed = [];
        service.onStateChange((profile) => observed.push(profile));

        await service.updatePreferences('u1', { theme: 'dark' });

        expect(observed).toHaveLength(1);
        expect(observed[0].preferences).toEqual({
            theme: 'dark',
            emailNotifications: false,
        });
    });

    it('rejects missing uid', async () => {
        const repo = makeFakeRepo();
        const service = new UserProfileService(repo);

        const result = await service.updatePreferences('', { theme: 'dark' });

        expect(result.success).toBe(false);
        expect(result.code).toBe('INVALID_UID');
        expect(repo.calls).toHaveLength(0);
    });

    it('rejects non-object preferences', async () => {
        const repo = makeFakeRepo();
        const service = new UserProfileService(repo);

        const result = await service.updatePreferences('u1', null);

        expect(result.success).toBe(false);
        expect(result.code).toBe('INVALID_PREFERENCES');
        expect(repo.calls).toHaveLength(0);
    });
});
