import { HttpsError } from 'firebase-functions/v2/https';
import { db, type Role } from './admin.js';

/**
 * Refuses role changes that would leave the system with zero owners.
 *
 * Called BEFORE setCustomUserClaims so the claim write doesn't happen on a
 * doomed call. Reads the current owner set via a role==owner query. Has a
 * small TOCTOU window between this check and the claim write; for a hobby
 * admin surface this is acceptable, and the rate limiter caps exposure.
 * Spec §VI.5, §X.4.
 */
export async function assertNotLastOwnerDemotion(
    targetUid: string,
    newRole: Role,
): Promise<void> {
    if (newRole === 'owner') {
        // Promoting to owner never reduces the owner count.
        return;
    }

    const ownersSnap = await db
        .collection('users')
        .where('role', '==', 'owner')
        .get();

    const isTargetAnOwner = ownersSnap.docs.some((d) => d.id === targetUid);
    if (!isTargetAnOwner) {
        // Target isn't currently an owner, so demotion can't reduce the count.
        return;
    }

    if (ownersSnap.size <= 1) {
        throw new HttpsError(
            'failed-precondition',
            'cannot demote the last owner; promote another owner first',
        );
    }
}
