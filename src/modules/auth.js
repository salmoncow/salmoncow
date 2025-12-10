import { getAuth, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

export class AuthModule {
    constructor(firebaseApp) {
        this.auth = getAuth(firebaseApp);
        this.provider = new GoogleAuthProvider();
        this.currentUser = null;
        this.authStateCallbacks = [];
        this.authInitialized = false;
        this.initializationPromise = null;

        // Track initialization state
        this.initializationPromise = new Promise((resolve) => {
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;

                // Mark as initialized on first auth state change
                if (!this.authInitialized) {
                    this.authInitialized = true;
                    resolve(user);
                }

                // Notify all callbacks
                this.authStateCallbacks.forEach(callback => callback(user));
            });
        });
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, this.provider);
            return {
                success: true,
                user: result.user,
                message: `Welcome, ${result.user.displayName}!`
            };
        } catch (error) {
            return {
                success: false,
                error: error,
                message: error.message
            };
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            return {
                success: true,
                message: 'Signed out successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error,
                message: error.message
            };
        }
    }

    onAuthStateChanged(callback) {
        this.authStateCallbacks.push(callback);
        // Always call callback immediately with current state (even if null)
        callback(this.currentUser);
        return () => {
            const index = this.authStateCallbacks.indexOf(callback);
            if (index > -1) {
                this.authStateCallbacks.splice(index, 1);
            }
        };
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Wait for Firebase Auth to complete its initial state check
     * This prevents the "flash of unauthenticated content" (FOUC)
     * by ensuring we know the auth state before showing any content
     *
     * @returns {Promise<User|null>} Resolves with user object or null
     */
    async waitForAuthInitialization() {
        return this.initializationPromise;
    }
}