// Firebase Configuration
// These values are safe to be public as they're client-side configuration
// Firebase security is handled by Firestore security rules and Auth settings

export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validation function to check if config is properly set
export function validateFirebaseConfig() {
    const requiredFields = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId',
    ];
    const missingFields = requiredFields.filter((field) => !firebaseConfig[field]);

    if (missingFields.length > 0) {
        throw new Error(
            `Firebase configuration incomplete. Missing values for: ${missingFields.join(', ')}`,
        );
    }

    return true;
}
