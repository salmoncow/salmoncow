/**
 * Cloud Functions client singleton.
 *
 * Initializes once per app and auto-wires to the emulator in dev. The
 * `callable(name)` helper returns a pre-configured httpsCallable function
 * tied to the default region (us-central1 unless overridden in firebase.json).
 *
 * Spec §XI.1, §XI.4 (callable entry)
 */
import {
    connectFunctionsEmulator,
    getFunctions,
    httpsCallable,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-functions.js';
import { EMULATOR_HOSTS, isEmulatorMode } from './emulator.js';

let functionsInstance = null;

export function getFns(firebaseApp) {
    if (functionsInstance) return functionsInstance;
    functionsInstance = getFunctions(firebaseApp);
    if (isEmulatorMode()) {
        const { host, port } = EMULATOR_HOSTS.functions;
        connectFunctionsEmulator(functionsInstance, host, port);
        console.info(`[functions] connected to emulator at ${host}:${port}`);
    }
    return functionsInstance;
}

/**
 * Produce a typed callable for a named function.
 * @param {import('firebase/app').FirebaseApp} firebaseApp
 * @param {string} name  The exported function name (matches functions/src/index.ts)
 * @returns {(data: unknown) => Promise<{ data: unknown }>}
 */
export function callable(firebaseApp, name) {
    return httpsCallable(getFns(firebaseApp), name);
}
