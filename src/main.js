/**
 * Salmoncow - Main Application
 *
 * Uses Firebase SDK from CDN (no bundler required):
 * - Faster page loads via CDN caching
 * - No build complexity
 * - Vanilla JavaScript approach
 *
 * Firebase Version: 10.13.2 (latest stable v10.x)
 */

// Import styles
import './assets/styles/navigation.css';
import './styles/main.css';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { firebaseConfig, validateFirebaseConfig } from './firebase-config.js';
import { AuthModule } from './modules/auth.js';
import { UIModule } from './modules/ui.js';
import { NavigationModule } from './modules/navigation.js';
import { UserPortalModule } from './modules/user-portal.js';
import { RouterModule } from './modules/router.js';
import { AuthHintModule } from './modules/auth-hint.js';
import { createRepositoryFactory } from './factories/repository-factory.js';
import { UserProfileService } from './services/user-profile-service.js';

// Import Web Components
import './components/LoadingSpinner.js';
import './components/UserAvatar.js';
import './components/StatusBadge.js';
import './components/UserPortal.js';

class App {
    constructor() {
        this.firebaseApp = null;
        this.auth = null;
        this.ui = null;
        this.navigation = null;
        this.userPortal = null;
        this.profileService = null;
        this.router = null;
    }

    async init() {
        try {
            // Initialize UI and navigation modules first
            this.ui = new UIModule();
            this.navigation = new NavigationModule();
            this.ui.init();
            this.navigation.init();

            // Apply auth hint immediately (no blocking wait)
            const hint = AuthHintModule.getHint();
            this.navigation.initWithHint(hint);

            // Initialize Firebase (non-blocking)
            this.firebaseApp = initializeApp(firebaseConfig);
            this.auth = new AuthModule(this.firebaseApp);

            // Initialize router
            this.router = new RouterModule();
            this.setupRoutes();

            // Initialize user profile service and portal
            this.initializeUserPortal();

            // Setup event listeners and auth state monitoring
            this.setupEventListeners();
            this.setupAuthStateListener();

            // Initialize router (handles initial route)
            this.router.init();

        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    /**
     * Setup routes for hash-based navigation
     */
    setupRoutes() {
        this.router.register('/', () => this.showHome());
        this.router.register('/profile', () => this.showProfile());

        // Protect profile route
        this.router.onBeforeNavigate((newPath) => {
            if (newPath === '/profile') {
                // Allow if authenticated or hint suggests authentication
                const hint = AuthHintModule.getHint();
                if (!this.auth?.isAuthenticated() && !hint?.isAuthenticated) {
                    this.router.navigate('/');
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Show home view
     */
    showHome() {
        const homeView = document.getElementById('homeView');
        const profileView = document.getElementById('profileView');

        if (homeView) homeView.style.display = 'block';
        if (profileView) profileView.style.display = 'none';

        // Close dropdown when navigating
        this.navigation.closeDropdown();
    }

    /**
     * Show profile view
     */
    showProfile() {
        const homeView = document.getElementById('homeView');
        const profileView = document.getElementById('profileView');

        if (homeView) homeView.style.display = 'none';
        if (profileView) profileView.style.display = 'block';

        // Close dropdown when navigating
        this.navigation.closeDropdown();
    }

    /**
     * Initialize user profile service and portal module
     */
    initializeUserPortal() {
        const repositoryFactory = createRepositoryFactory();
        const repository = repositoryFactory.getUserProfileRepository();
        this.profileService = new UserProfileService(repository);
        this.userPortal = new UserPortalModule(this.profileService);
        this.userPortal.init('userPortalContainer');
    }

    setupEventListeners() {
        // Login via navigation bar
        this.navigation.onLoginClick(async () => {
            // Show loading badge
            const loadingBadge = document.createElement('status-badge');
            loadingBadge.setAttribute('type', 'loading');
            loadingBadge.setAttribute('message', 'Signing in...');
            this.showStatusBadge(loadingBadge);

            try {
                validateFirebaseConfig();
                const result = await this.auth.signInWithGoogle();

                // Remove loading badge
                this.removeStatusBadge();

                if (result.success) {
                    // Show success badge (will auto-hide when auth state updates)
                    const successBadge = document.createElement('status-badge');
                    successBadge.setAttribute('type', 'success');
                    successBadge.setAttribute('message', result.message);
                    successBadge.setAttribute('dismissible', 'true');
                    this.showStatusBadge(successBadge);

                    // Handle manual dismiss
                    successBadge.addEventListener('dismiss', () => {
                        this.removeStatusBadge();
                    });

                    // Auto-dismiss after 3 seconds
                    setTimeout(() => this.removeStatusBadge(), 3000);
                } else {
                    throw result.error;
                }
            } catch (error) {
                // Remove loading badge
                this.removeStatusBadge();

                // Show error badge
                const errorBadge = document.createElement('status-badge');
                errorBadge.setAttribute('type', 'error');

                if (error.message && error.message.includes('Firebase configuration incomplete')) {
                    errorBadge.setAttribute('message', 'Please update firebase-config.js with your Firebase project details.');
                } else {
                    errorBadge.setAttribute('message', `Error: ${error.message}`);
                }

                errorBadge.setAttribute('dismissible', 'true');
                this.showStatusBadge(errorBadge);
            }
        });

        // Logout via navigation dropdown
        this.navigation.onLogoutClick(async () => {
            // Show loading badge
            const loadingBadge = document.createElement('status-badge');
            loadingBadge.setAttribute('type', 'loading');
            loadingBadge.setAttribute('message', 'Signing out...');
            this.showStatusBadge(loadingBadge);

            try {
                const result = await this.auth.signOut();

                // Remove loading badge
                this.removeStatusBadge();

                if (result.success) {
                    // Navigate to home on logout
                    this.router.navigate('/');

                    // Show success badge
                    const successBadge = document.createElement('status-badge');
                    successBadge.setAttribute('type', 'success');
                    successBadge.setAttribute('message', result.message);
                    successBadge.setAttribute('dismissible', 'true');
                    this.showStatusBadge(successBadge);

                    // Handle manual dismiss
                    successBadge.addEventListener('dismiss', () => {
                        this.removeStatusBadge();
                        this.hideContentCardIfUnauthenticated();
                    });

                    // Auto-dismiss after 2 seconds and hide content card
                    setTimeout(() => {
                        this.removeStatusBadge();
                        this.hideContentCardIfUnauthenticated();
                    }, 2000);
                } else {
                    throw result.error;
                }
            } catch (error) {
                // Remove loading badge
                this.removeStatusBadge();

                // Show error badge
                const errorBadge = document.createElement('status-badge');
                errorBadge.setAttribute('type', 'error');
                errorBadge.setAttribute('message', `Error: ${error.message}`);
                errorBadge.setAttribute('dismissible', 'true');
                this.showStatusBadge(errorBadge);
            }
        });

        // Navigation events (future routing support)
        this.navigation.onNavigate((destination) => {
            console.log(`Navigation event: ${destination}`);
            // Future: Handle client-side routing here
            // For now, native link behavior handles actual navigation
        });

        // Handle profile link click (close dropdown)
        const profileLink = document.getElementById('navProfileLink');
        if (profileLink) {
            profileLink.addEventListener('click', () => {
                this.navigation.closeDropdown();
            });
        }
    }

    setupAuthStateListener() {
        this.auth.onAuthStateChanged((user) => {
            // Update both UI module and navigation module
            this.ui.updateLoginButton(user);
            this.navigation.updateAuthState(user);

            // Update user portal state
            if (this.userPortal) {
                this.userPortal.handleAuthStateChange(user);
            }

            // If user signed out and on profile page, redirect to home
            if (!user && this.router.getCurrentRoute() === '/profile') {
                this.router.navigate('/');
            }

            if (user) {
                // Remove any status badges when user signs in
                this.removeStatusBadge();
            }
        });
    }

    /**
     * Show a status badge in the content card
     * @param {HTMLElement} badge - StatusBadge element
     */
    showStatusBadge(badge) {
        const contentCard = document.getElementById('contentCard');
        const statusContainer = document.getElementById('status');

        if (contentCard && statusContainer) {
            // Clear existing status
            statusContainer.innerHTML = '';

            // Add new badge
            statusContainer.appendChild(badge);

            // Show the content card and status container
            contentCard.style.display = 'block';
            statusContainer.style.display = 'block';
        }
    }

    /**
     * Remove status badge from display
     */
    removeStatusBadge() {
        const statusContainer = document.getElementById('status');

        if (statusContainer) {
            statusContainer.innerHTML = '';
            statusContainer.style.display = 'none';
        }
    }

    /**
     * Hide content card if user is not authenticated
     * Used after status badges are dismissed
     */
    hideContentCardIfUnauthenticated() {
        if (!this.auth.isAuthenticated()) {
            const contentCard = document.getElementById('contentCard');
            if (contentCard) {
                contentCard.style.display = 'none';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
