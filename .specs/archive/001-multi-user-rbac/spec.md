# Feature Specification: Multi-User RBAC (owner / admin / user)

**Version**: 1.0.0
**Created**: 2026-04-18
**Status**: Draft
**Planning artifact**: [/Users/ted/.claude/plans/this-website-is-a-functional-badger.md](../../../../.claude/plans/this-website-is-a-functional-badger.md)

---

## I. Overview

Introduce a three-role role-based access control (RBAC) system for Salmoncow. All sign-in remains via Google federation. Roles are enforced via Firebase Auth **custom claims** (primary gate in Firestore rules) with a **Firestore `users/{uid}` mirror** as the source of truth for the admin UI. Role changes are made exclusively via a server-side callable Cloud Function; the client never writes the `role` field.

**Roles:**
- `owner` — singleton (the project administrator). Full access, including the in-app Admin Portal that can change any user's role.
- `admin` — content manager / "website admin". Can CRUD site content and view a limited user list. Cannot change roles.
- `user` — default role assigned on first sign-in. Can view content and edit own profile.

**Not in scope:** email/password or non-Google providers, finer-grained permissions, soft-delete flows, the actual content schema (a placeholder `content/{id}` collection exercises rules only).

---

## II. Constitutional Constraints

**Phase transitions triggered by this feature:**
- §II.1 **Security: Phase 1 → Phase 2** — the Phase 2 target is explicitly "App Check + Custom Claims," which this feature implements. Decision-log entry required per §V.2.
- §II.1 **Data: Phase 1 → Phase 1+** — first Firestore usage in the project; remains "Simple Collections" but with rules.
- §II.1 **Cost: Phase 1 Free Tier → Blaze** — §VI.1 currently describes Spark free tier; the project is actually on Blaze. **Constitution correction required** (§VI.1 text and §II.1 Cost row).
- §II.1 **Testing: Phase 1 Manual → Phase 2 Unit Tests** for this feature's rules/Function code — critical-path security code mandates 100% coverage per §III.1, so this feature introduces `@firebase/rules-unit-testing` and Function unit tests even if broader Phase 2 adoption comes later.

**Quality standards that apply:**
- §III.1 Testing — critical path (auth/authorization): 100% coverage required. Rules matrix tests + Function unit tests.
- §III.2 Security — server-side authorization on every protected operation; never trust client role state; rules tested in emulator before deploy.
- §III.3 Performance — rules must use `request.auth.token.role` (free) not `get()` (1 read each) where possible; admin user list paginated with `limit()`.
- §III.4 Code Quality — enforced by git-conventions skill (Conventional Commits, branch naming, PR body).
- §IV.1 Tech stack — vanilla Web Components for UI; Firebase v10.x SDK (currently v10.13.2); add Cloud Functions (TypeScript).
- §IV.2 Forbidden patterns — no client-side filtering, no unbounded reads, no uncleaned `onSnapshot`.

**Forbidden patterns explicitly avoided:**
- ❌ Client-side role checks as the security boundary (UI hiding only; server always authoritative).
- ❌ Unbounded `getDocs` in admin user list (paginated via `limit(20)` + cursor).
- ❌ Client-side filtering (user list uses Firestore `where`/`orderBy` + cursor).
- ❌ Granting any client the ability to write the `role` field (rules reject it; Admin SDK is the only writer).

---

## III. User Stories

**Owner (you)**
1. As the owner, after running the one-time bootstrap script on my Firebase Auth UID, I see an Admin Portal link appear after my next token refresh.
2. As the owner, I open `/admin`, see a paginated list of every user with displayName, email, photoURL, createdAt, lastSignInAt, and current role.
3. As the owner, I change a user's role via an inline dropdown; after the callable returns, the target user's next token refresh reflects the new role (UI guards update for them accordingly).
4. As the owner, I can promote a user to `admin`, demote an `admin` back to `user`, and (theoretically) grant `owner` to a second trusted account — but not revoke my own `owner` claim if I am the last owner.
5. As the owner, I can read the `audit` collection to see every role change (actorUid, targetUid, fromRole, toRole, at).

**Admin (sub-admin / content manager)**
1. As an admin, after being promoted, my next ID-token refresh shows me the Admin Portal navigation link.
2. As an admin, I can view the user list with the limited field set but the role-change dropdown is not rendered for me.
3. As an admin, I can create, read, update, and delete documents in `content/{id}`.
4. As an admin, if I attempt to call `setUserRole` directly (e.g., via devtools), I receive a `permission-denied` error.

