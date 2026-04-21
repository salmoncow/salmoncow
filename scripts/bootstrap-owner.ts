#!/usr/bin/env tsx
/**
 * One-time bootstrap: grant the `owner` custom claim to a single Firebase
 * Auth user + mirror the role on their users/{uid} Firestore doc.
 *
 * This script is the only non-emulator path to set an `owner` claim — after
 * it runs, all future role changes flow through the setUserRole callable.
 * It must be run exactly once per project, using a downloaded service-account
 * key that lives outside the repo (or in .secrets/ which is gitignored).
 *
 * Usage (production):
 *   FIREBASE_SA_KEY=/abs/path/to/sa-key.json \
 *   TARGET_UID=<firebase-auth-uid> \
 *   npm run bootstrap:owner
 *
 *   # Preview what the script would do without writing:
 *   DRY_RUN=1 FIREBASE_SA_KEY=... TARGET_UID=... npm run bootstrap:owner
 *
 * Usage (emulator / dev):
 *   # When FIREBASE_AUTH_EMULATOR_HOST + FIRESTORE_EMULATOR_HOST are set
 *   # (e.g. by `firebase emulators:exec`), the script auto-detects emulator
 *   # mode and skips the service-account key requirement. The emulator
 *   # accepts any Admin SDK call without credentials.
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 *   GCLOUD_PROJECT=salmoncow \
 *   TARGET_UID=<uid-from-emulator> \
 *   npm run bootstrap:owner
 *
 * Full runbook: .specs/archive/001-multi-user-rbac/bootstrap.md
 */
import { readFileSync } from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
    FieldValue,
    getFirestore,
    type Firestore,
} from 'firebase-admin/firestore';

const isEmulator =
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !!process.env.FIRESTORE_EMULATOR_HOST;

type ServiceAccount = {
    project_id: string;
    client_email: string;
    private_key: string;
};

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v || v.length === 0) {
        console.error(`error: ${name} is required`);
        process.exit(2);
    }
    return v;
}

async function main(): Promise<void> {
    const targetUid = requireEnv('TARGET_UID');
    const dryRun = process.env.DRY_RUN === '1';

    let projectId: string;
    let saEmail = '(emulator — no service account)';

    if (isEmulator) {
        // Emulator accepts any Admin SDK call without credentials. Use the
        // project id Firebase emulators:exec provisioned (GCLOUD_PROJECT).
        projectId =
            process.env.GCLOUD_PROJECT ??
            process.env.GCP_PROJECT ??
            'salmoncow';
    } else {
        const keyPath = requireEnv('FIREBASE_SA_KEY');
        let sa: ServiceAccount;
        try {
            sa = JSON.parse(readFileSync(keyPath, 'utf8')) as ServiceAccount;
        } catch (e) {
            console.error(`error: cannot read service account key at ${keyPath}`);
            console.error((e as Error).message);
            process.exit(2);
        }
        if (!sa.project_id || !sa.client_email || !sa.private_key) {
            console.error('error: service account key is missing required fields');
            process.exit(2);
        }
        projectId = sa.project_id;
        saEmail = sa.client_email;
        if (getApps().length === 0) {
            initializeApp({
                credential: cert({
                    projectId: sa.project_id,
                    clientEmail: sa.client_email,
                    privateKey: sa.private_key,
                }),
            });
        }
    }

    if (isEmulator && getApps().length === 0) {
        initializeApp({ projectId });
    }

    console.log('─── bootstrap-owner ─────────────────────────────────────');
    console.log(`project   : ${projectId}`);
    console.log(`target uid: ${targetUid}`);
    console.log(`sa email  : ${saEmail}`);
    console.log(`mode      : ${isEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
    console.log(`dry run   : ${dryRun ? 'YES (no writes)' : 'NO (will write)'}`);
    console.log('─────────────────────────────────────────────────────────');

    const auth = getAuth();
    const db: Firestore = getFirestore();

    // Verify the target exists before we write anything.
    let user;
    try {
        user = await auth.getUser(targetUid);
    } catch (e) {
        console.error(`error: uid ${targetUid} does not exist in Firebase Auth`);
        console.error('the user must sign in to the app at least once first');
        console.error((e as Error).message);
        process.exit(3);
    }

    const currentRole = user.customClaims?.role ?? '(none)';
    console.log(`current claim role: ${currentRole}`);

    if (currentRole === 'owner') {
        console.log('no-op: user already has owner claim');
        return;
    }

    if (dryRun) {
        console.log('DRY_RUN=1 — would set role=owner claim and upsert users/{uid}.role');
        return;
    }

    // 1. Set the custom claim (the primary auth signal — rules read this).
    await auth.setCustomUserClaims(targetUid, { role: 'owner' });
    console.log('✓ set custom claim role=owner');

    // 2. Upsert the Firestore mirror so the admin list shows the correct role
    //    (onUserCreate seeds role=user; this brings the doc into alignment).
    const ref = db.doc(`users/${targetUid}`);
    const snap = await ref.get();
    if (snap.exists) {
        await ref.update({
            role: 'owner',
            roleChangedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        console.log('✓ updated users/{uid} mirror to role=owner');
    } else {
        await ref.set({
            uid: targetUid,
            email: user.email ?? null,
            displayName: user.displayName ?? null,
            photoURL: user.photoURL ?? null,
            role: 'owner',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            roleChangedAt: FieldValue.serverTimestamp(),
            preferences: { theme: 'system', emailNotifications: false },
        });
        console.log('✓ created users/{uid} mirror with role=owner');
    }

    console.log('─────────────────────────────────────────────────────────');
    console.log('done. The user must sign out and back in (or wait up to ~1h)');
    console.log('for the new token to reflect the owner claim.');
    console.log('Next: delete the service-account key file from disk.');
}

main().catch((e) => {
    console.error('bootstrap failed:', e);
    process.exit(1);
});
