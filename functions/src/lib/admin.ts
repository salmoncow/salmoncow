import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize the Admin SDK exactly once. In the emulator, FIRESTORE_EMULATOR_HOST
// and FIREBASE_AUTH_EMULATOR_HOST env vars are set automatically by
// `firebase emulators:exec`, so no extra wiring is needed.
if (getApps().length === 0) {
    initializeApp();
}

export const auth = getAuth();
export const db = getFirestore();

export type Role = 'owner' | 'admin' | 'user';
