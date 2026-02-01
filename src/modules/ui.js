/**
 * UIModule - Manages UI state and status messages
 *
 * Responsibilities:
 * - Status message display (loading, error, success)
 * - Homepage content visibility based on auth state
 */
export class UIModule {
    constructor() {
        this.statusElement = null;
        this.homepageLogo = null;
        this.welcomeMessage = null;
        this.contentCard = null;
    }

    init() {
        this.statusElement = document.getElementById('status');
        this.homepageLogo = document.getElementById('homepageLogo');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.contentCard = document.getElementById('contentCard');
    }

    showStatus(message, type = 'loading') {
        if (!this.statusElement) return;

        this.statusElement.textContent = message;
        this.statusElement.className = `status ${type}`;
        this.statusElement.style.display = 'block';

        // Show content card when status is visible
        if (this.contentCard) {
            this.contentCard.style.display = 'block';
        }
    }

    hideStatus() {
        if (!this.statusElement) return;
        this.statusElement.style.display = 'none';

        // Hide content card if no other content is visible
        if (this.contentCard && this.welcomeMessage && this.welcomeMessage.style.display === 'none') {
            this.contentCard.style.display = 'none';
        }
    }

    /**
     * Update homepage UI based on auth state
     * @param {Object|null} user - Firebase user object or null
     */
    updateAuthUI(user) {
        if (user) {
            // Authenticated: Hide logo, show welcome message in card
            if (this.homepageLogo) {
                this.homepageLogo.style.display = 'none';
            }
            if (this.welcomeMessage) {
                this.welcomeMessage.style.display = 'block';
            }
            if (this.contentCard) {
                this.contentCard.style.display = 'block';
            }
        } else {
            // Unauthenticated: Show logo, hide welcome message and card
            if (this.homepageLogo) {
                this.homepageLogo.style.display = 'block';
            }
            if (this.welcomeMessage) {
                this.welcomeMessage.style.display = 'none';
            }
            // Only hide card if status is also not visible
            if (this.contentCard && (!this.statusElement || this.statusElement.style.display === 'none')) {
                this.contentCard.style.display = 'none';
            }
        }
    }

    /**
     * Keep backward compatibility
     */
    updateLoginButton(user) {
        this.updateAuthUI(user);
    }

    /**
     * Legacy methods - no-op for backward compatibility
     * @deprecated NavigationModule handles login/logout
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
