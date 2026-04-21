/**
 * Repository Factory
 *
 * Constructs repository instances wired to Firestore. The localStorage
 * implementation was retired when the project adopted Firestore as the
 * source of truth for the users collection — see
 * .specs/archive/001-multi-user-rbac/spec.md §X.1, §X.2.
 *
 * Local dev uses the Firestore emulator (wired automatically by
 * src/infrastructure/firestore.js). Developer setup: run `npm run dev`
 * which starts the emulator + Vite together.
 *
 * Architecture: factory pattern preserved so future backends (e.g. an
 * alternate projection) can be added without touching the service layer.
 */

import { getDb } from '../infrastructure/firestore.js';
import { FirestoreUserProfileRepository } from '../repositories/firestore-user-profile-repository.js';

/**
 * @typedef {Object} RepositoryConfig
 * @property {import('firebase/app').FirebaseApp} firebaseApp - Required; used to derive Firestore
 */

export class RepositoryFactory {
    /**
     * @param {RepositoryConfig} config
     */
    constructor(config = {}) {
        if (!config.firebaseApp) {
            throw new Error('RepositoryFactory requires config.firebaseApp');
        }
        this.firebaseApp = config.firebaseApp;
        this.instances = new Map();
    }

    getUserProfileRepository() {
        const key = 'userProfile:firestore';
        if (this.instances.has(key)) return this.instances.get(key);
        const repo = new FirestoreUserProfileRepository(getDb(this.firebaseApp));
        this.instances.set(key, repo);
        return repo;
    }
}

/**
 * @param {RepositoryConfig} config
 */
export function createRepositoryFactory(config) {
    return new RepositoryFactory(config);
}
