/**
 * Admin User Service
 *
 * Thin application-layer wrapper that sits between the Admin Portal UI and
 * the Firestore repository / setUserRole callable. Two responsibilities:
 *
 * 1. Strip the raw user profile down to the limited field set the admin UI
 *    is allowed to see (spec §IV "limited public-ish fields"). Keeps future
 *    PII additions out of the admin surface unless explicitly opted in.
 * 2. Translate callable HttpsError codes into the Result shape the rest of
 *    the client uses, so the UI can render friendly messages.
 *
 * Spec §XI.3, §XI.4; AC-3, AC-15
 */

import { callable } from '../infrastructure/functions.js';
import { failure, success } from '../repositories/user-profile-repository.js';

const ADMIN_VISIBLE_FIELDS = Object.freeze([
    'uid',
    'email',
    'displayName',
    'photoURL',
    'createdAt',
    'lastSignInAt',
    'role',
]);

function toAdminUserDto(profile) {
    const out = {};
    for (const f of ADMIN_VISIBLE_FIELDS) {
        out[f] = profile[f] ?? null;
    }
    return out;
}

/** Friendly copy for the HttpsError codes setUserRole actually returns. */
const ERROR_MESSAGES = Object.freeze({
    'permission-denied': 'You do not have permission to change roles.',
    'invalid-argument': 'Invalid role or user id.',
    'failed-precondition': 'Cannot demote the last owner. Promote another owner first.',
    'resource-exhausted': 'Rate limit reached (20 role changes/hour). Try again soon.',
    'unauthenticated': 'App Check verification failed. Refresh and try again.',
});

export class AdminUserService {
    /**
     * @param {object} deps
     * @param {import('firebase/app').FirebaseApp} deps.firebaseApp
     * @param {import('../repositories/firestore-user-profile-repository.js').FirestoreUserProfileRepository} deps.repository
     */
    constructor({ firebaseApp, repository }) {
        if (!firebaseApp) throw new Error('AdminUserService requires firebaseApp');
        if (!repository) throw new Error('AdminUserService requires repository');
        this.repository = repository;
        this.setUserRoleCallable = callable(firebaseApp, 'setUserRole');
    }

    /**
     * Paginated user list for the admin table.
     * @param {object} [opts]
     * @param {number} [opts.pageSize=20]
     * @param {Date|null} [opts.cursor]
     * @returns {Promise<import('../repositories/user-profile-repository.js').Result>}
     *   On success: { data: { users: AdminUserDto[], nextCursor, hasMore } }
     */
    async listUsers({ pageSize = 20, cursor = null } = {}) {
        const res = await this.repository.listPaginated({ pageSize, cursor });
        if (!res.success) return res;
        return success({
            users: res.data.users.map(toAdminUserDto),
            nextCursor: res.data.nextCursor,
            hasMore: res.data.hasMore,
        });
    }

    /**
     * Invoke setUserRole callable. Server enforces owner-only, rate limit,
     * last-owner guard, and App Check. This method just surfaces the result
     * in Result shape.
     *
     * @param {string} targetUid
     * @param {'owner'|'admin'|'user'} role
     */
    async setUserRole(targetUid, role) {
        try {
            const res = await this.setUserRoleCallable({ targetUid, role });
            return success(res.data);
        } catch (err) {
            const code = err?.code ?? 'unknown';
            const message = ERROR_MESSAGES[code] ?? err?.message ?? 'Unknown error';
            return failure(message, code.toUpperCase().replace(/-/g, '_'));
        }
    }
}
