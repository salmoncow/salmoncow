/**
 * Unit tests for RoleModule.
 *
 * This is the client-side authorization state machine, and it was at 0%
 * coverage — the single largest gap against §III.1, which asks for 100% on
 * auth paths. Coverage tooling in Phase 3.3 is what surfaced it.
 *
 * Runs in a plain-node environment; the Firebase SDK is mocked at the module
 * boundary and auth is a hand-rolled stub, following the precedent in
 * tests/unit/modules/theme.test.js — no jsdom.
 *
 * These assertions are about *authorization* behaviour, so the important cases
 * are the pessimistic ones: an unrecognised claim must not be trusted, a failed
 * token read must not leave a stale elevated role, and sign-out must drop the
 * role and detach the listener.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const onSnapshotMock = vi.fn();
const docMock = vi.fn((_db, ...path) => ({ path: path.join('/') }));

vi.mock('../../../src/infrastructure/firebase-sdk.js', () => ({
    doc: (...args) => docMock(...args),
    onSnapshot: (...args) => onSnapshotMock(...args),
}));

const { RoleModule } = await import('../../../src/modules/role.js');

/** Minimal AuthModule stub: captures the auth-state callback so tests drive it. */
function makeAuth() {
    let cb = null;
    let current = null;
    return {
        onAuthStateChanged: vi.fn((fn) => {
            cb = fn;
        }),
        getCurrentUser: () => current,
        /** Test helper: simulate sign-in / sign-out. */
        async _emit(user) {
            current = user;
            await cb?.(user);
            // Let the internal refresh→subscribe promise chain settle.
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
let db;

beforeEach(() => {
    onSnapshotMock.mockReset();
    docMock.mockClear();
    onSnapshotMock.mockReturnValue(vi.fn()); // default unsubscribe
    auth = makeAuth();
    db = {};
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('construction', () => {
    it.each([
        ['authModule', () => new RoleModule(null, {})],
        ['db', () => new RoleModule({}, null)],
    ])('refuses to construct without %s', (_label, build) => {
        expect(build).toThrow();
    });

    it('starts with an unknown role', () => {
        expect(new RoleModule(auth, db).getRole()).toBeNull();
    });
});

describe('reading the role claim', () => {
    it.each([['owner'], ['admin'], ['user']])('accepts the %s claim', async (role) => {
        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser(role));
        expect(r.getRole()).toBe(role);
    });

    it('falls back to user for an unrecognised claim', async () => {
        // Least privilege: an unexpected value must never be trusted as a role,
        // and must never be passed through verbatim.
        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser('superadmin'));
        expect(r.getRole()).toBe('user');
    });

    it('falls back to user when the claim is missing', async () => {
        // Happens between first sign-in and the onUserCreate trigger landing.
        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser(undefined));
        expect(r.getRole()).toBe('user');
    });

    it('falls back to user when the token read throws', async () => {
        // Fail closed: an unreadable token must not leave the previous role in
        // place, or a demoted owner keeps owner UI until reload.
        const r = new RoleModule(auth, db);
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
        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser(role));
        expect(r.isOwner()).toBe(owner);
        expect(r.isAdminOrOwner()).toBe(adminOrOwner);
    });

    it('is false for both when signed out', () => {
        const r = new RoleModule(auth, db);
        expect(r.isOwner()).toBe(false);
        expect(r.isAdminOrOwner()).toBe(false);
    });
});

describe('subscribers', () => {
    it('fires immediately with the current value', () => {
        const r = new RoleModule(auth, db);
        const cb = vi.fn();
        r.onRoleChange(cb);
        expect(cb).toHaveBeenCalledWith(null);
    });

    it('notifies on transition', async () => {
        const r = new RoleModule(auth, db);
        const cb = vi.fn();
        r.onRoleChange(cb);
        r.init();
        await auth._emit(makeUser('admin'));
        expect(cb).toHaveBeenLastCalledWith('admin');
    });

    it('does not notify when the role is unchanged', async () => {
        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser('admin'));
        const cb = vi.fn();
        r.onRoleChange(cb);
        cb.mockClear();
        await auth._emit(makeUser('admin', { uid: 'u1' }));
        expect(cb).not.toHaveBeenCalled();
    });

    it('unsubscribes', async () => {
        const r = new RoleModule(auth, db);
        const cb = vi.fn();
        const off = r.onRoleChange(cb);
        off();
        cb.mockClear();
        r.init();
        await auth._emit(makeUser('owner'));
        expect(cb).not.toHaveBeenCalled();
    });

    it('keeps notifying other subscribers when one throws', async () => {
        const r = new RoleModule(auth, db);
        const bad = vi.fn(() => {
            throw new Error('subscriber boom');
        });
        const good = vi.fn();
        r.onRoleChange(bad);
        r.onRoleChange(good);
        r.init();
        await expect(auth._emit(makeUser('owner'))).resolves.not.toThrow();
        expect(good).toHaveBeenLastCalledWith('owner');
    });
});

