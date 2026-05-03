import {
    type Firestore,
    type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { type Role } from './admin.js';

/**
 * Refuses role changes that would leave the system with zero owners.
 *
 * Called inside the same `runTransaction` block as the role-change writes,
 * so the owner-count read shares the lock with the subsequent claim + mirror
 * writes — no TOCTOU window. The caller has already loaded `currentRole`
 * via `tx.get(userRef)` upstream, so this helper only needs the count.
 *
 * Throws `failed-precondition` if demoting `currentRole === 'owner'` would
 * drop the owner count to zero.
 *
 * Spec: §VI.1 (write ordering, fail-closed revocation).
 */
export async function assertNotLastOwner(
    tx: Transaction,
    db: Firestore,
    currentRole: Role | null,
    newRole: Role,
): Promise<void> {
    if (newRole === 'owner') {
        // Promoting to owner never reduces the owner count.
        return;
    }
    if (currentRole !== 'owner') {
        // Target isn't currently an owner; demotion can't reduce the count.
        return;
    }

    const ownersSnap = await tx.get(
        db.collection('users').where('role', '==', 'owner'),
    );

    if (ownersSnap.size <= 1) {
        throw new HttpsError(
            'failed-precondition',
            'cannot demote the last owner; promote another owner first',
        );
    }
}
