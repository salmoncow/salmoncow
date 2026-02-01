/**
 * RouterModule - Simple hash-based routing
 *
 * Provides client-side routing using hash fragments (e.g., /#/profile).
 * Works with static hosting without server configuration.
 *
 * Architecture Reference:
 * - .prompts/core/architecture/modular-architecture-principles.md
 * - .prompts/core/architecture/feature-extensibility.md
 */

export class RouterModule {
    constructor() {
        /** @type {Map<string, Function>} */
        this.routes = new Map();
        /** @type {string|null} */
        this.currentRoute = null;
        /** @type {Function[]} */
        this.beforeNavigateCallbacks = [];
    }

    /**
     * Register a route handler
     * @param {string} path - Route path (e.g., '/', '/profile')
     * @param {Function} handler - Handler function called when route matches
     */
    register(path, handler) {
        // Normalize path
        const normalizedPath = this.normalizePath(path);
        this.routes.set(normalizedPath, handler);
    }

    /**
     * Navigate to a route
     * @param {string} path - Route path to navigate to
     */
    navigate(path) {
        const normalizedPath = this.normalizePath(path);

        // Update hash (triggers hashchange event)
        if (normalizedPath === '/') {
            window.location.hash = '';
        } else {
            window.location.hash = normalizedPath;
        }
    }

    /**
     * Initialize router (listen for hash changes, handle initial route)
     */
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Handle initial route
        this.handleRouteChange();
    }

    /**
     * Handle route change (called on hashchange and init)
     */
    handleRouteChange() {
        const path = this.getPathFromHash();

        // Skip if same route
        if (path === this.currentRoute) {
            return;
        }

        // Run before-navigate callbacks
        for (const callback of this.beforeNavigateCallbacks) {
            const result = callback(path, this.currentRoute);
            if (result === false) {
                // Navigation cancelled, restore previous hash
                if (this.currentRoute === '/') {
                    window.history.replaceState(null, '', window.location.pathname);
                } else {
                    window.history.replaceState(null, '', `#${this.currentRoute}`);
                }
                return;
            }
        }

        this.currentRoute = path;

        // Find and execute handler
        const handler = this.routes.get(path);
        if (handler) {
            handler();
        } else {
            // Route not found, fallback to home
            const homeHandler = this.routes.get('/');
            if (homeHandler) {
                homeHandler();
            }
        }
    }

    /**
     * Get normalized path from current hash
     * @returns {string} Normalized path
     */
    getPathFromHash() {
        const hash = window.location.hash;

        // No hash or just '#' → home route
        if (!hash || hash === '#') {
            return '/';
        }

        // Extract path from hash (e.g., '#/profile' → '/profile')
        const path = hash.slice(1);
        return this.normalizePath(path);
    }

    /**
     * Normalize path to consistent format
     * @param {string} path - Path to normalize
     * @returns {string} Normalized path
     */
    normalizePath(path) {
        // Ensure leading slash
        let normalized = path.startsWith('/') ? path : `/${path}`;

        // Remove trailing slash (except for root)
        if (normalized !== '/' && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }

        return normalized;
    }

    /**
     * Get current route path
     * @returns {string|null}
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Register callback to run before navigation
     * Return false to cancel navigation
     * @param {Function} callback - (newPath, oldPath) => boolean|void
     * @returns {Function} Unsubscribe function
     */
    onBeforeNavigate(callback) {
        this.beforeNavigateCallbacks.push(callback);

        return () => {
            const index = this.beforeNavigateCallbacks.indexOf(callback);
            if (index > -1) {
                this.beforeNavigateCallbacks.splice(index, 1);
            }
        };
    }
}
