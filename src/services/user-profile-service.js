/**
 * User Profile Service
 *
 * Business logic layer for user profile operations.
 * Abstracts repository details from UI layer.
 *
 * Features:
 * - Get or create profile from auth user
 * - Update preferences
 * - In-memory caching with TTL
 *
 * Architecture Reference:
 * - .prompts/core/architecture/code-structure.md (Service Layer)
 * - .prompts/core/architecture/feature-extensibility.md (Dependency Inversion)
 */

import { createUserProfileFromAuth } from '../types/user-profile.js';
import { success, failure } from '../repositories/user-profile-repository.js';

/**
 * Cache entry with TTL tracking
 * @typedef {Object} CacheEntry
 * @property {import('../types/user-profile.js').UserProfile} profile
 * @property {number} timestamp - When entry was cached
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * User Profile Service
 *
 * Handles all user profile business logic.
 * Uses dependency injection for repository.
 */
export class UserProfileService {
    /**
     * Create a new UserProfileService
     * @param {import('../repositories/user-profile-repository.js').UserProfileRepository} repository
     */
    constructor(repository) {
        if (!repository) {
            throw new Error('Repository is required');
        }
        this.repository = repository;
        this.cache = new Map();
        this.stateCallbacks = [];
    }

    /**
     * Get or create a user profile
     * Creates new profile if user doesn't have one
     *
     * @param {Object} authUser - Firebase Auth user
     * @returns {Promise<Result>} Result with UserProfile
     */
    async getOrCreateProfile(authUser) {
        if (!authUser || !authUser.uid) {
            return failure('Valid auth user is required', 'INVALID_USER');
        }

        // Check cache first
        const cached = this.getCached(authUser.uid);
        if (cached) {
            return success(cached);
        }

        // Try to find existing profile
        const findResult = await this.repository.findById(authUser.uid);
        if (!findResult.success) {
            return findResult;
        }

        let profile = findResult.data;

        // Create new profile if none exists
        if (!profile) {
            profile = createUserProfileFromAuth(authUser);
            const saveResult = await this.repository.save(profile);
            if (!saveResult.success) {
                return saveResult;
            }
            profile = saveResult.data;
        }

        // Cache the profile
        this.setCache(authUser.uid, profile);

        return success(profile);
    }

    /**
     * Get a user profile by ID
     * @param {string} uid - User ID
     * @returns {Promise<Result>} Result with UserProfile or null
     */
    async getProfile(uid) {
        if (!uid) {
            return failure('User ID is required', 'INVALID_UID');
        }

        // Check cache first
        const cached = this.getCached(uid);
        if (cached) {
            return success(cached);
        }

        const result = await this.repository.findById(uid);
        if (result.success && result.data) {
            this.setCache(uid, result.data);
        }

        return result;
    }

    /**
     * Update user preferences
     * @param {string} uid - User ID
     * @param {Partial<import('../types/user-profile.js').UserPreferences>} preferences
     * @returns {Promise<Result>} Result with updated UserProfile
     */
    async updatePreferences(uid, preferences) {
        if (!uid) {
            return failure('User ID is required', 'INVALID_UID');
        }

        if (!preferences || typeof preferences !== 'object') {
            return failure('Preferences object is required', 'INVALID_PREFERENCES');
        }

        const result = await this.repository.update(uid, { preferences });

        if (result.success) {
            // Update cache
            this.setCache(uid, result.data);
            // Notify listeners
            this.notifyStateChange(result.data);
        }

        return result;
    }

    /**
     * Update user profile fields
     * @param {string} uid - User ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Result>} Result with updated UserProfile
     */
    async updateProfile(uid, updates) {
        if (!uid) {
            return failure('User ID is required', 'INVALID_UID');
        }

        const result = await this.repository.update(uid, updates);

        if (result.success) {
            this.setCache(uid, result.data);
            this.notifyStateChange(result.data);
        }

        return result;
    }

    /**
     * Clear profile data for a user (on sign out)
     * @param {string} uid - User ID
     */
    clearProfile(uid) {
        if (uid) {
            this.cache.delete(uid);
        }
        this.notifyStateChange(null);
    }

    /**
     * Register callback for profile state changes
     * @param {Function} callback - Called with UserProfile or null
     * @returns {Function} Unsubscribe function
     */
    onStateChange(callback) {
        this.stateCallbacks.push(callback);

        return () => {
            const index = this.stateCallbacks.indexOf(callback);
            if (index > -1) {
                this.stateCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners of state change
     * @param {import('../types/user-profile.js').UserProfile|null} profile
     */
    notifyStateChange(profile) {
        this.stateCallbacks.forEach(callback => {
            try {
                callback(profile);
            } catch (error) {
                console.error('Profile state callback error:', error);
            }
        });
    }

    /**
     * Get cached profile if not expired
     * @param {string} uid - User ID
     * @returns {import('../types/user-profile.js').UserProfile|null}
     */
    getCached(uid) {
        const entry = this.cache.get(uid);
        if (!entry) {
            return null;
        }

        const age = Date.now() - entry.timestamp;
        if (age > CACHE_TTL_MS) {
            this.cache.delete(uid);
            return null;
        }

        return entry.profile;
    }

    /**
     * Cache a profile
     * @param {string} uid - User ID
     * @param {import('../types/user-profile.js').UserProfile} profile
     */
    setCache(uid, profile) {
        this.cache.set(uid, {
            profile,
            timestamp: Date.now()
        });
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
    }
}
