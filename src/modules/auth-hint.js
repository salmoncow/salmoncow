/**
 * AuthHintModule - LocalStorage-based auth state hint
 *
 * Provides instant auth state from localStorage for immediate UI rendering,
 * avoiding blocking wait for Firebase Auth initialization.
 *
 * Storage key: salmoncow_auth_hint
 *
 * Architecture Reference:
 * - .prompts/core/architecture/modular-architecture-principles.md
 */

const STORAGE_KEY = 'salmoncow_auth_hint';

export const AuthHintModule = {
    /**
     * Get cached auth hint from localStorage
     * @returns {{ isAuthenticated: boolean, displayName: string|null, photoURL: string|null }|null}
     */
    getHint() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;

            const hint = JSON.parse(stored);
            // Validate structure
            if (typeof hint.isAuthenticated !== 'boolean') {
                return null;
            }
            return hint;
        } catch {
            return null;
        }
    },

    /**
     * Save auth hint to localStorage
     * @param {Object} user - Firebase user object
     */
    saveHint(user) {
        if (!user) {
            this.clearHint();
            return;
        }

        try {
            const hint = {
                isAuthenticated: true,
                displayName: user.displayName || null,
                photoURL: user.photoURL || null
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(hint));
        } catch {
            // localStorage unavailable, fail silently
        }
    },

    /**
     * Clear auth hint from localStorage (on sign-out)
     */
    clearHint() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // localStorage unavailable, fail silently
        }
    }
};
