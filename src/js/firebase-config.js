// Firebase Configuration
// These values are safe to be public as they're client-side configuration
// Firebase security is handled by Firestore security rules and Auth settings

export const firebaseConfig = {
    apiKey: "{{VITE_FIREBASE_API_KEY}}",
    authDomain: "{{VITE_FIREBASE_AUTH_DOMAIN}}",
    projectId: "{{VITE_FIREBASE_PROJECT_ID}}",
    storageBucket: "{{VITE_FIREBASE_STORAGE_BUCKET}}",
    messagingSenderId: "{{VITE_FIREBASE_MESSAGING_SENDER_ID}}",
    appId: "{{VITE_FIREBASE_APP_ID}}",
    measurementId: "{{VITE_FIREBASE_MEASUREMENT_ID}}"
};

// Development environment check
export const isDevelopment = window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname === '';

// Validation function to check if config is properly set
export function validateFirebaseConfig() {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

    if (missingFields.length > 0) {
        throw new Error(`Firebase configuration incomplete. Missing values for: ${missingFields.join(', ')}`);
    }

    return true;
}

// Instructions for setup (will be logged in development)
if (isDevelopment) {
    console.log(`
🔥 Firebase Setup Instructions:
1. Go to https://console.firebase.google.com
2. Select or create your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click "Add app" or select existing web app
6. Copy the config values and update firebase-config.js
7. Enable Authentication > Sign-in method > Google in Firebase Console
8. Add your domain to authorized domains in Firebase Auth settings
    `);
}