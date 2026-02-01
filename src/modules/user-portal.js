/**
 * UserPortalModule - Controller for User Portal
 *
 * Manages user profile display and preference updates.
 * Connects UI component with UserProfileService.
 *
 * Responsibilities:
 * - Initialize and manage UserPortal component
 * - Load profile on auth state change
 * - Handle preference updates
 * - Clear state on sign out
 *
 * Architecture Reference:
 * - .prompts/core/architecture/modular-architecture-principles.md
 * - .prompts/core/architecture/code-structure.md (Module Pattern)
 */
export class UserPortalModule {
    /**
     * Create UserPortalModule
     * @param {import('../services/user-profile-service.js').UserProfileService} profileService
     */
    constructor(profileService) {
        if (!profileService) {
            throw new Error('ProfileService is required');
        }
        this.profileService = profileService;
        this.container = null;
        this.portal = null;
        this.currentUser = null;
        this.unsubscribeAuth = null;
    }

    /**
     * Initialize the module
     * @param {string} containerId - ID of container element
     */
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn(`UserPortalModule: Container #${containerId} not found`);
            return;
        }

        this.createPortalComponent();
        this.setupEventListeners();
    }

    /**
     * Create and mount the UserPortal component
     */
    createPortalComponent() {
        this.portal = document.createElement('user-portal');
        this.container.appendChild(this.portal);
    }

    /**
     * Setup event listeners for preference changes
     */
    setupEventListeners() {
        if (!this.portal) return;

        this.portal.addEventListener('preference-change', async (event) => {
            const { key, value } = event.detail;
            await this.handlePreferenceChange(key, value);
        });
    }

    /**
     * Handle user authentication state change
     * @param {Object|null} user - Firebase Auth user
     */
    async handleAuthStateChange(user) {
        this.currentUser = user;

        if (user) {
            await this.loadProfile(user);
        } else {
            this.clearProfile();
        }
    }

    /**
     * Load user profile
     * @param {Object} user - Firebase Auth user
     */
    async loadProfile(user) {
        if (!this.portal) return;

        this.portal.setLoading(true);

        const result = await this.profileService.getOrCreateProfile(user);

        if (result.success) {
            this.portal.setProfile(result.data);
        } else {
            this.portal.setError(result.error || 'Failed to load profile');
        }
    }

    /**
     * Handle preference change from UI
     * @param {string} key - Preference key
     * @param {*} value - New value
     */
    async handlePreferenceChange(key, value) {
        if (!this.currentUser) return;

        const preferences = { [key]: value };
        const result = await this.profileService.updatePreferences(
            this.currentUser.uid,
            preferences
        );

        if (!result.success) {
            console.error('Failed to update preference:', result.error);
            // Reload profile to revert UI to actual state
            await this.loadProfile(this.currentUser);
        }
    }

    /**
     * Clear profile state (on sign out)
     */
    clearProfile() {
        if (this.currentUser) {
            this.profileService.clearProfile(this.currentUser.uid);
        }
        if (this.portal) {
            this.portal.clear();
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
        }
        if (this.portal && this.container) {
            this.container.removeChild(this.portal);
        }
        this.portal = null;
        this.container = null;
        this.currentUser = null;
    }
}
