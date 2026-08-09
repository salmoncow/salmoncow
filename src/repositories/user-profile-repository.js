/**
 * UserProfileRepository Interface
 *
 * Defines the contract for user profile storage operations.
 * Implementations can use LocalStorage, Firestore, or any other backend.
 *
 * Uses Result pattern for predictable error handling.
 */

/**
 * @typedef {Object} Result
 * @property {boolean} success - Whether the operation succeeded
 * @property {*} [data] - The result data (on success)
 * @property {string} [error] - Error message (on failure)
 * @property {string} [code] - Error code for programmatic handling
 */

/**
 * Create a success result
 * @param {*} data - The result data
 * @returns {Result}
 */
export function success(data) {
    return {
        success: true,
        data,
    };
}

/**
 * Create a failure result
 * @param {string} error - Error message
 * @param {string} [code] - Error code
 * @returns {Result}
 */
export function failure(error, code = 'UNKNOWN_ERROR') {
    return {
        success: false,
        error,
        code,
    };
}

/**
 * UserProfileRepository Interface
 *
 * All repository implementations must implement these methods.
 * Each method returns a Result object for consistent error handling.
 *
 * @interface
 */
export class UserProfileRepository {
    /**
     * Find a user profile by ID
     * @param {string} uid - User ID
     * @returns {Promise<Result>} Result with UserProfile or null if not found
     */
    async findById(uid) {
        throw new Error('Method not implemented: findById');
    }

    /**
     * Save a new user profile
     * @param {import('../types/user-profile.js').UserProfile} profile - Profile to save
     * @returns {Promise<Result>} Result with saved profile
     */
    async save(profile) {
        throw new Error('Method not implemented: save');
    }

    /**
     * Update an existing user profile
     * @param {string} uid - User ID
     * @param {Partial<import('../types/user-profile.js').UserProfile>} updates - Fields to update
     * @returns {Promise<Result>} Result with updated profile
     */
    async update(uid, updates) {
        throw new Error('Method not implemented: update');
    }

    /**
     * Delete a user profile
     * @param {string} uid - User ID
     * @returns {Promise<Result>} Result with success status
     */
    async delete(uid) {
        throw new Error('Method not implemented: delete');
    }

    /**
     * Check if a user profile exists
     * @param {string} uid - User ID
     * @returns {Promise<Result>} Result with boolean exists value
     */
    async exists(uid) {
        throw new Error('Method not implemented: exists');
    }

    /**
     * Subscribe to live changes on a single user profile.
     *
     * Exists so callers that need realtime updates do not reach past this
     * interface into the Firestore SDK. RoleModule previously imported
     * onSnapshot directly, which made users/{uid} readable through two
     * independent paths and meant the document shape was known in two places.
     *
     * @param {string} uid
     * @param {(profile: object|null) => void} onNext  Normalized profile, or
     *   null when the document does not exist.
     * @param {(error: Error & { code?: string }) => void} [onError]
     * @returns {Function} unsubscribe
     */
    onProfileChange(uid, onNext, onError) {
        throw new Error('Method not implemented: onProfileChange');
    }
}