**User (default)**
1. As a new user signing in with Google for the first time, a `users/{uid}` document is created automatically with `role: 'user'` and my ID-token custom claim is set to `'user'`.
2. As a user, I can view `/` and `/profile` but `/admin` redirects me to `/`.
3. As a user, I can read any `content/{id}` but cannot write.
4. As a user, I can update my own profile preferences but any attempt to include the `role` field in a client write is rejected by Firestore rules.

**Negative / abuse scenarios**
1. A malicious client that tampers its ID token — signature check fails server-side, rules treat the request as unauthenticated.
2. An admin whose account is compromised — attacker can see the user list and edit content but cannot elevate to owner (callable rejects non-owner) and cannot modify the `role` field via direct Firestore write.
3. A rate-abusing owner — `setUserRole` is rate-limited (20 calls/hour/owner via Firestore counter) so a compromised owner key can't mass-promote.

---

## IV. Acceptance Criteria

**Functional**
- [ ] AC-1: `onUserCreate` auth trigger writes a `users/{uid}` document with `role: 'user'` and sets the matching custom claim within one token lifecycle of first sign-in.
- [ ] AC-2: Hash route `/admin` is gated: redirect to `/` unless the current ID-token claim `role` is `owner` or `admin`.
- [ ] AC-3: The user list in the Admin Portal displays displayName, email, photoURL, createdAt, lastSignInAt, role. No preferences or other PII shown.
- [ ] AC-4: Only `owner` sees and can use the role-change dropdown. The control is absent from DOM for `admin`.
- [ ] AC-5: Calling `setUserRole` as a non-owner returns `permission-denied`; as an owner, it succeeds, updates the custom claim, updates `users/{uid}.role`, and writes an `audit/{autoId}` entry, atomically.
- [ ] AC-6: `setUserRole` rejects invalid role values (anything not `owner`/`admin`/`user`) with `invalid-argument`.
- [ ] AC-7: `setUserRole` refuses to remove the last `owner` in the system.
- [ ] AC-8: `setUserRole` is rate-limited to 20 calls/hour per owner; the 21st returns `resource-exhausted`.
- [ ] AC-9: The client forces an ID-token refresh on the target user after a role change (via `users/{uid}.roleChangedAt` snapshot listener), so the target's UI guards update without a manual re-login.
- [ ] AC-10: Firestore rules reject any direct client write to the `role` field on `users/{uid}` regardless of caller role.

**Security (critical path — 100% test coverage per §III.1)**
- [ ] AC-11: Rules unit tests cover the matrix {owner, admin, user, anonymous} × {users CRUD on self + other, content CRUD, audit read} × {allow, deny}.
- [ ] AC-12: Function unit tests cover: non-owner rejected, owner succeeds, invalid role rejected, last-owner demotion blocked, rate-limit enforced, claim+doc consistent after call, audit entry written.
- [ ] AC-13: Rules are tested in the emulator before every deploy (`firebase deploy --only firestore:rules --dry-run` then full deploy).
- [ ] AC-14: No secrets in client code; service-account key for bootstrap is gitignored and referenced via env var.

**Performance & Cost**
- [ ] AC-15: Admin user list uses `limit(20)` + cursor pagination; never reads the full `users` collection.
- [ ] AC-16: Firestore rules for role checks use `request.auth.token.role` (token-embedded, zero-read) rather than `get()` where feasible.
- [ ] AC-17: Role-change operations stay well within Firestore write quota (each call: 1 claim update + 1 user doc write + 1 audit write = 3 writes; rate limit caps total daily writes from RBAC at <500).

**Documentation**
- [ ] AC-18: Bootstrap runbook documented at `.specs/features/001-multi-user-rbac/bootstrap.md`.
- [ ] AC-19: Constitution §VI.1 updated: Spark → Blaze. §II.1 Security row advanced to Phase 2. Decision-log entry added.
- [ ] AC-20: PR description includes Summary, Changes, Testing, Guidance References (per §V.1).

---

## V. Architecture Approach

**Pattern references (global skills, since `.prompts/core/*` migrated):**
- `software-architecture` — layered architecture (presentation/application/infrastructure), dependency direction, least-privilege.
- `asset-reusability` — the existing `UserProfileRepository` factory pattern is reused; a new `FirestoreUserProfileRepository` slots in without changing callers.
- `testing-principles` — test pyramid; critical-path 100% coverage; rules + Function tests live at unit-test layer.

