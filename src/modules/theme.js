/**
 * ThemeModule
 *
 * Applies the user's colour-scheme preference to <html data-theme>.
 * Three inputs, ordered by authority:
 *   1. Firestore preferences.theme (when signed-in) — authoritative.
 *   2. localStorage 'salmoncow.theme' — first-paint cache + signed-out default.
 *   3. window.matchMedia('(prefers-color-scheme: dark)') — resolves 'system'.
 *
 * The inline pre-paint <script> in src/index.html handles the FOUC-critical
 * first-paint step using the same localStorage key; this module takes over
 * once the app bundle loads, then stays in sync via optimistic apply and
 * profile-state callbacks (see main.js + modules/user-portal.js).
 *
 * Pure DOM + window APIs; no Firebase imports; no service dependencies.
 *
 * Feature spec: .specs/features/002-dark-mode-theme/spec.md §XI.1
 */

const THEMES = Object.freeze(['light', 'dark', 'system']);
const STORAGE_KEY = 'salmoncow.theme';
const SYSTEM_QUERY = '(prefers-color-scheme: dark)';

function validate(v) {
    return THEMES.includes(v) ? v : null;
}

function readStored() {
    try {
        return validate(window.localStorage.getItem(STORAGE_KEY)) ?? 'system';
    } catch {
        return 'system';
    }
}

function writeStored(v) {
    try {
        window.localStorage.setItem(STORAGE_KEY, v);
    } catch {
        /* private-mode / disabled storage: ignore */
    }
}

export class ThemeModule {
    constructor() {
        this._preference = 'system';
        this._mediaQuery = null;
        this._mediaListener = null;
    }

    /**
     * Read the cached preference, apply it, and wire the system-preference
     * watcher if the resolved preference is 'system'. Idempotent.
     */
    init() {
        this.applyPreference(readStored());
    }

    /**
     * Apply an explicit preference. Whitelisted; invalid values are a no-op
     * with a console warning. Updates DOM attribute, localStorage, and the
     * matchMedia subscription.
     *
     * @param {'light'|'dark'|'system'} theme
     */
    applyPreference(theme) {
        const valid = validate(theme);
        if (!valid) {
            console.warn(`ThemeModule: ignoring invalid theme "${theme}"`);
            return;
        }
        this._preference = valid;
        writeStored(valid);
        this._renderResolved();
        if (valid === 'system') {
            this._attachSystemWatcher();
        } else {
            this._detachSystemWatcher();
        }
    }

    /**
     * Called from the profile-state hook. Accepts the full profile object or
     * null (signed-out). Ignores profiles missing a preference.
     *
     * @param {{ preferences?: { theme?: string } } | null} profile
     */
    onProfileLoaded(profile) {
        const pref = profile?.preferences?.theme;
        if (!pref) return;
        this.applyPreference(pref);
    }

    /**
     * Called on sign-out. Intentional no-op: the localStorage cache still
     * holds the last-known preference, and leaving it applied avoids a
     * jarring flash back to 'system' during the sign-out animation.
     * Spec AC-5.
     */
    onSignOut() {
        /* no-op — see docstring */
    }

    /**
     * @returns {'light'|'dark'} The currently-applied resolved theme.
     *                           Exposed for tests and diagnostics.
     */
    getResolvedTheme() {
        return this._resolve(this._preference);
    }

    /**
     * Tear down the matchMedia listener. Idempotent.
     */
    destroy() {
        this._detachSystemWatcher();
    }

    /* ---------- internals ---------- */

    _resolve(preference) {
        if (preference === 'light' || preference === 'dark') return preference;
        try {
            return window.matchMedia(SYSTEM_QUERY).matches ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    }

    _renderResolved() {
        const resolved = this._resolve(this._preference);
        try {
            document.documentElement.dataset.theme = resolved;
        } catch {
            /* SSR / test environment without document: ignore */
        }
    }

    _attachSystemWatcher() {
        if (this._mediaQuery) return;
        try {
            this._mediaQuery = window.matchMedia(SYSTEM_QUERY);
        } catch {
            return;
        }
        this._mediaListener = () => this._renderResolved();
        this._mediaQuery.addEventListener('change', this._mediaListener);
    }

    _detachSystemWatcher() {
        if (!this._mediaQuery || !this._mediaListener) return;
        this._mediaQuery.removeEventListener('change', this._mediaListener);
        this._mediaQuery = null;
        this._mediaListener = null;
    }
}
