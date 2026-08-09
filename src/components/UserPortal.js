/**
 * UserPortal Web Component
 *
 * Displays user profile information and preferences.
 * Receives profile data from UserPortalModule controller.
 *
 * Usage:
 *   <user-portal></user-portal>
 *
 * Methods:
 *   - setProfile(profile) - Update displayed profile
 *   - setLoading(loading) - Show/hide loading state
 *   - setError(message) - Display error message
 *   - clear() - Reset to empty state
 *
 * Events:
 *   - preference-change: Fired when user changes a preference
 *     detail: { key: string, value: any }
 */
import { escapeHtml } from '../utils/escape-html.js';
import './UserPortal.css';

export class UserPortal extends HTMLElement {
    constructor() {
        super();
        this.profile = null;
        this.loading = false;
        this.error = null;
    }

    connectedCallback() {
        this.render();
    }

    /**
     * Set the user profile to display
     * @param {import('../types/user-profile.js').UserProfile|null} profile
     */
    setProfile(profile) {
        this.profile = profile;
        this.error = null;
        this.loading = false;
        this.render();
    }

    /**
     * Set loading state
     * @param {boolean} loading
     */
    setLoading(loading) {
        this.loading = loading;
        if (loading) {
            this.error = null;
        }
        this.render();
    }

    /**
     * Set error message
     * @param {string|null} message
     */
    setError(message) {
        this.error = message;
        this.loading = false;
        this.render();
    }

    /**
     * Clear portal state
     */
    clear() {
        this.profile = null;
        this.loading = false;
        this.error = null;
        this.render();
    }

    render() {
        if (!this.profile && !this.loading && !this.error) {
            this.innerHTML = '';
            return;
        }

        if (this.loading) {
            this.innerHTML = this.renderLoading();
            return;
        }

        if (this.error) {
            this.innerHTML = this.renderError();
            return;
        }

        this.innerHTML = this.renderProfile();
        this.attachEventListeners();
    }

    renderLoading() {
        return `
            <div class="user-portal user-portal--loading">
                <loading-spinner message="Loading your profile..." size="medium"></loading-spinner>
            </div>
        `;
    }

    renderError() {
        return `
            <div class="user-portal user-portal--error">
                <div class="portal-error">
                    <svg class="portal-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p class="portal-error-text">${escapeHtml(this.error)}</p>
                </div>
            </div>
        `;
    }

    renderProfile() {
        if (!this.profile) return '';
        const { displayName, email, photoURL, preferences, createdAt } = this.profile;
        const memberSince = this.formatDate(createdAt);
        const currentTheme = preferences?.theme || 'system';
        // Opt-in: an absent preference means off, matching the server default
        // in onUserCreate and the DEFAULT_PREFERENCES used on the client.
        const emailNotifications = preferences?.emailNotifications === true;

        return `
            <div class="user-portal">
                <div class="portal-header">
                    <user-avatar
                        photo="${escapeHtml(photoURL || '')}"
                        alt="${escapeHtml(displayName)}'s avatar"
                        size="xlarge"
                    ></user-avatar>
                    <div class="portal-user-info">
                        <h2 class="portal-name">${escapeHtml(displayName)}</h2>
                        <p class="portal-email">${escapeHtml(email)}</p>
                        <p class="portal-member-since">Member since ${memberSince}</p>
                    </div>
                </div>

                <div class="portal-section">
                    <h3 class="portal-section-title">Preferences</h3>

                    <div class="portal-preference">
                        <label class="portal-preference-label" for="themeSelect">
                            <span class="preference-name">Theme</span>
                            <span class="preference-description">Choose your preferred appearance</span>
                        </label>
                        <select id="themeSelect" class="portal-select" data-preference="theme">
                            <option value="system" ${currentTheme === 'system' ? 'selected' : ''}>System</option>
                            <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>

                    <div class="portal-preference">
                        <label class="portal-preference-label" for="emailNotificationsToggle">
                            <span class="preference-name">Email Notifications</span>
                            <span class="preference-description">Receive updates via email</span>
                        </label>
                        <label class="portal-toggle">
                            <input
                                type="checkbox"
                                id="emailNotificationsToggle"
                                data-preference="emailNotifications"
                                ${emailNotifications ? 'checked' : ''}
                            >
                            <span class="portal-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Theme select
        const themeSelect = this.querySelector('#themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const el = /** @type {HTMLSelectElement} */ (e.target);
                this.emitPreferenceChange('theme', el.value);
            });
        }

        // Email notifications toggle
        const emailToggle = this.querySelector('#emailNotificationsToggle');
        if (emailToggle) {
            emailToggle.addEventListener('change', (e) => {
                const el = /** @type {HTMLInputElement} */ (e.target);
                this.emitPreferenceChange('emailNotifications', el.checked);
            });
        }
    }

    /**
     * Emit preference change event
     * @param {string} key - Preference key
     * @param {*} value - New value
     */
    emitPreferenceChange(key, value) {
        this.dispatchEvent(
            new CustomEvent('preference-change', {
                bubbles: true,
                detail: { key, value },
            }),
        );
    }

    /**
     * Format date for display
     * @param {Date|string} date
     * @returns {string}
     */
    formatDate(date) {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
        });
    }
}

customElements.define('user-portal', UserPortal);
