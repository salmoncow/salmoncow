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
import { AdminUserService } from './services/admin-user-service.js';
import { AdminPortalModule } from './modules/admin-portal.js';
import { initAppCheck } from './infrastructure/appcheck.js';
import { RoleModule } from './modules/role.js';
import { getDb } from './infrastructure/firestore.js';

// Import Web Components
import './components/LoadingSpinner.js';
import './components/UserAvatar.js';
import './components/StatusBadge.js';
import './components/UserPortal.js';
import './components/AdminPortal.js';
import './components/ToastContainer.js';

class App {
    constructor() {
        this.firebaseApp = null;
        this.auth = null;
        this.role = null;
        this.ui = null;
        this.navigation = null;
        this.userPortal = null;
        this.adminPortal = null;
        this.profileService = null;
        this.adminUserService = null;
        this.router = null;
        this.toastContainer = null;
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
            // App Check must initialize before any protected callable is invoked.
            // Skipped automatically in emulator mode (see infrastructure/appcheck.js).
            initAppCheck(this.firebaseApp);
            this.auth = new AuthModule(this.firebaseApp);

            // Role state (custom claim + users/{uid}.roleChangedAt mirror listener)
            this.role = new RoleModule(this.auth, getDb(this.firebaseApp));
            this.role.init();

            // If a role change demotes the user off /admin, bounce them to home.
            this.role.onRoleChange((nextRole) => {
                if (
                    this.router?.getCurrentRoute() === '/admin' &&
                    nextRole !== null &&
                    nextRole !== 'owner' &&
                    nextRole !== 'admin'
                ) {
                    this.router.navigate('/');
                }
            });

            // Initialize router
            this.router = new RouterModule();
            this.setupRoutes();

            // Initialize user profile service and portal
            this.initializeUserPortal();

            // Initialize admin portal (owner/admin only; UI guards shown/hidden by role)
            this.initializeAdminPortal();

            // Setup event listeners and auth state monitoring
            this.setupEventListeners();
            this.setupAuthStateListener();

            // Initialize toast container
            this.toastContainer = document.getElementById('toastContainer');

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
        this.router.register('/', () => this.showView('homeView'));
        this.router.register('/profile', () => this.showView('profileView'));
        this.router.register('/admin', () => {
            this.showView('adminView');
            this.adminPortal?.show();
        });

        this.router.onBeforeNavigate((newPath) => {
            if (newPath === '/profile') {
                // Allow if authenticated or hint suggests authentication
                const hint = AuthHintModule.getHint();
                if (!this.auth?.isAuthenticated() && !hint?.isAuthenticated) {
                    this.router.navigate('/');
                    return false;
                }
            }
            if (newPath === '/admin') {
                // Security is enforced server-side by Firestore rules + the
                // setUserRole callable. This guard is UX only: keep unprivileged
                // users from landing on a page that would render nothing.
                if (!this.auth?.isAuthenticated()) {
                    this.router.navigate('/');
                    return false;
                }
                const role = this.role?.getRole();
                // role === null means the token hasn't loaded yet; let the user
                // through and re-evaluate when onRoleChange fires (see init()).
                if (role !== null && role !== 'owner' && role !== 'admin') {
                    this.router.navigate('/');
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Show exactly one page view, hiding the others.
     * @param {'homeView'|'profileView'|'adminView'} id
     */
    showView(id) {
        const views = ['homeView', 'profileView', 'adminView'];
        for (const v of views) {
            const el = document.getElementById(v);
            if (el) el.style.display = v === id ? 'block' : 'none';
        }
        this.navigation.closeDropdown();
    }

    /**
     * Initialize user profile service and portal module
     */
    initializeUserPortal() {
        const repositoryFactory = createRepositoryFactory({ firebaseApp: this.firebaseApp });
        this._userRepository = repositoryFactory.getUserProfileRepository();
        this.profileService = new UserProfileService(this._userRepository);
        this.userPortal = new UserPortalModule(this.profileService);
        this.userPortal.init('userPortalContainer');
    }

    /**
     * Initialize admin portal. Created unconditionally; the component is a
     * no-op render until setRole('owner'|'admin') is called and users are
     * loaded on first route match.
     */
    initializeAdminPortal() {
        this.adminUserService = new AdminUserService({
            firebaseApp: this.firebaseApp,
            repository: this._userRepository,
        });
        this.adminPortal = new AdminPortalModule({
            adminService: this.adminUserService,
            role: this.role,
            toast: {
                show: (type, message, duration) =>
                    this.showToast(type, message, duration),
            },
        });
        this.adminPortal.init('adminPortalContainer');

        // Keep navigation Admin link synced with the role observable.
        this.role.onRoleChange((next) => this.navigation.setRole(next));
    }

    /**
     * Show a toast notification
     * @param {string} type - Type: success, error, warning, info, loading
     * @param {string} message - Message to display
     * @param {number} duration - Auto-dismiss in ms (0 = manual only)
     * @returns {HTMLElement|null} The toast element for programmatic control
     */
    showToast(type, message, duration = 3000) {
        return this.toastContainer?.show(type, message, duration);
    }

    setupEventListeners() {
        // Login via navigation bar
        this.navigation.onLoginClick(async () => {
            const loadingToast = this.showToast('loading', 'Signing in...', 0);

            try {
                validateFirebaseConfig();
                const result = await this.auth.signInWithGoogle();

                loadingToast?.dismiss();

                if (result.success) {
                    this.showToast('success', result.message);
                    // Redirect to profile on successful login
                    this.router.navigate('/profile');
                } else {
                    throw result.error;
                }
            } catch (error) {
                loadingToast?.dismiss();

                if (error.message && error.message.includes('Firebase configuration incomplete')) {
                    this.showToast('error', 'Please update firebase-config.js with your Firebase project details.', 5000);
                } else {
                    this.showToast('error', `Error: ${error.message}`, 5000);
                }
            }
        });

        // Logout via navigation dropdown
        this.navigation.onLogoutClick(async () => {
            const loadingToast = this.showToast('loading', 'Signing out...', 0);

            try {
                const result = await this.auth.signOut();

                loadingToast?.dismiss();

                if (result.success) {
                    this.router.navigate('/');
                    this.showToast('success', result.message);
                } else {
                    throw result.error;
                }
            } catch (error) {
                loadingToast?.dismiss();
                this.showToast('error', `Error: ${error.message}`, 5000);
            }
        });

        // Navigation events (future routing support)
        this.navigation.onNavigate((destination) => {
            console.log(`Navigation event: ${destination}`);
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

            // If user signed out while on a protected route, redirect home
            if (!user) {
                const current = this.router.getCurrentRoute();
                if (current === '/profile' || current === '/admin') {
                    this.router.navigate('/');
                }
            }

        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