describe('sign-out', () => {
    it('clears the role and detaches the mirror listener', async () => {
        const unsub = vi.fn();
        onSnapshotMock.mockReturnValue(unsub);

        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser('owner'));
        expect(r.getRole()).toBe('owner');

        await auth._emit(null);

        expect(r.getRole()).toBeNull();
        expect(unsub).toHaveBeenCalledTimes(1);
    });
});

describe('mirror listener', () => {
    it('subscribes to the signed-in user document', async () => {
        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));
        expect(docMock).toHaveBeenCalledWith(db, 'users', 'abc');
        expect(onSnapshotMock).toHaveBeenCalledTimes(1);
    });

    it('does not resubscribe when auth fires twice for the same uid', async () => {
        // onAuthStateChanged can fire repeatedly; duplicate listeners would
        // mean duplicate reads and duplicate token refreshes.
        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));
        await auth._emit(makeUser('user', { uid: 'abc' }));
        expect(onSnapshotMock).toHaveBeenCalledTimes(1);
    });

    it('refreshes the token when roleChangedAt advances', async () => {
        const r = new RoleModule(auth, db);
        r.init();
        const user = makeUser('user', { uid: 'abc' });
        await auth._emit(user);

        const onNext = onSnapshotMock.mock.calls[0][1];
        await onNext({
            exists: () => true,
            data: () => ({ roleChangedAt: { toDate: () => new Date('2026-01-01T00:00:00Z') } }),
        });

        expect(user.getIdToken).toHaveBeenCalledWith(true);
    });

    it('ignores a snapshot for a document that does not exist', async () => {
        const r = new RoleModule(auth, db);
        r.init();
        const user = makeUser('user', { uid: 'abc' });
        await auth._emit(user);

        const onNext = onSnapshotMock.mock.calls[0][1];
        await onNext({ exists: () => false, data: () => ({}) });

        expect(user.getIdToken).not.toHaveBeenCalled();
    });

    it('stays quiet on permission-denied, which is a normal sign-out race', async () => {
        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));

        const onError = onSnapshotMock.mock.calls[0][2];
        onError({ code: 'permission-denied' });

        expect(console.error).not.toHaveBeenCalled();
    });

    it('logs other listener errors', async () => {
        const r = new RoleModule(auth, db);
        r.init();
        await auth._emit(makeUser('user', { uid: 'abc' }));

        const onError = onSnapshotMock.mock.calls[0][2];
        onError({ code: 'unavailable' });

        expect(console.error).toHaveBeenCalled();
    });
});

describe('refreshRole()', () => {
    it('returns null and does nothing when signed out', async () => {
        const r = new RoleModule(auth, db);
        await expect(r.refreshRole()).resolves.toBeNull();
    });

    it('forces a token refresh and re-reads the claim', async () => {
        const r = new RoleModule(auth, db);
        r.init();
        const user = makeUser('user', { uid: 'abc' });
        await auth._emit(user);

        user.getIdTokenResult.mockResolvedValueOnce({ claims: { role: 'owner' } });
        await expect(r.refreshRole()).resolves.toBe('owner');
        expect(user.getIdToken).toHaveBeenCalledWith(true);
        expect(r.getRole()).toBe('owner');
    });
});
