/**
 * Integration test for the RoleModule ↔ UserProfileService seam.
 *
 * The two used to be independent: RoleModule opened its own onSnapshot on
 * users/{uid} while UserProfileService cached the same document with a 5-minute
 * TTL, and neither told the other anything. A role change rewrites that
 * document, so a promoted or demoted user could keep reading their pre-change
 * profile for the rest of the TTL.
 *
 * Each module's own unit tests cover it in isolation and would both stay green
 * if this wiring were removed, which is exactly why this test exists
 * separately: it asserts the two cooperate.
 */
import { describe, expect, it, vi } from 'vitest';
import { RoleModule } from '../../../src/modules/role.js';
import { UserProfileService } from '../../../src/services/user-profile-service.js';

function wire(initialProfile) {
    const repo = {
        findById: vi.fn(async () => ({ success: true, data: initialProfile })),
        onProfileChange: vi.fn((uid, onNext) => {
            repo._onNext = onNext;
            return vi.fn();
        }),
        _onNext: null,
    };
    const service = new UserProfileService(repo);

    let authCb = null;
    const user = {
        uid: initialProfile.uid,
        getIdToken: vi.fn(async () => 'token'),
        getIdTokenResult: vi.fn(async () => ({ claims: { role: 'owner' } })),
    };
    const auth = {
        onAuthStateChanged: (fn) => {
            authCb = fn;
        },
        getCurrentUser: () => user,
    };
    const role = new RoleModule(auth, repo, {
        onProfileSnapshot: (p) => service.primeCache(p),
    });

    return {
        repo,
        service,
        role,
        user,
        signIn: async () => {
            role.init();
            await authCb(user);
            await Promise.resolve();
        },
    };
}

describe('a role change does not leave a stale cached profile', () => {
    it('serves the new role immediately rather than after the cache TTL', async () => {
        const { repo, service, signIn } = wire({ uid: 'u1', role: 'user', displayName: 'A' });

        const before = await service.getProfile('u1');
        expect(before.data.role).toBe('user');

        await signIn();

        // setUserRole rewrote the document; the shared listener fires.
        await repo._onNext({
            uid: 'u1',
            role: 'owner',
            displayName: 'A',
            roleChangedAt: new Date('2026-01-01T00:00:00Z'),
        });

        const after = await service.getProfile('u1');
        expect(after.data.role).toBe('owner');

        // Served from the primed cache — no second fetch was needed.
        expect(repo.findById).toHaveBeenCalledTimes(1);
    });

    it('pushes the fresh profile to state listeners, so the UI re-renders', async () => {
        const { repo, service, signIn } = wire({ uid: 'u1', role: 'user' });
        await signIn();

        const seen = [];
        service.onStateChange((p) => seen.push(p));

        const updated = { uid: 'u1', role: 'admin' };
        await repo._onNext(updated);

        expect(seen).toContainEqual(updated);
    });

    it('opens exactly one users/{uid} listener between the two modules', async () => {
        // The point of routing RoleModule through the repository: one read path,
        // not two independent subscriptions to the same document.
        const { repo, signIn } = wire({ uid: 'u1', role: 'user' });
        await signIn();
        expect(repo.onProfileChange).toHaveBeenCalledTimes(1);
    });
});
