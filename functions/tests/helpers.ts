import firebaseFunctionsTest from 'firebase-functions-test';
import { auth } from '../src/lib/admin.js';

// Shared setup for Cloud Function unit tests.
//
// We rely on `firebase emulators:exec --only auth,firestore,functions ...` to
// provision the Auth + Firestore emulators and set FIRESTORE_EMULATOR_HOST /
// FIREBASE_AUTH_EMULATOR_HOST / GCLOUD_PROJECT before our admin SDK imports
// initialize. We must NOT override GCLOUD_PROJECT here — doing so creates a
// project mismatch where Firestore writes go to one project and our REST-based
// clearFirestore calls another, silently leaking data across tests.

// Read project ID from whatever emulators:exec set.
export const PROJECT_ID =
    process.env.GCLOUD_PROJECT ??
    process.env.GCP_PROJECT ??
    'salmoncow';

// firebase-functions-test harness (wrap for v2 callables + v1 auth triggers)
export const ft = firebaseFunctionsTest({ projectId: PROJECT_ID });

// Reset Firestore between tests via the emulator REST endpoint.
export async function clearFirestore(): Promise<void> {
    const host = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
    const url = `http://${host}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
        throw new Error(`clearFirestore failed: ${res.status} ${await res.text()}`);
    }
}

// Counter for unique uids per test so we don't need to clear Auth state.
let uidCounter = 0;
export function nextUid(prefix = 'u'): string {
    uidCounter += 1;
    return `${prefix}-${Date.now()}-${uidCounter}`;
}

/**
 * Create a Firebase Auth user in the emulator. Idempotent — swallows the
 * "uid-already-exists" error so helpers can be called multiple times safely.
 *
 * In CI the real onUserCreate trigger is loaded in the Functions emulator
 * and auto-fires on createUser. That trigger races with the test's direct
 * `wrapped(userRecord)` invocation. To keep the resulting users/{uid} doc
 * deterministic regardless of which write lands last, callers that also
 * pass a userRecord to `wrapped` must mirror its fields here.
 */
export async function ensureAuthUser(
    uid: string,
    email?: string,
    displayName?: string,
    photoURL?: string,
): Promise<void> {
    try {
        await auth.createUser({
            uid,
            email: email ?? `${uid}@example.com`,
            displayName: displayName ?? uid,
            ...(photoURL ? { photoURL } : {}),
        });
    } catch (e) {
        const err = e as { code?: string; errorInfo?: { code?: string } };
        const code = err.errorInfo?.code ?? err.code;
        if (code !== 'auth/uid-already-exists') throw e;
    }
}
