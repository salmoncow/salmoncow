/**
 * FirestoreUserProfileRepository
 *
 * Firestore-backed implementation of the UserProfileRepository interface.
 * Source of truth for the admin list; mirrors the Firebase Auth `role` claim.
 *
 * Role-field discipline: this repo NEVER writes the `role` field from the
 * client path. Firestore rules reject such writes, but we also strip the
 * field out of incoming update payloads as defense in depth so failures
 * happen before the network round-trip.
 *
 * Spec §VI (security), §X.2 (data layer), §X.4
 */
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit as fsLimit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    startAfter,
    Timestamp,
    updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { failure, success, UserProfileRepository } from './user-profile-repository.js';

const USERS = 'users';

/**
 * Strip fields the client may not send. Server-side rules also reject these;
 * this is a fail-fast defense to keep bugs from reaching the network.
 */
const FORBIDDEN_CLIENT_FIELDS = Object.freeze(['role', 'roleChangedAt']);

function sanitizeUpdate(updates) {
    const clean = { ...updates };
    for (const key of FORBIDDEN_CLIENT_FIELDS) {
        delete clean[key];
    }
    return clean;
}

/** Firestore Timestamps → JS Dates; serverTimestamps in flight → null. */
function normalizeTimestamps(data) {
    const out = { ...data };
    for (const [k, v] of Object.entries(out)) {
        if (v instanceof Timestamp) out[k] = v.toDate();
    }
    return out;
}

export class FirestoreUserProfileRepository extends UserProfileRepository {
    /**
     * @param {import('firebase/firestore').Firestore} db
     */
    constructor(db) {
        super();
        if (!db) throw new Error('FirestoreUserProfileRepository requires a Firestore instance');
        this.db = db;
    }

    async findById(uid) {
        if (!uid) return failure('uid is required', 'INVALID_UID');
        try {
            const snap = await getDoc(doc(this.db, USERS, uid));
            if (!snap.exists()) return success(null);
            return success(normalizeTimestamps({ uid: snap.id, ...snap.data() }));
        } catch (err) {
            return failure(`findById failed: ${err.message}`, 'FIRESTORE_READ_ERROR');
        }
    }

    async save(profile) {
        if (!profile || !profile.uid) {
            return failure('profile with uid is required', 'INVALID_PROFILE');
        }
        // Client path must not carry a role field; onUserCreate is the seeder.
        const payload = sanitizeUpdate(profile);
        try {
            await setDoc(
                doc(this.db, USERS, profile.uid),
                {
                    ...payload,
                    updatedAt: serverTimestamp(),
                },
                { merge: true },
            );
            const saved = await this.findById(profile.uid);
            return saved;
        } catch (err) {
            return failure(`save failed: ${err.message}`, 'FIRESTORE_WRITE_ERROR');
        }
    }

    async update(uid, updates) {
        if (!uid) return failure('uid is required', 'INVALID_UID');
        if (!updates || typeof updates !== 'object') {
            return failure('updates object is required', 'INVALID_UPDATES');
        }
        const clean = sanitizeUpdate(updates);
        if (Object.keys(clean).length === 0) {
            return failure('nothing to update after removing forbidden fields', 'EMPTY_UPDATE');
        }
        try {
            await updateDoc(doc(this.db, USERS, uid), {
                ...clean,
                updatedAt: serverTimestamp(),
            });
            return this.findById(uid);
        } catch (err) {
            return failure(`update failed: ${err.message}`, 'FIRESTORE_WRITE_ERROR');
        }
    }

    async delete(uid) {
        // Rules deny deletes; kept for interface conformance.
        try {
            await deleteDoc(doc(this.db, USERS, uid));
            return success({ uid, deleted: true });
        } catch (err) {
            return failure(`delete failed (rules deny): ${err.message}`, 'FIRESTORE_PERMISSION_DENIED');
        }
    }

    async exists(uid) {
        const res = await this.findById(uid);
        if (!res.success) return res;
        return success(res.data !== null);
    }

    /**
     * Paginate users for the Admin Portal. Requires `admin` or `owner` claim
     * at the rules layer; callers should guard in UI too.
     *
     * @param {object} opts
     * @param {number} [opts.pageSize=20]
     * @param {Date|null} [opts.cursor]  createdAt of the last doc of the previous page
     * @returns {Promise<import('./user-profile-repository.js').Result>}
     *          On success: { data: { users, nextCursor } }
     */
    async listPaginated({ pageSize = 20, cursor = null } = {}) {
        try {
            const coll = collection(this.db, USERS);
            const parts = [orderBy('createdAt', 'desc')];
            if (cursor instanceof Date) {
                parts.push(startAfter(Timestamp.fromDate(cursor)));
            }
            parts.push(fsLimit(pageSize));
            const snap = await getDocs(query(coll, ...parts));
            const users = snap.docs.map((d) =>
                normalizeTimestamps({ uid: d.id, ...d.data() }),
            );
            const last = snap.docs[snap.docs.length - 1];
            const nextCursor = last ? last.data().createdAt?.toDate?.() ?? null : null;
            return success({
                users,
                nextCursor,
                hasMore: snap.docs.length === pageSize,
            });
        } catch (err) {
            return failure(`listPaginated failed: ${err.message}`, 'FIRESTORE_READ_ERROR');
        }
    }
}
