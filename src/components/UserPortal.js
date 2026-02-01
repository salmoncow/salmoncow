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
 *
 * Architecture Reference:
 * - .prompts/core/architecture/code-structure.md (Web Components)
 */
export class UserPortal extends HTMLElement {
    constructor() {
        super();
        this.profile = null;
        this.loading = false;
        this.error = null;
    }

    connectedCallback() {
        this.render();
        this.addStyles();
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
                    <p class="portal-error-text">${this.escapeHtml(this.error)}</p>
                </div>
            </div>
        `;
    }

    renderProfile() {
        const { displayName, email, photoURL, preferences, createdAt } = this.profile;
        const memberSince = this.formatDate(createdAt);
        const currentTheme = preferences?.theme || 'system';
        const emailNotifications = preferences?.emailNotifications !== false;

        return `
            <div class="user-portal">
                <div class="portal-header">
                    <user-avatar
                        photo="${photoURL || ''}"
                        alt="${this.escapeHtml(displayName)}'s avatar"
                        size="xlarge"
                    ></user-avatar>
                    <div class="portal-user-info">
                        <h2 class="portal-name">${this.escapeHtml(displayName)}</h2>
                        <p class="portal-email">${this.escapeHtml(email)}</p>
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
                this.emitPreferenceChange('theme', e.target.value);
            });
        }

        // Email notifications toggle
        const emailToggle = this.querySelector('#emailNotificationsToggle');
        if (emailToggle) {
            emailToggle.addEventListener('change', (e) => {
                this.emitPreferenceChange('emailNotifications', e.target.checked);
            });
        }
    }

    /**
     * Emit preference change event
     * @param {string} key - Preference key
     * @param {*} value - New value
     */
    emitPreferenceChange(key, value) {
        this.dispatchEvent(new CustomEvent('preference-change', {
            bubbles: true,
            detail: { key, value }
        }));
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
            month: 'long'
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    addStyles() {
        if (document.getElementById('user-portal-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'user-portal-styles';
        style.textContent = `
            .user-portal {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                padding: 1.5rem;
                max-width: 480px;
                width: 100%;
            }

            .user-portal--loading,
            .user-portal--error {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 200px;
            }

            /* Error State */
            .portal-error {
                text-align: center;
                color: #c62828;
            }

            .portal-error-icon {
                width: 48px;
                height: 48px;
                margin-bottom: 1rem;
            }

            .portal-error-text {
                font-size: 0.9375rem;
            }

            /* Header */
            .portal-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding-bottom: 1.25rem;
                border-bottom: 1px solid #e5e7eb;
            }

            .portal-user-info {
                flex: 1;
                min-width: 0;
            }

            .portal-name {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 0.25rem 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .portal-email {
                font-size: 0.875rem;
                color: #6b7280;
                margin: 0 0 0.25rem 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .portal-member-since {
                font-size: 0.75rem;
                color: #9ca3af;
                margin: 0;
            }

            /* Section */
            .portal-section {
                padding-top: 1.25rem;
            }

            .portal-section-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin: 0 0 1rem 0;
            }

            /* Preference Row */
            .portal-preference {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: 0.75rem 0;
                border-bottom: 1px solid #f3f4f6;
            }

            .portal-preference:last-child {
                border-bottom: none;
            }

            .portal-preference-label {
                flex: 1;
                cursor: pointer;
            }

            .preference-name {
                display: block;
                font-size: 0.9375rem;
                font-weight: 500;
                color: #1f2937;
            }

            .preference-description {
                display: block;
                font-size: 0.8125rem;
                color: #9ca3af;
                margin-top: 0.125rem;
            }

            /* Select */
            .portal-select {
                padding: 0.5rem 2rem 0.5rem 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 0.875rem;
                color: #374151;
                background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 0.5rem center;
                appearance: none;
                cursor: pointer;
                min-width: 120px;
            }

            .portal-select:hover {
                border-color: #9ca3af;
            }

            .portal-select:focus {
                outline: none;
                border-color: var(--brand-primary, #D66E4F);
                box-shadow: 0 0 0 3px rgba(214, 110, 79, 0.1);
            }

            /* Toggle Switch */
            .portal-toggle {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 24px;
                flex-shrink: 0;
            }

            .portal-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .portal-toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #d1d5db;
                transition: 0.2s;
                border-radius: 24px;
            }

            .portal-toggle-slider::before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.2s;
                border-radius: 50%;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }

            .portal-toggle input:checked + .portal-toggle-slider {
                background-color: var(--brand-primary, #D66E4F);
            }

            .portal-toggle input:checked + .portal-toggle-slider::before {
                transform: translateX(20px);
            }

            .portal-toggle input:focus + .portal-toggle-slider {
                box-shadow: 0 0 0 3px rgba(214, 110, 79, 0.2);
            }

            /* Responsive */
            @media (max-width: 480px) {
                .user-portal {
                    padding: 1rem;
                }

                .portal-header {
                    flex-direction: column;
                    text-align: center;
                }

                .portal-user-info {
                    width: 100%;
                }

                .portal-preference {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 0.5rem;
                }

                .portal-select {
                    width: 100%;
                }

                .portal-toggle {
                    align-self: flex-start;
                }
            }

            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .portal-toggle-slider,
                .portal-toggle-slider::before {
                    transition: none;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

customElements.define('user-portal', UserPortal);
