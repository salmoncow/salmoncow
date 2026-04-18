import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from './admin.js';

/**
 * Fixed-window rate limiter for the setUserRole callable.
 *
 * Stores a counter per actor at:
 *   rateLimits/{action}/actors/{actorUid}
 *
 * Window resets when the first call of a new hour arrives. Not a true
 * sliding window — acceptable for a hobby admin surface. A compromised
 * owner account can still only issue 20 role changes / hour, capping blast
 * radius. Spec §VI.6, §X.4.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_CALLS_PER_WINDOW = 20;

export async function checkAndIncrementRateLimit(
    action: string,
    actorUid: string,
): Promise<void> {
    const ref = db.doc(`rateLimits/${action}/actors/${actorUid}`);
    const now = Date.now();

    await db.runTransaction(async (tx) => {
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
    });
}

export const __testing__ = {
    WINDOW_MS,
    MAX_CALLS_PER_WINDOW,
};
