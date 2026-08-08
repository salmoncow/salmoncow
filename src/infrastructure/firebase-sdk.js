/**
 * Single source of truth for the Firebase SDK version.
 *
 * The SDK is loaded from the gstatic CDN and marked external in
 * `vite.config.js`, so it is never bundled — the browser fetches it at runtime.
 * The version used to be hard-coded in seven separate feature files, which made
 * a bump a seven-file find-and-replace with no guard against missing one and
 * silently running two SDK versions side by side.
 *
 * Every Firebase import in `src/` now comes from this module, so the version
 * lives in the six URLs below and nowhere else.
 *
 * Re-exports are explicit rather than `export *` for two reasons: the areas
 * share names (`connect*Emulator`, `doc`) and would collide, and an explicit
 * list documents exactly how much of the SDK the app actually depends on.
 *
 * Keeping this in step with the `firebase` devDependency matters — that package
 * supplies the types used by `src/types/firebase-cdn.d.ts`, and a mismatch would
 * mean type-checking against a different version than ships. A unit test
 * asserts the two agree.
 */

export { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';

export {
    connectAuthEmulator,
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

export {
    collection,
    connectFirestoreEmulator,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    startAfter,
    Timestamp,
    updateDoc,
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

export {
    connectFunctionsEmulator,
    getFunctions,
    httpsCallable,
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js';

export {
    initializeAppCheck,
    ReCaptchaEnterpriseProvider,
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app-check.js';

export { getPerformance } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-performance.js';
