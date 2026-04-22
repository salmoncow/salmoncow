/**
 * Unit tests for ThemeModule.
 *
 * Run in a plain-node environment: window, document, localStorage, and
 * matchMedia are stubbed via vi.stubGlobal — no jsdom dependency needed.
 *
 * Feature spec: .specs/features/002-dark-mode-theme/spec.md §XI.6
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeModule } from '../../../src/modules/theme.js';

/* ---------- stub helpers ---------- */

function makeMatchMedia(initialMatches = false) {
    const listeners = new Set();
    const mq = {
        matches: initialMatches,
        addEventListener: vi.fn((event, fn) => {
            if (event === 'change') listeners.add(fn);
        }),
        removeEventListener: vi.fn((event, fn) => {
            if (event === 'change') listeners.delete(fn);
        }),
        /** Test helper: simulate an OS preference change. */
        _fire(nextMatches) {
            mq.matches = nextMatches;
            for (const fn of listeners) fn({ matches: nextMatches });
        },
        _listenerCount: () => listeners.size,
    };
    const matchMedia = vi.fn(() => mq);
    return { mq, matchMedia };
}

function makeLocalStorage(initial = {}) {
    const store = { ...initial };
    return {
        getItem: vi.fn((k) => (k in store ? store[k] : null)),
        setItem: vi.fn((k, v) => {
            store[k] = String(v);
        }),
        removeItem: vi.fn((k) => {
            delete store[k];
        }),
        clear: vi.fn(() => {
            for (const k of Object.keys(store)) delete store[k];
        }),
        _store: store,
    };
}

function makeDocument() {
    const dataset = {};
    return {
        documentElement: { dataset },
    };
}

function stubEnv({ stored = undefined, osDark = false } = {}) {
    const localStorage = makeLocalStorage(
        stored === undefined ? {} : { 'salmoncow.theme': stored },
    );
    const { mq, matchMedia } = makeMatchMedia(osDark);
    const document = makeDocument();
    vi.stubGlobal('window', { localStorage, matchMedia });
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('document', document);
    return { localStorage, matchMedia, mq, document };
}

/* ---------- tests ---------- */

describe('ThemeModule', () => {
    let warnSpy;

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        warnSpy.mockRestore();
    });

    it('init() with no localStorage resolves "system" against the OS preference (light)', () => {
        const { document, mq } = stubEnv({ stored: undefined, osDark: false });
        const theme = new ThemeModule();

        theme.init();

        expect(document.documentElement.dataset.theme).toBe('light');
        expect(mq._listenerCount()).toBe(1); // system mode → watcher attached
    });

    it('init() with localStorage="dark" applies dark and does NOT attach the matchMedia listener', () => {
        const { document, mq } = stubEnv({ stored: 'dark', osDark: false });
        const theme = new ThemeModule();

        theme.init();

        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(mq._listenerCount()).toBe(0);
    });

    it('init() with localStorage="system" + OS-dark applies dark and attaches the listener', () => {
        const { document, mq } = stubEnv({ stored: 'system', osDark: true });
        const theme = new ThemeModule();

        theme.init();

        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(mq._listenerCount()).toBe(1);
    });

    it('init() with a garbage localStorage value falls back to system-resolved', () => {
        const { document } = stubEnv({ stored: 'purple', osDark: false });
        const theme = new ThemeModule();

        theme.init();

        expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('applyPreference("dark") sets dataset + localStorage and detaches any system listener', () => {
        const { document, localStorage, mq } = stubEnv({ stored: 'system', osDark: false });
        const theme = new ThemeModule();
        theme.init();
        expect(mq._listenerCount()).toBe(1);

        theme.applyPreference('dark');

        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(localStorage.setItem).toHaveBeenCalledWith('salmoncow.theme', 'dark');
        expect(mq._listenerCount()).toBe(0);
    });

    it('applyPreference("system") attaches the listener; OS change flips the resolved theme', () => {
        const { document, mq } = stubEnv({ stored: 'dark', osDark: false });
        const theme = new ThemeModule();
        theme.init();
        expect(mq._listenerCount()).toBe(0);

        theme.applyPreference('system');
        expect(mq._listenerCount()).toBe(1);
        expect(document.documentElement.dataset.theme).toBe('light'); // OS is light

        mq._fire(true); // OS switches to dark
        expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('applyPreference() with an invalid value is a no-op and warns', () => {
        const { document, localStorage } = stubEnv({ stored: 'light', osDark: false });
        const theme = new ThemeModule();
        theme.init();
        localStorage.setItem.mockClear();
        document.documentElement.dataset.theme = 'light';

        theme.applyPreference('neon');

        expect(document.documentElement.dataset.theme).toBe('light');
        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledOnce();
    });

    it('destroy() removes the matchMedia listener; subsequent OS changes are ignored', () => {
        const { document, mq } = stubEnv({ stored: 'system', osDark: false });
        const theme = new ThemeModule();
        theme.init();
        expect(mq._listenerCount()).toBe(1);

        theme.destroy();
        expect(mq._listenerCount()).toBe(0);

        const before = document.documentElement.dataset.theme;
        mq._fire(true);
        expect(document.documentElement.dataset.theme).toBe(before);
    });

    it('destroy() is idempotent', () => {
        const { mq } = stubEnv({ stored: 'system', osDark: false });
        const theme = new ThemeModule();
        theme.init();

        theme.destroy();
        theme.destroy();

        expect(mq._listenerCount()).toBe(0);
    });

    it('onProfileLoaded({ preferences: { theme: "light" } }) is equivalent to applyPreference("light")', () => {
        const { document, localStorage } = stubEnv({ stored: 'system', osDark: true });
        const theme = new ThemeModule();
        theme.init();
        expect(document.documentElement.dataset.theme).toBe('dark');

        theme.onProfileLoaded({ preferences: { theme: 'light' } });

        expect(document.documentElement.dataset.theme).toBe('light');
        expect(localStorage.setItem).toHaveBeenLastCalledWith('salmoncow.theme', 'light');
    });

    it('onProfileLoaded(null) is a no-op (signed-out guard)', () => {
        const { document } = stubEnv({ stored: 'dark', osDark: false });
        const theme = new ThemeModule();
        theme.init();
        const before = document.documentElement.dataset.theme;

        theme.onProfileLoaded(null);

        expect(document.documentElement.dataset.theme).toBe(before);
    });

    it('onProfileLoaded({ preferences: {} }) with missing theme is a no-op', () => {
        const { document } = stubEnv({ stored: 'dark', osDark: false });
        const theme = new ThemeModule();
        theme.init();
        const before = document.documentElement.dataset.theme;

        theme.onProfileLoaded({ preferences: {} });

        expect(document.documentElement.dataset.theme).toBe(before);
    });

    it('getResolvedTheme() returns the currently-applied concrete theme', () => {
        stubEnv({ stored: 'system', osDark: true });
        const theme = new ThemeModule();
        theme.init();

        expect(theme.getResolvedTheme()).toBe('dark');

        theme.applyPreference('light');
        expect(theme.getResolvedTheme()).toBe('light');
    });
});
