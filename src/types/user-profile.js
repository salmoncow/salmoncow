/**
 * UserProfile Type Definition and Factory Functions
 *
 * Defines the user profile data structure used throughout the application.
 * Abstracts storage details - works with any backend (LocalStorage, Firestore, etc.)
 *
 * Architecture Reference:
 * - .prompts/core/architecture/code-structure.md (Data Types)
 * - .prompts/core/architecture/feature-extensibility.md (Dependency Inversion)
 */

/**
 * @typedef {Object} UserPreferences
 * @property {'light' | 'dark' | 'system'} theme - User's preferred theme
 * @property {boolean} emailNotifications - Whether to receive email notifications
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} uid - Firebase Auth user ID
 * @property {string} email - User's email address
 * @property {string} displayName - User's display name
 * @property {string|null} photoURL - User's profile photo URL
 * @property {Date} createdAt - Profile creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {UserPreferences} preferences - User's preferences
 */

/**
 * Default preferences for new users
 * @type {UserPreferences}
 */
export const DEFAULT_PREFERENCES = Object.freeze({
    theme: 'system',
    emailNotifications: true
});

/**
 * Create a new UserProfile from Firebase Auth user
 * Used when user signs in for the first time
 *
 * @param {Object} authUser - Firebase Auth user object
 * @param {string} authUser.uid - User's unique ID
 * @param {string} authUser.email - User's email
 * @param {string} [authUser.displayName] - User's display name
 * @param {string} [authUser.photoURL] - User's photo URL
 * @returns {UserProfile} New user profile
 */
export function createUserProfileFromAuth(authUser) {
    const now = new Date();

    return {
        uid: authUser.uid,
        email: authUser.email || '',
        displayName: authUser.displayName || '',
        photoURL: authUser.photoURL || null,
        createdAt: now,
        updatedAt: now,
        preferences: { ...DEFAULT_PREFERENCES }
    };
}

/**
 * Validate a UserProfile object
 * Returns validation result with specific error if invalid
 *
 * @param {*} profile - Object to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUserProfile(profile) {
    if (!profile || typeof profile !== 'object') {
        return { valid: false, error: 'Profile must be an object' };
    }

    if (!profile.uid || typeof profile.uid !== 'string') {
        return { valid: false, error: 'Profile must have a valid uid' };
    }

    if (typeof profile.email !== 'string') {
        return { valid: false, error: 'Profile must have an email string' };
    }

    if (typeof profile.displayName !== 'string') {
        return { valid: false, error: 'Profile must have a displayName string' };
    }

    if (!profile.preferences || typeof profile.preferences !== 'object') {
        return { valid: false, error: 'Profile must have preferences object' };
    }

    return { valid: true };
}

/**
 * Serialize a UserProfile for storage
 * Converts Date objects to ISO strings
 *
 * @param {UserProfile} profile - Profile to serialize
 * @returns {Object} Serialized profile
 */
export function serializeUserProfile(profile) {
    return {
        ...profile,
        createdAt: profile.createdAt instanceof Date
            ? profile.createdAt.toISOString()
            : profile.createdAt,
        updatedAt: profile.updatedAt instanceof Date
            ? profile.updatedAt.toISOString()
            : profile.updatedAt
    };
}

/**
 * Deserialize a UserProfile from storage
 * Converts ISO strings back to Date objects
 *
 * @param {Object} data - Serialized profile data
 * @returns {UserProfile} Deserialized profile
 */
export function deserializeUserProfile(data) {
    return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
    };
}
