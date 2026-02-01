/**
 * UIModule - Manages UI state
 *
 * Simplified module after toast notification migration.
 * Toast notifications are now handled by ToastContainer component.
 * Homepage always shows logo regardless of auth state.
 */
export class UIModule {
    constructor() {
        this.homepageLogo = null;
    }

    init() {
        this.homepageLogo = document.getElementById('homepageLogo');
    }

    /**
     * No-op for backward compatibility
     * Homepage now always shows logo regardless of auth state
     * @param {Object|null} user - Firebase user object or null
     */
    updateLoginButton(user) {
        // No-op - homepage always shows logo
    }

    /**
     * Legacy methods - no-op for backward compatibility
     * @deprecated NavigationModule handles login
     */
    addLoginButtonListener(callback) {
        // No-op: Navigation module handles login
    }

    /**
     * @deprecated NavigationModule handles logout
     */
    addLogoutButtonListener(callback) {
        // No-op: Navigation module handles logout
    }
}
