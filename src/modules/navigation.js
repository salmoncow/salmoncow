/**
 * NavigationModule - Manages top navigation bar and user profile dropdown
 *
 * Responsibilities:
 * - Render and update navigation UI based on auth state
 * - Handle dropdown toggle and close interactions
 * - Emit navigation events for future routing
 * - Integrate with AuthModule for user state
 *
 * Following modular architecture principles from:
 * - core/architecture/modular-architecture-principles.md
 * - core/architecture/feature-extensibility.md
 */
export class NavigationModule {
    constructor() {
        // DOM Elements
        this.navLoginButton = null;
        this.navUserContainer = null;
        this.navUserButton = null;
        this.navAvatar = null;
        this.navUsername = null;
        this.navDropdown = null;
        this.dropdownAvatar = null;
        this.dropdownName = null;
        this.dropdownEmail = null;
        this.navLogoutButton = null;
        this.navHomeButton = null;

        // State
        this.isDropdownOpen = false;
        this.currentUser = null;

        // Default avatar (reusable asset from placeholders)
        this.defaultAvatarURL = '/assets/images/placeholders/default-avatar.svg';

        // Event callbacks
        this.loginCallback = null;
        this.logoutCallback = null;
        this.navigationCallbacks = [];
    }

    /**
     * Initialize navigation module (called by App)
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
    }

    /**
     * Initialize navigation with auth hint (for instant rendering)
     * @param {{ isAuthenticated: boolean, displayName: string|null, photoURL: string|null }|null} hint
     */
    initWithHint(hint) {
        if (hint && hint.isAuthenticated) {
            // Show user container with cached data (pending state)
            if (this.navLoginButton) {
                this.navLoginButton.style.display = 'none';
            }
            if (this.navUserContainer) {
                this.navUserContainer.style.display = 'block';
            }
            if (this.navUserButton) {
                this.navUserButton.classList.add('auth-pending');
            }

            // Populate with cached name
            if (this.navUsername) {
                this.navUsername.textContent = hint.displayName || 'User';
            }

            // Populate avatar from hint
            if (this.navAvatar && hint.photoURL) {
                const navAvatarComponent = document.createElement('user-avatar');
                navAvatarComponent.setAttribute('photo', hint.photoURL);
                navAvatarComponent.setAttribute('alt', `${hint.displayName || 'User'}'s avatar`);
                navAvatarComponent.setAttribute('size', 'medium');
                this.navAvatar.innerHTML = '';
                this.navAvatar.appendChild(navAvatarComponent);
            }

            // Populate dropdown with hint data
            if (this.dropdownName) {
                this.dropdownName.textContent = hint.displayName || 'User';
            }
            if (this.dropdownAvatar && hint.photoURL) {
                const dropdownAvatarComponent = document.createElement('user-avatar');
                dropdownAvatarComponent.setAttribute('photo', hint.photoURL);
                dropdownAvatarComponent.setAttribute('alt', `${hint.displayName || 'User'}'s avatar`);
                dropdownAvatarComponent.setAttribute('size', 'large');
                this.dropdownAvatar.innerHTML = '';
                this.dropdownAvatar.appendChild(dropdownAvatarComponent);
            }
        } else {
            // Show login button (safe default)
            if (this.navLoginButton) {
                this.navLoginButton.style.display = 'block';
            }
            if (this.navUserContainer) {
                this.navUserContainer.style.display = 'none';
            }
        }
    }

    /**
     * Cache DOM element references for performance
     */
    cacheElements() {
        this.navLoginButton = document.getElementById('navLoginButton');
        this.navUserContainer = document.getElementById('navUserContainer');
        this.navUserButton = document.getElementById('navUserButton');
        this.navAvatar = document.getElementById('navAvatar');
        this.navUsername = document.getElementById('navUsername');
        this.navDropdown = document.getElementById('navDropdown');
        this.dropdownAvatar = document.getElementById('dropdownAvatar');
        this.dropdownName = document.getElementById('dropdownName');
        this.dropdownEmail = document.getElementById('dropdownEmail');
        this.navLogoutButton = document.getElementById('navLogoutButton');
        this.navHomeButton = document.getElementById('navHome');
    }

    /**
     * Setup all event listeners for navigation interactions
     */
    setupEventListeners() {
        // Login button click (unauthenticated state)
        if (this.navLoginButton) {
            this.navLoginButton.addEventListener('click', () => {
                if (this.loginCallback) {
                    this.loginCallback();
                }
            });
        }

        // Logout button click (in dropdown)
        if (this.navLogoutButton) {
            this.navLogoutButton.addEventListener('click', () => {
                this.closeDropdown();
                if (this.logoutCallback) {
                    this.logoutCallback();
                }
            });
        }

        // Home button click (navigation event for future routing)
        if (this.navHomeButton) {
            this.navHomeButton.addEventListener('click', (e) => {
                // Don't prevent default - allow native link behavior
                // But emit navigation event for future client-side routing
                this.emitNavigationEvent('home');
            });
        }

        // Dropdown toggle on user button click
        if (this.navUserButton) {
            this.navUserButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (this.isDropdownOpen && !e.target.closest('.nav-user-container')) {
                this.closeDropdown();
            }
        });

