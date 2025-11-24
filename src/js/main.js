/**
 * Firebase Base Website - Main Application
 *
 * Uses Firebase SDK from CDN (no bundler required):
 * - Faster page loads via CDN caching
 * - No build complexity
 * - Vanilla JavaScript approach
 *
 * Firebase Version: 10.13.2 (latest stable v10.x)
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { firebaseConfig, validateFirebaseConfig } from './firebase-config.js';
import { AuthModule } from './modules/auth.js';
import { UIModule } from './modules/ui.js';

class App {
    constructor() {
        this.firebaseApp = null;
        this.auth = null;
        this.ui = null;
    }

    async init() {
        try {
            this.firebaseApp = initializeApp(firebaseConfig);
            this.auth = new AuthModule(this.firebaseApp);
            this.ui = new UIModule();

            this.ui.init();
            this.setupEventListeners();
            this.setupAuthStateListener();

        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    setupEventListeners() {
        this.ui.addLoginButtonListener(async () => {
            this.ui.showStatus('Initializing sign-in...', 'loading');

            try {
                validateFirebaseConfig();
                const result = await this.auth.signInWithGoogle();

                if (result.success) {
                    this.ui.showStatus(result.message, 'success');
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

        this.ui.addLogoutButtonListener(async () => {
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
    }

    setupAuthStateListener() {
        this.auth.onAuthStateChanged((user) => {
            this.ui.updateLoginButton(user);
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