**Layering in this feature:**
- **Presentation**: `src/components/AdminPortal.js` (web component, stateless), `src/modules/admin-portal.js` (wiring, event handlers).
- **Application**: `src/modules/role.js` (reads token claims, exposes observable role state), existing `src/modules/auth.js` (extended to re-fetch token after role changes), `src/modules/router.js` (extended with `/admin` guard).
- **Infrastructure**: `src/repositories/firestore-user-profile-repository.js` (Firestore client), callable invocation via Firebase Functions SDK.

**Server-side (new):** `functions/` package (TypeScript) with:
- `functions/src/index.ts` — exports callables + triggers.
- `functions/src/setUserRole.ts` — owner-only role writer.
- `functions/src/onUserCreate.ts` — auth-trigger user-doc seeder.
- `functions/src/lib/validate.ts` — zod schemas for inputs.
- `functions/src/lib/rateLimit.ts` — Firestore-backed counter.

---

## VI. Security Requirements

**Pattern references:**
- `security-principles` — least privilege; server-side authorization on every protected op; never trust client role checks; minimize PII.
- `firebase-security` — custom claims for role; Firestore rules with `isOwner()`/`isAdmin()` helpers; Admin SDK is the only writer of `role`; rate-limit counters in Firestore writable only by Functions.
- Constitution §III.2 — input validation at all boundaries; rules tested in emulator before deploy; App Check enabled (new, as part of Phase 2).

**Concrete requirements:**
1. **Token as source of truth in rules**: `request.auth.token.role in ['owner','admin','user']`. No `get()` lookups in the fast path.
2. **Callable entry check**: every callable validates `context.auth && context.auth.token.role === 'owner'` before doing anything. No role is ever inferred from `data`.
3. **Zod input validation**: `setUserRole` validates `{ targetUid: string, role: 'owner'|'admin'|'user' }`; anything else → `invalid-argument`.
4. **Atomic role update**: Admin SDK `setCustomUserClaims` + Firestore transaction on `users/{uid}` + audit write. If any step fails, callable returns error and client retries.
5. **Last-owner protection**: count of `owner` claims/docs computed inside transaction; refuse demotion if count would drop to 0.
6. **Rate limit**: `rateLimits/setUserRole_{actorUid}` doc with sliding-window counter; writable only by callable, readable only by owner.
7. **Audit**: append-only collection, rules deny all client writes. Owner-readable only.
8. **App Check**: enable at project level; enforce on the `setUserRole` callable (via `context.app`).
9. **PII minimization**: admin user list omits preferences and future sensitive fields. Admin UI never surfaces raw Firebase UID beyond what's needed for the role dropdown `targetUid`.
10. **Service-account key hygiene**: bootstrap key stored outside the repo (or gitignored in a `.secrets/` dir); never checked in; revocation runbook in `bootstrap.md`.

---

## VII. Firebase Implementation

**Pattern references:**
- `firebase-best-practices` — users data modeling; Cloud Functions organized by feature; callable pattern with `HttpsError`.
- `firebase-security` — rules helpers, custom claims, App Check.
- `firebase-testing` — emulator + `@firebase/rules-unit-testing` with mocked claims in `authenticatedContext`.
- `firebase-cost-resilience` — rate limit counters, quota-aware write patterns.

**Artifacts:**

