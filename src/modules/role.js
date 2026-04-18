/**
 * Role module — derives the current user's role from their ID-token custom
 * claim, keeps it in sync with the users/{uid}.roleChangedAt mirror, and
 * broadcasts changes to subscribers.
 *
 * Flow:
 *   1. On auth state change, read getIdTokenResult().claims.role
 *   2. Open onSnapshot on users/{uid}; when roleChangedAt bumps, force-refresh
 *      the token (getIdToken(true)) so the claim updates without re-login
 *   3. Notify all onRoleChange subscribers whenever role transitions
 *
 * Defaults to 'user' when the claim is missing (fresh sign-in before
 * onUserCreate fires, or a token that never got a claim). Matches Firestore
 * rules, which treat missing role as least-privilege.
 *
 * Spec §X.1 (application layer), AC-2, AC-9
 */
import {
    doc,
    onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

const ROLES = Object.freeze(['owner', 'admin', 'user']);
const DEFAULT_ROLE = 'user';

export class RoleModule {
    /**
     * @param {import('./auth.js').AuthModule} authModule
     * @param {import('firebase/firestore').Firestore} db
     */
    constructor(authModule, db) {
        if (!authModule) throw new Error('RoleModule requires authModule');
        if (!db) throw new Error('RoleModule requires db');
        this.auth = authModule;
        this.db = db;

        /** @type {'owner'|'admin'|'user'|null} null = unknown/not-signed-in */
        this.role = null;
        /** @type {string|null} */
        this.roleChangedAtIso = null;
        /** @type {Function[]} */
        this.listeners = [];
        /** @type {Function|null} unsubscribe for active users/{uid} listener */
        this.mirrorUnsub = null;
        /** @type {string|null} uid currently subscribed to */
        this.subscribedUid = null;
    }

    init() {
        this.auth.onAuthStateChanged((user) => {
            if (!user) {
                this._teardownMirror();
                this._setRole(null);
                return;
            }
            this._refreshRoleFromToken(user).then(() => {
                this._subscribeMirror(user.uid);
            });
        });
    }

    /** Current role, or null if not signed in / unknown. */
    getRole() {
        return this.role;
    }

    isOwner() {
        return this.role === 'owner';
    }

    isAdminOrOwner() {
        return this.role === 'admin' || this.role === 'owner';
    }

    /**
     * Force a token refresh and re-read the role claim. Call after a
     * privileged action to make sure the UI reflects server reality.
     */
    async refreshRole() {
        const user = this.auth.getCurrentUser();
        if (!user) return null;
        await user.getIdToken(true); // force refresh
        return this._refreshRoleFromToken(user);
    }

    /**
     * Subscribe to role changes. Fires immediately with the current value,
     * then again on every transition. Returns an unsubscribe fn.
     */
    onRoleChange(cb) {
        this.listeners.push(cb);
        try {
            cb(this.role);
        } catch (err) {
            console.error('[role] initial callback threw:', err);
        }
        return () => {
            const i = this.listeners.indexOf(cb);
            if (i !== -1) this.listeners.splice(i, 1);
        };
    }

    // ── internals ─────────────────────────────────────────────────────────

    async _refreshRoleFromToken(user) {
        try {
            const tokenResult = await user.getIdTokenResult();
            const claim = tokenResult.claims?.role;
            const next = ROLES.includes(claim) ? claim : DEFAULT_ROLE;
            this._setRole(next);
            return next;
        } catch (err) {
            console.error('[role] failed to read token claim:', err);
            this._setRole(DEFAULT_ROLE);
            return DEFAULT_ROLE;
        }
    }

    _subscribeMirror(uid) {
        // Avoid duplicate listeners if auth state fires twice for same uid.
        if (this.subscribedUid === uid && this.mirrorUnsub) return;
        this._teardownMirror();

        this.subscribedUid = uid;
        this.mirrorUnsub = onSnapshot(
            doc(this.db, 'users', uid),
            async (snap) => {
                if (!snap.exists()) return;
                const data = snap.data();
                const ts = data.roleChangedAt?.toDate?.()?.toISOString?.() ?? null;
                if (ts && ts !== this.roleChangedAtIso) {
                    this.roleChangedAtIso = ts;
                    await this.refreshRole();
                }
            },
            (err) => {
                // Ignore permission-denied during sign-out races; log otherwise.
                if (err.code !== 'permission-denied') {
                    console.error('[role] mirror listener error:', err);
                }
            },
        );
    }

    _teardownMirror() {
        if (this.mirrorUnsub) {
            this.mirrorUnsub();
            this.mirrorUnsub = null;
        }
        this.subscribedUid = null;
        this.roleChangedAtIso = null;
    }

    _setRole(next) {
        if (next === this.role) return;
        this.role = next;
        for (const cb of this.listeners) {
            try {
                cb(next);
            } catch (err) {
                console.error('[role] subscriber callback threw:', err);
            }
        }
    }
}
