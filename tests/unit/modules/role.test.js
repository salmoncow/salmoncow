/**
 * Unit tests for RoleModule.
 *
 * This is the client-side authorization state machine, and it was at 0%
 * coverage — the largest gap against §III.1, which asks for 100% on auth paths.
 * Phase 3.3's coverage tooling is what surfaced it.
 *
 * Note there is no Firebase SDK mock here. RoleModule now depends on the
 * UserProfileRepository interface rather than importing onSnapshot itself, so
 * the test injects a plain fake. That the mocking got simpler is the point of
 * the refactor: the module no longer reaches past its layer.
 *
 * The assertions are weighted toward pessimistic paths, because this decides
 * what the UI lets a user reach: an unrecognised claim must not be trusted, a
 * failed token read must not leave a stale elevated role, and sign-out must
 * drop the role and detach the listener.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleModule } from '../../../src/modules/role.js';

/** Fake repository capturing the subscription so tests can drive it. */
function makeRepository() {
    const unsubscribe = vi.fn();
    const repo = {
        onProfileChange: vi.fn((uid, onNext, onError) => {
            repo._uid = uid;
            repo._onNext = onNext;
            repo._onError = onError;
            return unsubscribe;
        }),
        _unsubscribe: unsubscribe,
        _uid: null,
        _onNext: null,
        _onError: null,
    };
    return repo;
}

/** Minimal AuthModule stub: captures the auth-state callback so tests drive it. */
function makeAuth() {
    let cb = null;
    let current = null;
    return {
        onAuthStateChanged: vi.fn((fn) => {
            cb = fn;
        }),
        getCurrentUser: () => current,
        async _emit(user) {
            current = user;
            await cb?.(user);
            await Promise.resolve();
            await Promise.resolve();
        },
    };
}

function makeUser(claimRole, { uid = 'u1', failTokenRead = false } = {}) {
    return {
        uid,
        getIdToken: vi.fn(async () => 'token'),
        getIdTokenResult: vi.fn(async () => {
            if (failTokenRead) throw new Error('token read failed');
            return { claims: claimRole === undefined ? {} : { role: claimRole } };
        }),
    };
}

let auth;
let repo;

beforeEach(() => {
    auth = makeAuth();
    repo = makeRepository();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('construction', () => {
    it.each([
        ['authModule', () => new RoleModule(null, makeRepository())],
        ['a repository', () => new RoleModule({}, null)],
    ])('refuses to construct without %s', (_label, build) => {
        expect(build).toThrow();
    });

    it('starts with an unknown role', () => {
        expect(new RoleModule(auth, repo).getRole()).toBeNull();
    });
});

describe('reading the role claim', () => {
    it.each([['owner'], ['admin'], ['user']])('accepts the %s claim', async (role) => {
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser(role));
        expect(r.getRole()).toBe(role);
    });

    it('falls back to user for an unrecognised claim', async () => {
        // Least privilege: an unexpected value is never trusted as a role, nor
        // passed through verbatim.
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser('superadmin'));
        expect(r.getRole()).toBe('user');
    });

    it('falls back to user when the claim is missing', async () => {
        // The window between first sign-in and the onUserCreate trigger landing.
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser(undefined));
        expect(r.getRole()).toBe('user');
    });

    it('falls back to user when the token read throws', async () => {
        // Fail closed: an unreadable token must not leave the previous role in
        // place, or a demoted owner keeps owner UI until reload.
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser('owner'));
        expect(r.getRole()).toBe('owner');

        await auth._emit(makeUser(null, { failTokenRead: true, uid: 'u2' }));
        expect(r.getRole()).toBe('user');
    });
});

describe('role predicates', () => {
    it.each([
        ['owner', true, true],
        ['admin', false, true],
        ['user', false, false],
    ])('for %s: isOwner=%o isAdminOrOwner=%o', async (role, owner, adminOrOwner) => {
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser(role));
        expect(r.isOwner()).toBe(owner);
        expect(r.isAdminOrOwner()).toBe(adminOrOwner);
    });

    it('is false for both when signed out', () => {
        const r = new RoleModule(auth, repo);
        expect(r.isOwner()).toBe(false);
        expect(r.isAdminOrOwner()).toBe(false);
    });
});

describe('subscribers', () => {
    it('fires immediately with the current value', () => {
        const cb = vi.fn();
        new RoleModule(auth, repo).onRoleChange(cb);
        expect(cb).toHaveBeenCalledWith(null);
    });

    it('notifies on transition', async () => {
        const r = new RoleModule(auth, repo);
        const cb = vi.fn();
        r.onRoleChange(cb);
        r.init();
        await auth._emit(makeUser('admin'));
        expect(cb).toHaveBeenLastCalledWith('admin');
    });

    it('does not notify when the role is unchanged', async () => {
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser('admin'));
        const cb = vi.fn();
        r.onRoleChange(cb);
        cb.mockClear();
        await auth._emit(makeUser('admin', { uid: 'u1' }));
        expect(cb).not.toHaveBeenCalled();
    });

    it('unsubscribes', async () => {
        const r = new RoleModule(auth, repo);
        const cb = vi.fn();
        r.onRoleChange(cb)();
        cb.mockClear();
        r.init();
        await auth._emit(makeUser('owner'));
        expect(cb).not.toHaveBeenCalled();
    });

    it('keeps notifying other subscribers when one throws', async () => {
        const r = new RoleModule(auth, repo);
        r.onRoleChange(() => {
            throw new Error('subscriber boom');
        });
        const good = vi.fn();
        r.onRoleChange(good);
        r.init();
        await expect(auth._emit(makeUser('owner'))).resolves.not.toThrow();
        expect(good).toHaveBeenLastCalledWith('owner');
    });
});

