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

// Import Web Components
import './components/LoadingSpinner.js';
import './components/UserAvatar.js';
import './components/StatusBadge.js';

class App {
    constructor() {
        this.firebaseApp = null;
        this.auth = null;
        this.ui = null;
        this.navigation = null;
    }

    async init() {
        try {
            // Initialize UI and navigation modules first
            this.ui = new UIModule();
            this.navigation = new NavigationModule();
            this.ui.init();
            this.navigation.init();

            // Show loading overlay immediately
            this.ui.showLoadingOverlay();

            // Initialize Firebase
            this.firebaseApp = initializeApp(firebaseConfig);
            this.auth = new AuthModule(this.firebaseApp);

            // Wait for auth initialization (prevents FOUC)
            await this.auth.waitForAuthInitialization();

            // Hide loading overlay - auth state is now known
            this.ui.hideLoadingOverlay();

            // Setup event listeners and auth state monitoring
            this.setupEventListeners();
            this.setupAuthStateListener();

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.ui.hideLoadingOverlay();
        }
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
    }

    setupAuthStateListener() {
        this.auth.onAuthStateChanged((user) => {
            // Update both UI module and navigation module
            this.ui.updateLoginButton(user);
            this.navigation.updateAuthState(user);

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