        // Escape key to close dropdown
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDropdownOpen) {
                this.closeDropdown();
                // Return focus to trigger button for accessibility
                this.navUserButton?.focus();
            }
        });
    }

    /**
     * Update navigation UI based on auth state
     * @param {Object|null} user - Firebase user object or null
     */
    updateAuthState(user) {
        this.currentUser = user;

        if (user) {
            this.showAuthenticatedState(user);
        } else {
            this.showUnauthenticatedState();
        }
    }

    /**
     * Show authenticated state (user profile dropdown)
     * @param {Object} user - Firebase user object
     */
    showAuthenticatedState(user) {
        // Hide login button
        if (this.navLoginButton) {
            this.navLoginButton.style.display = 'none';
        }

        // Show user container and remove pending state
        if (this.navUserContainer) {
            this.navUserContainer.style.display = 'block';
        }
        if (this.navUserButton) {
            this.navUserButton.classList.remove('auth-pending');
        }

        // Update user avatar in nav button (using UserAvatar component)
        if (this.navAvatar) {
            const navAvatarComponent = document.createElement('user-avatar');
            navAvatarComponent.setAttribute('photo', user.photoURL || '');
            navAvatarComponent.setAttribute('alt', `${user.displayName || 'User'}'s avatar`);
            navAvatarComponent.setAttribute('size', 'medium');

            // Replace existing content
            this.navAvatar.innerHTML = '';
            this.navAvatar.appendChild(navAvatarComponent);
        }

        // Update username in nav button
        if (this.navUsername) {
            this.navUsername.textContent = user.displayName || 'User';
        }

        // Update dropdown header avatar (using UserAvatar component)
        if (this.dropdownAvatar) {
            const dropdownAvatarComponent = document.createElement('user-avatar');
            dropdownAvatarComponent.setAttribute('photo', user.photoURL || '');
            dropdownAvatarComponent.setAttribute('alt', `${user.displayName || 'User'}'s avatar`);
            dropdownAvatarComponent.setAttribute('size', 'large');

            // Replace existing content
            this.dropdownAvatar.innerHTML = '';
            this.dropdownAvatar.appendChild(dropdownAvatarComponent);
        }

        // Update dropdown name
        if (this.dropdownName) {
            this.dropdownName.textContent = user.displayName || 'User';
        }

        // Update dropdown email
        if (this.dropdownEmail) {
            this.dropdownEmail.textContent = user.email || '';
        }
    }

    /**
     * Show unauthenticated state (login button)
     */
    showUnauthenticatedState() {
        // Show login button
        if (this.navLoginButton) {
            this.navLoginButton.style.display = 'block';
        }

        // Hide user container
        if (this.navUserContainer) {
            this.navUserContainer.style.display = 'none';
        }

        // Close dropdown if open
        this.closeDropdown();
    }

    /**
     * Toggle dropdown open/closed
     */
    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
        this.updateDropdownState();
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        this.isDropdownOpen = false;
        this.updateDropdownState();
    }

    /**
     * Update dropdown visual state (CSS classes and ARIA attributes)
     */
    updateDropdownState() {
        if (this.navUserContainer) {
            this.navUserContainer.classList.toggle('dropdown-open', this.isDropdownOpen);
        }

        if (this.navUserButton) {
            this.navUserButton.setAttribute('aria-expanded', String(this.isDropdownOpen));
        }
    }

    /**
     * Register login button callback
     * @param {Function} callback - Function to call when login button is clicked
     */
    onLoginClick(callback) {
        this.loginCallback = callback;
    }

    /**
     * Register logout button callback
     * @param {Function} callback - Function to call when logout button is clicked
     */
    onLogoutClick(callback) {
        this.logoutCallback = callback;
    }

    /**
     * Register navigation event callback (for future routing)
     * @param {Function} callback - Function to call when navigation occurs
     * @returns {Function} Unsubscribe function
     */
    onNavigate(callback) {
        this.navigationCallbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.navigationCallbacks.indexOf(callback);
            if (index > -1) {
                this.navigationCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Emit navigation event to all registered callbacks
     * @param {string} destination - Navigation destination
     */
    emitNavigationEvent(destination) {
        this.navigationCallbacks.forEach(callback => {
            try {
                callback(destination);
            } catch (error) {
                console.error('Navigation callback error:', error);
            }
        });
    }
}
