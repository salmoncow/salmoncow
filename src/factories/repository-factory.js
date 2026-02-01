/**
 * Repository Factory
 *
 * Creates repository instances based on configuration.
 * Enables swapping storage backends without changing service layer.
 *
 * Current backends:
 * - 'localStorage': Browser localStorage (Phase 1)
 *
 * Future backends:
 * - 'firestore': Cloud Firestore (when persistent storage needed)
 *
 * Architecture Reference:
 * - .prompts/core/architecture/feature-extensibility.md (Factory Pattern)
 * - .prompts/core/architecture/code-structure.md (Dependency Inversion)
 */

import { LocalStorageUserProfileRepository } from '../repositories/local-storage-user-profile-repository.js';

/**
 * @typedef {'localStorage' | 'firestore'} StorageBackend
 */

/**
 * @typedef {Object} RepositoryConfig
 * @property {StorageBackend} [userProfileBackend] - Backend for user profiles
 */

/**
 * Default configuration
 * @type {RepositoryConfig}
 */
const DEFAULT_CONFIG = Object.freeze({
    userProfileBackend: 'localStorage'
});

/**
 * Repository Factory
 *
 * Creates repository instances based on configuration.
 * Centralizes backend selection logic.
 */
export class RepositoryFactory {
    /**
     * Create a new RepositoryFactory
     * @param {RepositoryConfig} [config] - Configuration options
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.instances = new Map();
    }

    /**
     * Get a UserProfileRepository instance
     * Uses singleton pattern - returns same instance for same backend
     *
     * @returns {import('../repositories/user-profile-repository.js').UserProfileRepository}
     */
    getUserProfileRepository() {
        const backend = this.config.userProfileBackend;
        const cacheKey = `userProfile:${backend}`;

        if (this.instances.has(cacheKey)) {
            return this.instances.get(cacheKey);
        }

        let repository;

        switch (backend) {
            case 'localStorage':
                repository = new LocalStorageUserProfileRepository();
                break;

            case 'firestore':
                // Future: import and instantiate FirestoreUserProfileRepository
                throw new Error('Firestore backend not yet implemented');

            default:
                throw new Error(`Unknown storage backend: ${backend}`);
        }

        this.instances.set(cacheKey, repository);
        return repository;
    }

    /**
     * Get current configuration
     * @returns {RepositoryConfig}
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration (clears cached instances)
     * @param {RepositoryConfig} config - New configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.instances.clear();
    }
}

/**
 * Create a default factory instance
 * @param {RepositoryConfig} [config] - Optional configuration
 * @returns {RepositoryFactory}
 */
export function createRepositoryFactory(config) {
    return new RepositoryFactory(config);
}
