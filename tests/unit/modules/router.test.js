/**
 * Unit tests for RouterModule.
 *
 * Runs in a plain-node environment; window.location, window.history, and
 * window.addEventListener are stubbed with vi.stubGlobal, following the
 * precedent in tests/unit/modules/theme.test.js — no jsdom.
 *
 * The router had two defects that only show up on a cold deep-link, which is
 * exactly the path a shared or bookmarked URL takes:
 *
 *   1. A blocked navigation wrote the literal string "#null" into the address
 *      bar, because currentRoute is null before the first successful route.
 *   2. An unknown path rendered the home view but left currentRoute pointing at
 *      the unmatched path, so getCurrentRoute() disagreed with what was on
 *      screen — and main.js branches on getCurrentRoute().
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterModule } from '../../../src/modules/router.js';

function makeWindow(initialHash = '') {
    const listeners = new Map();
    const win = {
        location: { hash: initialHash, pathname: '/' },
        history: {
            replaceState: vi.fn((_state, _title, url) => {
                win._replacedWith.push(url);
                // Mirror browser behaviour: replaceState updates the address
                // bar but does NOT fire hashchange.
                win.location.hash = String(url).startsWith('#') ? String(url) : '';
            }),
        },
        addEventListener: vi.fn((type, fn) => {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(fn);
        }),
        _replacedWith: [],
        _fireHashChange() {
            for (const fn of listeners.get('hashchange') || []) fn();
        },
    };
    return win;
}

let win;

beforeEach(() => {
    win = makeWindow();
    vi.stubGlobal('window', win);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('path handling', () => {
    it.each([
        ['', '/'],
        ['#', '/'],
        ['#/', '/'],
        ['#/profile', '/profile'],
        ['#/profile/', '/profile'],
    ])('maps hash %o to path %o', (hash, expected) => {
        win.location.hash = hash;
        expect(new RouterModule().getPathFromHash()).toBe(expected);
    });

    it('normalizes a path without a leading slash', () => {
        expect(new RouterModule().normalizePath('admin')).toBe('/admin');
    });
});

describe('routing', () => {
    it('runs the handler for the matched route', () => {
        const home = vi.fn();
        const profile = vi.fn();
        const r = new RouterModule();
        r.register('/', home);
        r.register('/profile', profile);

        win.location.hash = '#/profile';
        r.init();

        expect(profile).toHaveBeenCalledTimes(1);
        expect(home).not.toHaveBeenCalled();
        expect(r.getCurrentRoute()).toBe('/profile');
    });

    it('does not re-run the handler when the path is unchanged', () => {
        const home = vi.fn();
        const r = new RouterModule();
        r.register('/', home);
        r.init();
        win._fireHashChange();

        expect(home).toHaveBeenCalledTimes(1);
    });

    it('falls back to the home handler for an unknown path', () => {
        const home = vi.fn();
        const r = new RouterModule();
        r.register('/', home);

        win.location.hash = '#/nope';
        r.init();

        expect(home).toHaveBeenCalledTimes(1);
    });

    it('reports the home route after falling back, matching what is displayed', () => {
        // Regression: currentRoute used to keep the unmatched path, so
        // getCurrentRoute() returned '/nope' while the home view was on screen.
        // main.js branches on getCurrentRoute(), so the two must agree.
        const home = vi.fn();
        const r = new RouterModule();
        r.register('/', home);

        win.location.hash = '#/nope';
        r.init();

        expect(r.getCurrentRoute()).toBe('/');
    });

    it('clears the bogus hash after falling back', () => {
        const r = new RouterModule();
        r.register('/', vi.fn());

        win.location.hash = '#/nope';
        r.init();

        expect(win.location.hash).toBe('');
    });
});

describe('navigation guards', () => {
    it('runs the guard with the new and previous path', () => {
        const guard = vi.fn(() => true);
        const r = new RouterModule();
        r.register('/', vi.fn());
        r.register('/admin', vi.fn());
        r.init();

        win.location.hash = '#/admin';
        r.onBeforeNavigate(guard);
        win._fireHashChange();

        expect(guard).toHaveBeenCalledWith('/admin', '/');
    });

    it('blocks navigation when a guard returns false', () => {
        const admin = vi.fn();
        const r = new RouterModule();
        r.register('/', vi.fn());
        r.register('/admin', admin);
        r.init();

        r.onBeforeNavigate(() => false);
        win.location.hash = '#/admin';
        win._fireHashChange();

        expect(admin).not.toHaveBeenCalled();
        expect(r.getCurrentRoute()).toBe('/');
    });

    it('never writes "#null" when blocking a cold deep-link', () => {
        // Regression: on the initial handleRouteChange() from init(),
        // currentRoute is still null. A blocked deep-link (e.g. #/admin while
        // signed out) fell into the else branch and wrote the literal "#null".
        const r = new RouterModule();
        r.register('/', vi.fn());
        r.register('/admin', vi.fn());
        r.onBeforeNavigate(() => false);

        win.location.hash = '#/admin';
        r.init();

        expect(win._replacedWith.join('|')).not.toContain('null');
        expect(win.location.hash).toBe('');
    });

    it('restores the previous route when blocking an in-app navigation', () => {
        const r = new RouterModule();
        r.register('/', vi.fn());
        r.register('/profile', vi.fn());
        r.register('/admin', vi.fn());

        win.location.hash = '#/profile';
        r.init();
        expect(r.getCurrentRoute()).toBe('/profile');

        r.onBeforeNavigate((next) => next !== '/admin');
        win.location.hash = '#/admin';
        win._fireHashChange();

        expect(r.getCurrentRoute()).toBe('/profile');
        expect(win.location.hash).toBe('#/profile');
    });

    it('unsubscribes a guard', () => {
        const guard = vi.fn(() => true);
        const r = new RouterModule();
        r.register('/', vi.fn());
        r.register('/profile', vi.fn());
        r.init();

        const off = r.onBeforeNavigate(guard);
        off();

        win.location.hash = '#/profile';
        win._fireHashChange();

        expect(guard).not.toHaveBeenCalled();
    });
});

describe('navigate()', () => {
    it('clears the hash for the home route', () => {
        new RouterModule().navigate('/');
        expect(win.location.hash).toBe('');
    });

    it('sets the hash for a non-home route', () => {
        new RouterModule().navigate('/admin');
        expect(win.location.hash).toBe('/admin');
    });
});
