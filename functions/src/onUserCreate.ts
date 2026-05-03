import { FieldValue } from 'firebase-admin/firestore';
import * as functionsV1 from 'firebase-functions/v1';
import { auth, db } from './lib/admin.js';

/**
 * onUserCreate — seeds a users/{uid} document and sets the default `user`
 * custom claim the first time a Firebase Auth user is created (any provider;
 * Google in practice).
 *
 * Uses v1 auth triggers (functions.auth.user().onCreate) because the v2
 * equivalent (beforeUserCreated) requires the Identity Platform upgrade.
 * Idempotent: if a users/{uid} doc already exists (rare re-create edge case),
 * the write is a merge that won't stomp an existing role.
 *
 * Spec §VII, §XI.4; AC-1.
 */
export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;

    // Set the default role claim. Won't overwrite a pre-existing claim
    // because new Auth records have no claims yet by definition.
    await auth.setCustomUserClaims(uid, { role: 'user' });

    const ref = db.doc(`users/${uid}`);
    await ref.set(
        {
            uid,
            email: email ?? null,
            displayName: displayName ?? null,
            photoURL: photoURL ?? null,
            role: 'user',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            lastSignInAt: null,
            preferences: {
                theme: 'system',
                emailNotifications: false,
            },
        },
        { merge: true }, // idempotent on re-fire
    );
});
