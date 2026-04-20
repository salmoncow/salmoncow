/**
 * Firestore client singleton.
 *
 * Initializes once per app and auto-wires to the emulator in dev. Exposes
 * the raw `db` for repositories + an `onSnapshotDoc` helper that returns
 * an unsubscribe function (for predictable cleanup).
 *
 * Spec §X.1 (infrastructure layer)
 */
import {
    connectFirestoreEmulator,
    getFirestore,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { EMULATOR_HOSTS, isEmulatorMode } from './emulator.js';

let dbInstance = null;

export function getDb(firebaseApp) {
    if (dbInstance) return dbInstance;
    dbInstance = getFirestore(firebaseApp);
    if (isEmulatorMode()) {
        const { host, port } = EMULATOR_HOSTS.firestore;
        connectFirestoreEmulator(dbInstance, host, port);
        console.info(`[firestore] connected to emulator at ${host}:${port}`);
    }
    return dbInstance;
}
