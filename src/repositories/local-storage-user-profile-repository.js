/**
 * LocalStorage User Profile Repository
 *
 * Implements UserProfileRepository using browser localStorage.
 * Suitable for Phase 1 - can be replaced with Firestore without changing service layer.
 *
 * Storage Key Pattern: salmoncow_user_profile_{uid}
 *
 * Architecture Reference:
 * - .prompts/core/architecture/code-structure.md (Repository Pattern)
 * - .prompts/core/architecture/feature-extensibility.md (Swappable Backends)
 */

import { UserProfileRepository, success, failure } from './user-profile-repository.js';
import {
    validateUserProfile,
    serializeUserProfile,
    deserializeUserProfile
} from '../types/user-profile.js';

const STORAGE_KEY_PREFIX = 'salmoncow_user_profile_';

/**
 * LocalStorage implementation of UserProfileRepository
 */
export class LocalStorageUserProfileRepository extends UserProfileRepository {
    /**
     * Generate storage key for a user ID
     * @param {string} uid - User ID
     * @returns {string} Storage key
     */
    getStorageKey(uid) {
        return `${STORAGE_KEY_PREFIX}${uid}`;
    }

    /**
     * Find a user profile by ID
     * @param {string} uid - User ID
     * @returns {Promise<Result>} Result with UserProfile or null
     */
    async findById(uid) {
        try {
            if (!uid) {
                return failure('User ID is required', 'INVALID_UID');
            }

            const key = this.getStorageKey(uid);
            const data = localStorage.getItem(key);

            if (!data) {
                return success(null);
            }

            const parsed = JSON.parse(data);
            const profile = deserializeUserProfile(parsed);

            return success(profile);
        } catch (error) {
            return failure(`Failed to read profile: ${error.message}`, 'READ_ERROR');
        }
    }

    /**
     * Save a new user profile
     * @param {import('../types/user-profile.js').UserProfile} profile - Profile to save
     * @returns {Promise<Result>} Result with saved profile
     */
    async save(profile) {
        try {
            const validation = validateUserProfile(profile);
            if (!validation.valid) {
                return failure(validation.error, 'VALIDATION_ERROR');
            }

            const key = this.getStorageKey(profile.uid);
            const serialized = serializeUserProfile(profile);

            localStorage.setItem(key, JSON.stringify(serialized));

            return success(profile);
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return failure('Storage quota exceeded', 'QUOTA_EXCEEDED');
            }
            return failure(`Failed to save profile: ${error.message}`, 'SAVE_ERROR');
        }
    }

    /**
     * Update an existing user profile
     * @param {string} uid - User ID
     * @param {Partial<import('../types/user-profile.js').UserProfile>} updates - Fields to update
     * @returns {Promise<Result>} Result with updated profile
     */
    async update(uid, updates) {
        try {
            if (!uid) {
                return failure('User ID is required', 'INVALID_UID');
            }

            const existingResult = await this.findById(uid);
            if (!existingResult.success) {
                return existingResult;
            }

            if (!existingResult.data) {
                return failure('Profile not found', 'NOT_FOUND');
            }

            const existing = existingResult.data;

            // Merge updates, handling nested preferences separately
            const updated = {
                ...existing,
                ...updates,
                preferences: {
                    ...existing.preferences,
                    ...(updates.preferences || {})
                },
                updatedAt: new Date()
            };

            // Ensure uid cannot be changed
            updated.uid = uid;

            const validation = validateUserProfile(updated);
            if (!validation.valid) {
                return failure(validation.error, 'VALIDATION_ERROR');
            }

            const key = this.getStorageKey(uid);
            const serialized = serializeUserProfile(updated);

            localStorage.setItem(key, JSON.stringify(serialized));

            return success(updated);
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return failure('Storage quota exceeded', 'QUOTA_EXCEEDED');
            }
            return failure(`Failed to update profile: ${error.message}`, 'UPDATE_ERROR');
        }
    }

    /**
     * Delete a user profile
     * @param {string} uid - User ID
     * @returns {Promise<Result>} Result with success status
     */
    async delete(uid) {
        try {
            if (!uid) {
                return failure('User ID is required', 'INVALID_UID');
            }

            const key = this.getStorageKey(uid);
            localStorage.removeItem(key);

            return success(true);
        } catch (error) {
            return failure(`Failed to delete profile: ${error.message}`, 'DELETE_ERROR');
        }
    }

    /**
     * Check if a user profile exists
     * @param {string} uid - User ID
     * @returns {Promise<Result>} Result with boolean
     */
    async exists(uid) {
        try {
            if (!uid) {
                return failure('User ID is required', 'INVALID_UID');
            }

            const key = this.getStorageKey(uid);
            const exists = localStorage.getItem(key) !== null;

            return success(exists);
        } catch (error) {
            return failure(`Failed to check existence: ${error.message}`, 'EXISTS_ERROR');
        }
    }
}
