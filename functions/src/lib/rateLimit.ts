import {
    FieldValue,
    Timestamp,
    type Firestore,
    type Transaction,
} from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Fixed-window rate limiter for the setUserRole callable.
 *
 * Stores a counter per actor at:
 *   rateLimits/setUserRole/actors/{actorUid}
 *
 * Called inside the parent `runTransaction` block so the counter write is
 * queued atomically with the role change. If the parent TX commit fails,
 * the counter doesn't bump — retries aren't penalized.
 *
 * Window resets when the first call of a new hour arrives. Not a true
 * sliding window — acceptable for the admin surface. A compromised owner
 * account can still only issue 20 role changes / hour, capping blast
 * radius. Spec §VI.1 (rate-limit-on-failure trade-off).
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_CALLS_PER_WINDOW = 20;
const ACTION = 'setUserRole';

export async function checkAndBumpInTransaction(
    tx: Transaction,
    db: Firestore,
    actorUid: string,
): Promise<void> {
    const ref = db.doc(`rateLimits/${ACTION}/actors/${actorUid}`);
    const now = Date.now();

    const snap = await tx.get(ref);
    const data = snap.data();

    if (!data || !data.windowStart) {
        tx.set(ref, {
            windowStart: Timestamp.fromMillis(now),
            count: 1,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return;
    }

    const windowStartMs: number = (data.windowStart as Timestamp).toMillis();
    const isStale = now - windowStartMs >= WINDOW_MS;

    if (isStale) {
        tx.set(ref, {
            windowStart: Timestamp.fromMillis(now),
            count: 1,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return;
    }

    if ((data.count as number) >= MAX_CALLS_PER_WINDOW) {
        throw new HttpsError(
            'resource-exhausted',
            `rate limit exceeded: ${MAX_CALLS_PER_WINDOW} calls per hour`,
        );
    }

    tx.update(ref, {
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
    });
}

export const __testing__ = {
    WINDOW_MS,
    MAX_CALLS_PER_WINDOW,
    ACTION,
};