*`firestore.rules` (sketch — final version belongs in plan/implement phases):*
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isSignedIn()  { return request.auth != null; }
    function roleOf()      { return request.auth.token.role; }
    function isOwner()     { return isSignedIn() && roleOf() == 'owner'; }
    function isAdmin()     { return isSignedIn() && roleOf() == 'admin'; }
    function isOwnerOrAdmin() { return isOwner() || isAdmin(); }
    function isSelf(uid)   { return isSignedIn() && request.auth.uid == uid; }

    match /users/{uid} {
      allow read: if isSelf(uid) || isOwnerOrAdmin();
      // role field never writable from client
      allow create: if isSelf(uid) && !('role' in request.resource.data);
      allow update: if isSelf(uid)
                    && request.resource.data.role == resource.data.role;
      allow delete: if false;
    }

    match /content/{id} {
      allow read:   if isSignedIn();
      allow write:  if isOwnerOrAdmin();
    }

    match /audit/{id} {
      allow read:   if isOwner();
      allow write:  if false; // Admin SDK only
    }

    match /rateLimits/{action}/actors/{uid} {
      allow read:  if isOwner();
      allow write: if false; // Admin SDK only
    }
  }
}
```

*`functions/src/setUserRole.ts` (shape):*
```ts
export const setUserRole = onCall({ enforceAppCheck: true }, async (req) => {
  if (!req.auth || req.auth.token.role !== 'owner') {
    throw new HttpsError('permission-denied', 'owner only');
  }
  const { targetUid, role } = setUserRoleInput.parse(req.data); // zod
  await checkRateLimit(req.auth.uid);                           // 20/hr
  await db.runTransaction(async (tx) => {
    await assertNotLastOwner(tx, targetUid, role);
    await getAuth().setCustomUserClaims(targetUid, { role });
    tx.update(userDoc(targetUid), { role, roleChangedAt: FieldValue.serverTimestamp() });
    tx.create(auditDoc(), { actorUid: req.auth.uid, targetUid, toRole: role, at: FieldValue.serverTimestamp() });
  });
  return { ok: true };
});
```

*`functions/src/onUserCreate.ts` (shape):*
```ts
export const onUserCreate = beforeUserCreated(async (event) => {
  // Or use auth.user().onCreate — choose in plan phase.
  const uid = event.data.uid;
  await getAuth().setCustomUserClaims(uid, { role: 'user' });
  await db.doc(`users/${uid}`).set({
    uid, email: event.data.email ?? null, displayName: event.data.displayName ?? null,
    photoURL: event.data.photoURL ?? null, role: 'user',
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    preferences: { theme: 'system', emailNotifications: false },
  });
});
```

**firebase.json additions:**
- `firestore.rules`, `firestore.indexes.json`
- `functions` block with `source: "functions"`, Node 20 runtime, TypeScript
- `emulators` block: `auth` (9099), `firestore` (8080), `functions` (5001), `ui` (4000)

**Firestore indexes:** v1 likely needs only a single composite on `users` ordering `(role asc, createdAt desc)` for the admin list; defer until the query plan confirms it.

---

## VIII. Testing Requirements

Per constitution §III.1, auth/authorization is critical path → **100% coverage required**.

**Unit tests:**
- `tests/rules/users.test.ts` — {owner, admin, user, anon} × {read self, read other, create, update non-role, update role (must deny all), delete}.
- `tests/rules/content.test.ts` — read all signed-in, write only admin+owner.
- `tests/rules/audit.test.ts` — read only owner, no client writes.
- `tests/functions/setUserRole.test.ts` — permission denied for non-owner, success for owner, invalid role rejected, last-owner-demotion rejected, rate limit enforced, claim+doc consistent, audit entry written, App Check enforced.
- `tests/functions/onUserCreate.test.ts` — user doc created with defaults, `user` claim set.

**Integration / E2E (manual, per constitution §III.1 Phase 1):**
- Emulator E2E: full user-story walkthrough per plan §Verification.
- Firebase preview channel: same walkthrough against real Firebase before merging.

**Security-specific checks:**
- Fuzz: `setUserRole` with malformed `data` — zod rejects.
- Replay: verify a refreshed token after a role change reflects the new role.
- Abuse: verify rate limit enforces (simulate 21 calls in an hour).

---

## IX. References

**Constitutional citations:**
- §II.1 (Security Phase 2 trigger)
- §III.1 (critical-path coverage)
- §III.2 (security standards)
- §III.3 (performance / quota)
- §IV.1, §IV.2 (tech stack, forbidden patterns)
- §V.1 (feature workflow, PR requirements)
- §V.2 (evolution process — Phase 1→2 for Security)
- §VI.1 (cost / tier — correction needed: Spark→Blaze)

**Global skills (replaced `.prompts/core/*` and `.prompts/platforms/*`):**
- `firebase-security` (custom claims, rules, App Check)
- `firebase-best-practices` (data modeling, callables)
- `firebase-testing` (rules-unit-testing, emulator)
- `firebase-cost-resilience` (rate limiting, quota awareness)
- `firebase-monitoring` (audit/observability patterns)
- `security-principles` (least privilege, server-side auth)
- `software-architecture` (layering, SRP, dependency direction)
- `testing-principles` (pyramid, critical-path coverage)
- `asset-reusability` (repository factory reuse)
- `git-conventions` (branch/commit/PR conventions)

**Project artifacts:**
- [Plan](/Users/ted/.claude/plans/this-website-is-a-functional-badger.md) — approved implementation plan (source of truth for scope)
- [.prompts/meta/architectural-decision-log.md](/Users/ted/Developer/salmoncow/.prompts/meta/architectural-decision-log.md) — will receive a Phase 1→2 Security entry
- [.prompts/meta/architectural-evolution-strategy.md](/Users/ted/Developer/salmoncow/.prompts/meta/architectural-evolution-strategy.md) — Security phase triggers

**Out-of-scope (for traceability):**
- Non-Google federation (future spec)
- Fine-grained permissions, e.g., per-content-type admin (future spec)
- Account deletion / GDPR export (future spec)
- Real content schema beyond placeholder (future spec per content feature)

---

**Next step:** `/speckit-plan` to produce the technical implementation plan for this spec.

---

## X. Technical Implementation Plan

### X.1 Architecture

**Layering (per `software-architecture` skill + constitution §II.4)**

| Layer | New/changed artifacts |
|-------|----------------------|
| Presentation | `src/components/AdminPortal.js` (web component, paginated users table), `src/modules/admin-portal.js` (controller wiring the component to services) |
| Application | `src/modules/role.js` (reads `role` claim from ID token, exposes observable), `src/services/admin-user-service.js` (list users, invoke callable), `src/modules/auth.js` (extended: expose `role`, force refresh after role change) |
| Infrastructure | `src/repositories/firestore-user-profile-repository.js`, `src/infrastructure/firestore.js` (lazy-init Firestore client), `src/infrastructure/functions.js` (lazy-init `getFunctions`/`httpsCallable`) |
| Server | `functions/src/index.ts`, `functions/src/setUserRole.ts`, `functions/src/onUserCreate.ts`, `functions/src/lib/{validate,rateLimit,lastOwnerGuard}.ts` |
| Config | `firestore.rules`, `firestore.indexes.json`, `firebase.json` (+ `firestore`, `functions`, `emulators`), `.firebaserc` verified |
| Scripts | `scripts/bootstrap-owner.ts`, `.secrets/.gitkeep` + `.gitignore` entry for `.secrets/` |
| Docs/meta | `.specs/features/001-multi-user-rbac/bootstrap.md`, constitution §VI.1 + §II.1 edits, decision-log entry |

**Dependency direction**: Presentation → Application → Infrastructure → Firebase SDK. Never reverse. The existing `createRepositoryFactory()` pattern at [src/factories/repository-factory.js:74-76](src/factories/repository-factory.js) already anticipates a Firestore backend (TODO + `throw`); this plan slots into that extension point rather than refactoring it.

**Module budget**: each new module targeted at ≤300 lines (well under §II.3 500-line limit). `AdminPortal.js` web component expected ~250 lines; `admin-user-service.js` ~120; `role.js` ~80.

### X.2 Data Layer

**Collections** (per `firebase-best-practices`):

```
users/{uid}        — source of truth for the admin list
  { uid, email, displayName, photoURL, createdAt, updatedAt,
    lastSignInAt, role, preferences: { theme, emailNotifications },
    roleChangedAt }       ← bump forces target client token refresh

content/{id}       — placeholder; real schema comes with the content feature
  { title, body, authorUid, createdAt, updatedAt }

audit/{autoId}     — append-only role-change log
  { actorUid, targetUid, fromRole, toRole, at }

rateLimits/setUserRole/actors/{actorUid}
  { windowStart, count }  — sliding 1-hour window; 20 calls max
```

**Query patterns (constitution §IV.2, §VI.2):**
- Admin user list: `query(collection('users'), orderBy('createdAt', 'desc'), limit(20), startAfter(cursor))`. Never unbounded.
- Role field client reads: none — client reads the claim from the ID token (zero Firestore cost).
- Real-time: single `onSnapshot` on `users/{myUid}` (for self-profile + `roleChangedAt` detection), cleaned up in `AuthModule` teardown per §IV.2.

**Indexes**: v1 ships with an empty `firestore.indexes.json`; the single ordered `users` query by `createdAt desc` works on the default index. Add composite only if a new query demands one.

### X.3 UI Components

**Constitution phase: Vanilla Web Components (§II.1 UI).** No framework additions.

`<admin-portal>` (new web component — `src/components/AdminPortal.js`)
- Attributes: `role` (`owner` | `admin`). Default hides everything.
- Slots: none (self-contained).
- Renders: users table (displayName / email / photoURL / createdAt / lastSignInAt / role), "Load more" button for cursor pagination.
- Role column: `<select>` dropdown rendered **only when `role === 'owner'`**. Options: `user`, `admin`, `owner`. Change → emits `role-change` custom event with `{ targetUid, toRole }`.
- States: `loading`, `empty`, `error` (per existing LoadingSpinner/StatusBadge patterns used elsewhere).
- Events emitted: `role-change`, `page-request`.

**Navigation update**: `src/modules/navigation.js` gets a new "Admin" link, rendered only when `role.js` reports `owner` or `admin`. Driven by the observable on role state — no polling.

**New view element**: `<div id="adminView" style="display:none">` in `index.html`, populated by `admin-portal.js` controller on route match (follows existing `profileView` pattern in [main.js:109-131](src/main.js)).

### X.4 Security Implementation

Covers AC-5, AC-6, AC-7, AC-8, AC-10, AC-14. Skills: `firebase-security`, `security-principles`.

**`firestore.rules` structure** (full sketch in §VII; final file lives at repo root):
- Helper fns `isSignedIn`, `roleOf`, `isOwner`, `isAdmin`, `isOwnerOrAdmin`, `isSelf(uid)`.
- `users/{uid}`:
  - `read`: `isSelf(uid) || isOwnerOrAdmin()`.
  - `create`: `isSelf(uid) && !('role' in request.resource.data)` — Function trigger seeds role server-side; client create would only run if trigger didn't fire, and even then must not set role.
  - `update`: `isSelf(uid) && request.resource.data.role == resource.data.role` — role field immutable from client.
  - `delete`: `false`.
- `content/{id}`: read `isSignedIn()`, write `isOwnerOrAdmin()`.
- `audit/{id}`: read `isOwner()`, write `false` (Admin SDK only).
- `rateLimits/**`: read `isOwner()`, write `false`.

**Callable `setUserRole` (defense in depth)**
1. App Check enforced: `onCall({ enforceAppCheck: true })`.
2. Auth check: reject if `!context.auth || context.auth.token.role !== 'owner'` → `permission-denied`.
3. Input validation (zod): `{ targetUid: z.string().min(1), role: z.enum(['owner','admin','user']) }` → `invalid-argument` on failure.
4. Rate limit check (`lib/rateLimit.ts`): reads `rateLimits/setUserRole/actors/{actorUid}`; if count ≥20 in the last hour, reject with `resource-exhausted`.
5. Last-owner guard (`lib/lastOwnerGuard.ts`): inside transaction, if target is currently `owner` AND target === the only owner AND new role ≠ `owner`, reject with `failed-precondition`.
6. Atomic mutation in a Firestore transaction:
   - `admin.auth().setCustomUserClaims(targetUid, { role })` (outside TX; see note below)
   - `tx.update(users/{targetUid}, { role, updatedAt, roleChangedAt: serverTimestamp() })`
   - `tx.create(audit/{auto}, { actorUid, targetUid, fromRole, toRole: role, at })`
   - Bump rate-limit counter.

   *Note: `setCustomUserClaims` is a separate Auth API, not part of the Firestore transaction. The implementation calls it first; if it succeeds and the TX later fails, we roll forward by re-attempting the TX from the known-good claim (idempotent). `audit` captures the actual sequence.*

**`onUserCreate` auth trigger**
- Uses the v2 auth trigger (`beforeUserCreated` if project-ID-compatible, else `onCreate`). Creates the `users/{uid}` doc with defaults and sets the `role: 'user'` custom claim.
- Defensive: if a `users/{uid}` doc already exists (re-sign-in edge case, rare), skip.

**Bootstrap hygiene (AC-14)**
- Add `.secrets/` to `.gitignore`. Create `scripts/bootstrap-owner.ts` reading key path from `FIREBASE_SA_KEY` env var. Script prints "done" + the affected uid and exits. Runbook documents: download key from IAM, run script, delete key immediately, rotate if leaked.

**App Check enablement**
- Enable App Check in the Firebase console with reCAPTCHA Enterprise (web). Wire `initializeAppCheck` in `src/infrastructure/appcheck.js` and invoke from `main.js` after `initializeApp`. Enforce on `setUserRole` via `enforceAppCheck: true`.

### X.5 Testing Strategy

Covers AC-11, AC-12, AC-13. Critical path → 100% coverage per constitution §III.1.

**Unit (new in this feature; runs in CI when tests are wired):**
- `tests/rules/users.test.ts` — matrix {owner, admin, user, anon} × operations on self + other. ~28 test cases.
- `tests/rules/content.test.ts` — read any signed-in allowed; write only admin+owner. ~8 cases.
- `tests/rules/audit.test.ts` — only owner reads; no client writes from any role. ~4 cases.
- `tests/rules/rateLimits.test.ts` — only owner reads; no client writes. ~4 cases.
- `tests/functions/setUserRole.test.ts` — permission-denied for non-owner; invalid role rejected; last-owner-demotion blocked; rate-limit enforced; claim+doc consistent after success; audit entry written; App Check enforced. ~10 cases.
- `tests/functions/onUserCreate.test.ts` — doc created with defaults; `user` claim set; idempotent on duplicate invocation. ~3 cases.

**Tooling**
- Add dev deps at repo root: `@firebase/rules-unit-testing`, `vitest`, `@types/node` (already present via TS). Scripts: `test:rules`, `test:functions`, `test`.
- Add dev deps in `functions/`: `firebase-functions-test`, `vitest`, `zod`.
- `firebase emulators:exec --only auth,firestore,functions 'vitest run'` for the full matrix.

**Manual (Phase 1 testing per §III.1; gating pre-merge):**
- Emulator E2E per plan §Verification (steps 4a–g).
- Preview-channel E2E after CI green.

**CI wiring**
- Add `.github/workflows/test.yml` running `npm ci && npm run test` in matrix for both root and `functions/`. Gate merges to `main`.

### X.6 Performance / Cost

Per `firebase-cost-resilience` skill + constitution §III.3, §VI.1/VI.2.

**Quota budgeting (per typical session):**
- Sign-in: 0 reads/writes (client reads ID token, listener created lazily).
- First sign-in ever: 2 writes (`users/{uid}` doc + claim set by trigger).
- Open Admin Portal: 1 query (20 user docs = 20 reads) + 1 doc read (self).
- Role change: 1 claim set + 1 `users` write + 1 `audit` write + 1 rate-limit write = 4 writes; 1–2 reads for last-owner + rate-limit check.
- Background self-listener: 1 read on change (`roleChangedAt` bump).

**Daily ceiling (worst-case owner usage):** 20 role changes/hr × 24 hr = 480 calls → 1,920 writes + ~1,000 reads → **<5% of free tier** (even though we're on Blaze, we preserve Spark headroom per §VI.1 philosophy).

**Optimizations applied:**
- Role read via token claim (zero-cost) — not `get()` in rules.
- Pagination with `limit(20)` + cursor.
- `onSnapshot` only on self doc; unsubscribed on sign-out.
- No client-side filtering.
- Callable responses are small (`{ ok: true }`); no over-fetching.

**Bundle impact:**
- Adds Firebase Firestore + Functions SDKs via CDN (same v10.13.2 line). Cached at CDN. Expected uncompressed delta: ~60KB Firestore + ~20KB Functions — acceptable for admin route, which lazy-loads the chunk.
- `AdminPortal.js` + `admin-portal.js` + `role.js`: ~10KB combined.

### X.7 Implementation Sequencing

Ordered to minimize risk and keep `main` shippable at each step. Each numbered block is a prospective commit.

1. **Branch + scaffolding**
   - `git checkout -b feat/multi-user-rbac` (per `git-conventions`).
   - Add `functions/` dir (package.json, tsconfig, src/index.ts stub).
   - Add `firestore.rules` (deny-all placeholder), `firestore.indexes.json` (empty `{"indexes":[],"fieldOverrides":[]}`).
   - Extend `firebase.json` with `firestore`, `functions`, `emulators` blocks.
   - Add `.secrets/` to `.gitignore`.
2. **Rules (deny-all → role-aware) + tests**
   - Write real rules per §X.4.
   - Add `tests/rules/*` with the full matrix (AC-11).
   - Green tests locally via `firebase emulators:exec`.
3. **Functions + tests**
   - Implement `onUserCreate`, `setUserRole`, validation, rate limit, last-owner guard.
   - Add `tests/functions/*` (AC-12).
   - Green tests locally.
4. **Bootstrap script + runbook**
   - `scripts/bootstrap-owner.ts` + `.specs/features/001-multi-user-rbac/bootstrap.md` (AC-18).
5. **Client infra + role module**
   - `src/infrastructure/firestore.js`, `functions.js`, `appcheck.js`.
   - `src/repositories/firestore-user-profile-repository.js`.
   - Extend [src/factories/repository-factory.js:74-76](src/factories/repository-factory.js): replace `throw` with real constructor; flip `DEFAULT_CONFIG.userProfileBackend` to `'firestore'`.
   - `src/modules/role.js` (token claim reader + observable).
6. **Auth + router integration**
   - Extend [src/modules/auth.js](src/modules/auth.js): expose `role` after `getIdTokenResult(true)` on sign-in and on `users/{uid}.roleChangedAt` bumps; re-fetch on demand.
   - Extend [src/modules/router.js](src/modules/router.js) + [src/main.js:87-103](src/main.js): `/admin` route with guard (`role in {owner, admin}`).
7. **Admin Portal UI**
   - `src/components/AdminPortal.js` + `src/modules/admin-portal.js` + `src/services/admin-user-service.js`.
   - Navigation link visibility wired to `role.js`.
   - Add `adminView` element in `index.html`.
8. **Emulator E2E** (manual walkthrough per plan §Verification steps 4a–g).
9. **Docs + phase transition**
   - Constitution §VI.1 Spark→Blaze correction (AC-19 part 1). Bump to v1.0.3.
   - Constitution §II.1 Security Phase 1→2 (AC-19 part 2).
   - `.prompts/meta/architectural-decision-log.md` new entry: "2026-04-18 Adopt Blaze + RBAC, enter Security Phase 2" with triggers met / decision / consequences.
10. **Preview deploy + E2E**
    - `npm run deploy:preview` (hosting) + `firebase deploy --only firestore:rules,functions --project salmoncow` (functions via Blaze).
    - Repeat E2E walkthrough on preview channel.
11. **PR** (per `git-conventions`)
    - Branch: `feat/multi-user-rbac`. Title: `feat: introduce three-role RBAC (owner/admin/user)`.
    - Body: Summary, Changes, Testing, Guidance References (§V.1 mandate), Constitutional compliance citations.

### X.8 Files to Create / Modify

**New**
- `firestore.rules`
- `firestore.indexes.json`
- `functions/package.json`, `functions/tsconfig.json`
- `functions/src/index.ts`
- `functions/src/setUserRole.ts`
- `functions/src/onUserCreate.ts`
- `functions/src/lib/validate.ts`
- `functions/src/lib/rateLimit.ts`
- `functions/src/lib/lastOwnerGuard.ts`
- `scripts/bootstrap-owner.ts`
- `src/infrastructure/firestore.js`
- `src/infrastructure/functions.js`
- `src/infrastructure/appcheck.js`
- `src/repositories/firestore-user-profile-repository.js`
- `src/modules/role.js`
- `src/modules/admin-portal.js`
- `src/services/admin-user-service.js`
- `src/components/AdminPortal.js`
- `tests/rules/users.test.ts`
- `tests/rules/content.test.ts`
- `tests/rules/audit.test.ts`
- `tests/rules/rateLimits.test.ts`
- `tests/functions/setUserRole.test.ts`
- `tests/functions/onUserCreate.test.ts`
- `.specs/features/001-multi-user-rbac/bootstrap.md`

**Modified**
- `firebase.json` — add `firestore`, `functions`, `emulators` blocks
- `.firebaserc` — verify project alias `salmoncow`
- `.gitignore` — add `.secrets/`
- `package.json` — add `test:rules`, `test:functions`, `test`, `emulators` scripts; add dev deps
- `src/main.js` — wire `AdminPortalModule`, `/admin` route + guard, App Check init
- `src/modules/auth.js` — expose role from token, refresh on `roleChangedAt` listener
- `src/modules/router.js` — existing hook is sufficient; add `/admin` registration in `main.js`
- `src/modules/navigation.js` — conditional Admin link
- `src/factories/repository-factory.js` — implement `firestore` case; flip default
- `src/firebase-config.js` — expose Firestore/Functions emulator-aware wiring
- `index.html` — add `adminView` element
- `.specs/constitution.md` — §II.1 Security row Phase 1→2; §VI.1 Spark→Blaze; bump version + last-updated
- `.prompts/meta/architectural-decision-log.md` — new Security Phase 2 entry

### X.9 Validation Checklist

- ✅ **Current phase respected**: Vanilla Web Components only (UI Phase 1); first Firestore usage is Simple Collections (Data Phase 1).
- ✅ **Phase transition justified and documented**: Security Phase 1→2 triggered by the feature's own purpose (custom claims + App Check); decision-log entry included (AC-19).
- ✅ **Approved patterns**: `firebase-security` (custom claims + rules + App Check), `firebase-best-practices` (callable shape, data modeling), `firebase-testing` (rules-unit-testing matrix), `firebase-cost-resilience` (rate limit counter), `security-principles` (least privilege, server authoritative), `software-architecture` (layering), `asset-reusability` (factory reuse), `git-conventions` (branch/commit/PR).
- ✅ **No forbidden patterns** (§IV.2): all reads use `limit()`, all listeners unsubscribed, no client-side filtering, no secrets in client, no direct main commits.
- ✅ **Quality standards** (§III): 100% coverage on critical-path rules + Function; inputs validated at boundaries; server-side authz on every protected op; perf-aware (token claim reads in rules).
- ✅ **Cost constraints** (§VI): worst-case <5% of Spark free-tier quotas even on Blaze; rate limit caps abuse.
- ✅ **Constitutional drift addressed**: §VI.1 Spark→Blaze correction (AC-19) is a required deliverable.

---

**Next step:** `/speckit-tasks` to break this plan into actionable, ordered tasks.