describe('sign-out', () => {
    it('clears the role and detaches the listener', async () => {
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser('owner'));
        expect(r.getRole()).toBe('owner');

        await auth._emit(null);

        expect(r.getRole()).toBeNull();
        expect(repo._unsubscribe).toHaveBeenCalledTimes(1);
    });
});

describe('profile listener', () => {
    it('subscribes through the repository, not the SDK', async () => {
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));
        expect(repo.onProfileChange).toHaveBeenCalledTimes(1);
        expect(repo._uid).toBe('abc');
    });

    it('does not resubscribe when auth fires twice for the same uid', async () => {
        // onAuthStateChanged can fire repeatedly; duplicate listeners would mean
        // duplicate reads and duplicate token refreshes.
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));
        await auth._emit(makeUser('user', { uid: 'abc' }));
        expect(repo.onProfileChange).toHaveBeenCalledTimes(1);
    });

    it('refreshes the token when roleChangedAt advances', async () => {
        const r = new RoleModule(auth, repo);
        r.init();
        const user = makeUser('user', { uid: 'abc' });
        await auth._emit(user);

        await repo._onNext({ uid: 'abc', roleChangedAt: new Date('2026-01-01T00:00:00Z') });

        expect(user.getIdToken).toHaveBeenCalledWith(true);
    });

    it('does not refresh again for an unchanged roleChangedAt', async () => {
        const r = new RoleModule(auth, repo);
        r.init();
        const user = makeUser('user', { uid: 'abc' });
        await auth._emit(user);

        const doc = { uid: 'abc', roleChangedAt: new Date('2026-01-01T00:00:00Z') };
        await repo._onNext(doc);
        user.getIdToken.mockClear();
        await repo._onNext(doc);

        expect(user.getIdToken).not.toHaveBeenCalled();
    });

    it('ignores a missing document', async () => {
        const r = new RoleModule(auth, repo);
        r.init();
        const user = makeUser('user', { uid: 'abc' });
        await auth._emit(user);

        await repo._onNext(null);

        expect(user.getIdToken).not.toHaveBeenCalled();
    });

    it('stays quiet on permission-denied, which is a normal sign-out race', async () => {
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));

        repo._onError({ code: 'permission-denied' });

        expect(console.error).not.toHaveBeenCalled();
    });

    it('logs other listener errors', async () => {
        const r = new RoleModule(auth, repo);
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));

        repo._onError({ code: 'unavailable' });

        expect(console.error).toHaveBeenCalled();
    });
});

describe('forwarding the profile to the cache', () => {
    it('hands every profile update to onProfileSnapshot', async () => {
        // This is what keeps UserProfileService's 5-minute cache from serving a
        // pre-role-change profile: both now read the document off one listener.
        const onProfileSnapshot = vi.fn();
        const r = new RoleModule(auth, repo, { onProfileSnapshot });
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));

        const profile = { uid: 'abc', displayName: 'A' };
        await repo._onNext(profile);

        expect(onProfileSnapshot).toHaveBeenCalledWith(profile);
    });

    it('forwards even when roleChangedAt has not moved', async () => {
        // A plain profile edit still needs to reach the cache.
        const onProfileSnapshot = vi.fn();
        const r = new RoleModule(auth, repo, { onProfileSnapshot });
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));

        await repo._onNext({ uid: 'abc', displayName: 'edited' });

        expect(onProfileSnapshot).toHaveBeenCalledTimes(1);
    });

    it('does not forward a missing document', async () => {
        const onProfileSnapshot = vi.fn();
        const r = new RoleModule(auth, repo, { onProfileSnapshot });
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));

        await repo._onNext(null);

        expect(onProfileSnapshot).not.toHaveBeenCalled();
    });

    it('still refreshes the role when the consumer throws', async () => {
        // A broken cache consumer must not take down authorization.
        const r = new RoleModule(auth, repo, {
            onProfileSnapshot: () => {
                throw new Error('consumer boom');
            },
        });
        r.init();
        const user = makeUser('user', { uid: 'abc' });
        await auth._emit(user);

        await expect(
            repo._onNext({ uid: 'abc', roleChangedAt: new Date('2026-01-01T00:00:00Z') }),
        ).resolves.not.toThrow();
        expect(user.getIdToken).toHaveBeenCalledWith(true);
    });
});

describe('refreshRole()', () => {
    it('returns null and does nothing when signed out', async () => {
        await expect(new RoleModule(auth, repo).refreshRole()).resolves.toBeNull();
    });

    it('forces a token refresh and re-reads the claim', async () => {
        const r = new RoleModule(auth, repo);
        r.init();
        const user = makeUser('user', { uid: 'abc' });
        await auth._emit(user);

        user.getIdTokenResult.mockResolvedValueOnce({ claims: { role: 'owner' } });
        await expect(r.refreshRole()).resolves.toBe('owner');
        expect(user.getIdToken).toHaveBeenCalledWith(true);
        expect(r.getRole()).toBe('owner');
    });
});
