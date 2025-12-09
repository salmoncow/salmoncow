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

class App {
    constructor() {
        this.firebaseApp = null;
        this.auth = null;
        this.ui = null;
        this.navigation = null;
    }

    async init() {
        try {
            this.firebaseApp = initializeApp(firebaseConfig);
            this.auth = new AuthModule(this.firebaseApp);
            this.ui = new UIModule();
            this.navigation = new NavigationModule();

            this.ui.init();
            this.navigation.init();
            this.setupEventListeners();
            this.setupAuthStateListener();

        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    setupEventListeners() {
        // Login via navigation bar
        this.navigation.onLoginClick(async () => {
            this.ui.showStatus('Initializing sign-in...', 'loading');

            try {
                validateFirebaseConfig();
                const result = await this.auth.signInWithGoogle();

                if (result.success) {
                    this.ui.showStatus(result.message, 'success');
                    setTimeout(() => this.ui.hideStatus(), 2000);
                } else {
                    throw result.error;
                }
            } catch (error) {
                if (error.message && error.message.includes('Firebase configuration incomplete')) {
                    this.ui.showStatus('Please update firebase-config.js with your Firebase project details.', 'error');
                } else {
                    this.ui.showStatus(`Error: ${error.message}`, 'error');
                }
            }
        });

        // Logout via navigation dropdown
        this.navigation.onLogoutClick(async () => {
            this.ui.showStatus('Signing out...', 'loading');

            try {
                const result = await this.auth.signOut();

                if (result.success) {
                    this.ui.showStatus(result.message, 'success');
                    setTimeout(() => {
                        this.ui.hideStatus();
                    }, 2000);
                } else {
                    throw result.error;
                }
            } catch (error) {
                this.ui.showStatus(`Error: ${error.message}`, 'error');
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
                this.ui.hideStatus();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});