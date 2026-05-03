/**
 * Emulator detection for local development.
 *
 * Dev runs against the Firebase Local Emulator Suite — Auth, Firestore, and
 * Functions — started by `npm run dev`. Production runs against the real
 * Firebase project. Detection is purely env-based, no runtime hostname
 * sniffing, so the behavior is predictable in CI and tests.
 *
 * Spec §XI.1, §XI.4
 */

const isDev = import.meta.env.DEV === true;
const explicitOptOut = import.meta.env.VITE_USE_EMULATOR === 'false';

export function isEmulatorMode() {
    return isDev && !explicitOptOut;
}

// Default emulator endpoints match firebase.json emulators block.
export const EMULATOR_HOSTS = Object.freeze({
    auth: 'http://127.0.0.1:9099',
    firestore: { host: '127.0.0.1', port: 8080 },
    functions: { host: '127.0.0.1', port: 5001 },
});
