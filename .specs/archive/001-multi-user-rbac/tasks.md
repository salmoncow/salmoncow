# Task Breakdown: Multi-User RBAC

**Feature**: 001-multi-user-rbac
**Spec**: [spec.md](./spec.md) (Sections I–X)
**Created**: 2026-04-18
**Status**: Ready for implementation

Each numbered group below maps to one phase in §X.7 of the spec and is a **prospective commit**. Commit only when all boxes in a group are checked and validation passes.

**Complexity legend**: S = <30min · M = 30min–2h · L = >2h
**AC refs**: acceptance criteria from §IV of the spec.

---

## Group 1 — Branch + Scaffolding

**Goal**: Empty-but-valid scaffold for Firestore + Functions; nothing deployable yet.
**Commit message**: `chore(rbac): scaffold functions/, firestore rules, and emulator config`

- [ ] **1.1 (S)** Create branch `feat/multi-user-rbac` from `main` (per `git-conventions`).
- [ ] **1.2 (S)** Add `.secrets/` to `.gitignore`.
- [ ] **1.3 (S)** Create `firestore.indexes.json` with `{"indexes":[],"fieldOverrides":[]}`.
- [ ] **1.4 (M)** Create `firestore.rules` with a deny-all placeholder (`allow read, write: if false;`) — no role logic yet, just so emulator can load it.
- [ ] **1.5 (M)** Create `functions/` package: `package.json` (firebase-functions v5+, firebase-admin v12+, zod, vitest, typescript), `tsconfig.json`, `src/index.ts` (empty export).
- [ ] **1.6 (M)** Extend `firebase.json` with `firestore` block (`rules`, `indexes`), `functions` block (`source: "functions"`, Node 20), and `emulators` block (`auth:9099`, `firestore:8080`, `functions:5001`, `ui:4000`).
- [ ] **1.7 (S)** Verify `.firebaserc` has project alias `salmoncow`.
- [ ] **1.8 (S)** `firebase emulators:start --only auth,firestore,functions` boots cleanly. *(Validation gate.)*

**Validation**: emulator starts without errors; deny-all rules load.

---

## Group 2 — Rules + Rules Tests

**Goal**: Role-aware Firestore rules proven by the full permission matrix before any Function exists.
**Commit message**: `feat(rbac): add role-aware Firestore rules with unit-test matrix`
**AC**: AC-10, AC-11, AC-13, AC-16

- [ ] **2.1 (S)** Add dev deps at repo root: `@firebase/rules-unit-testing`, `vitest`, `@types/node`.
- [ ] **2.2 (S)** Add root scripts: `test:rules`, `test:functions`, `test`, `emulators`.
- [ ] **2.3 (M)** Write `firestore.rules` per §X.4: helper fns (`isSignedIn`, `roleOf`, `isOwner`, `isAdmin`, `isOwnerOrAdmin`, `isSelf`) + matchers for `users`, `content`, `audit`, `rateLimits`.
- [ ] **2.4 (M)** Write `tests/rules/users.test.ts` — {owner, admin, user, anon} × {read self, read other, create self with/without role, update non-role, update role (all roles must be denied), delete}. ~28 cases.
- [ ] **2.5 (M)** Write `tests/rules/content.test.ts` — read by any signed-in; write only admin+owner. ~8 cases.
- [ ] **2.6 (S)** Write `tests/rules/audit.test.ts` — only owner reads; no client writes from any role. ~4 cases.
- [ ] **2.7 (S)** Write `tests/rules/rateLimits.test.ts` — only owner reads; no client writes. ~4 cases.
- [ ] **2.8 (S)** `firebase emulators:exec --only firestore 'vitest run tests/rules'` → all green. *(Validation gate.)*

**Validation**: 100% of critical-path rules matrix passes in emulator.

---

## Group 3 — Functions + Function Tests

**Goal**: `onUserCreate` + `setUserRole` callable fully implemented with defense-in-depth and 100% test coverage.
**Commit message**: `feat(rbac): add setUserRole callable and onUserCreate trigger`
**AC**: AC-1, AC-5, AC-6, AC-7, AC-8, AC-12

- [ ] **3.1 (M)** `functions/src/lib/validate.ts` — zod schema `setUserRoleInput = z.object({ targetUid: z.string().min(1), role: z.enum(['owner','admin','user']) })`.
- [ ] **3.2 (M)** `functions/src/lib/rateLimit.ts` — sliding 1-hour window check on `rateLimits/setUserRole/actors/{actorUid}`; throws `resource-exhausted` at 20. Function-only writer (Admin SDK).
- [ ] **3.3 (M)** `functions/src/lib/lastOwnerGuard.ts` — given a target uid and intended new role, count current owners inside a transaction; reject demotion that would leave zero owners with `failed-precondition`.
- [ ] **3.4 (L)** `functions/src/setUserRole.ts` — full callable per §X.4:
    - App Check enforced.
    - Non-owner → `permission-denied`.
    - zod validation → `invalid-argument`.
    - Rate-limit gate.
    - Last-owner guard (inside TX).
    - `setCustomUserClaims` → TX: update `users/{targetUid}` (role, `roleChangedAt`, `updatedAt`), create `audit/{auto}` doc, bump rate-limit counter.
    - Returns `{ ok: true, fromRole, toRole }`.
- [ ] **3.5 (M)** `functions/src/onUserCreate.ts` — auth trigger seeds `users/{uid}` with role `user`, preferences defaults, timestamps; idempotent if doc already exists; also sets `{ role: 'user' }` custom claim.
- [ ] **3.6 (S)** Export both from `functions/src/index.ts`.
- [ ] **3.7 (L)** `tests/functions/setUserRole.test.ts` — ~10 cases: no auth → denied, non-owner → denied, invalid role → rejected, last-owner demotion → rejected, 21st call in hour → rate-limited, success path updates claim + doc atomically, audit entry written with correct fields, App Check missing → denied.
- [ ] **3.8 (M)** `tests/functions/onUserCreate.test.ts` — ~3 cases: doc created with defaults, `user` claim set, second invocation is no-op.
- [ ] **3.9 (S)** `firebase emulators:exec --only auth,firestore,functions 'vitest run tests/functions'` → all green. *(Validation gate.)*

**Validation**: every branch in both Functions is exercised; claim + Firestore doc always in sync after `setUserRole`.

---

## Group 4 — Bootstrap Script + Runbook

**Goal**: Safe, documented, one-time path to grant the first `owner` claim.
**Commit message**: `feat(rbac): add owner-bootstrap script and runbook`
**AC**: AC-14, AC-18

- [ ] **4.1 (M)** `scripts/bootstrap-owner.ts` — reads service-account JSON path from `FIREBASE_SA_KEY` env var; target uid from `TARGET_UID` env var; calls `admin.auth().setCustomUserClaims(uid, { role: 'owner' })`; upserts `users/{uid}.role = 'owner'` if doc exists. Prints affected uid + timestamp and exits 0.
- [ ] **4.2 (S)** Add script invocation doc to root `package.json` (e.g., `"bootstrap:owner": "tsx scripts/bootstrap-owner.ts"`).
- [ ] **4.3 (M)** `.specs/features/001-multi-user-rbac/bootstrap.md` — step-by-step runbook: download SA key from IAM, place outside repo, set env vars, run, verify in Firebase console, delete key, rotate if leaked.
- [ ] **4.4 (S)** Confirm `.secrets/` gitignore entry still present; `git status` shows no key checked in. *(Validation gate.)*

**Validation**: key never appears in `git status`; runbook covers rotation.

---

## Group 5 — Client Infrastructure + Role Module

**Goal**: Firestore + Functions + App Check wired; role observable available; profile repo swapped to Firestore.
**Commit message**: `feat(rbac): wire Firestore, Functions, App Check, and role module on client`
**AC**: AC-14 (App Check), supports AC-2, AC-9

- [ ] **5.1 (M)** `src/infrastructure/firestore.js` — lazy `getFirestore`; emulator-aware via `VITE_USE_EMULATOR`.
- [ ] **5.2 (M)** `src/infrastructure/functions.js` — lazy `getFunctions` + `httpsCallable` helper; emulator-aware.
- [ ] **5.3 (M)** `src/infrastructure/appcheck.js` — `initializeAppCheck` with reCAPTCHA Enterprise site key from env; debug token path for dev.
- [ ] **5.4 (L)** `src/repositories/firestore-user-profile-repository.js` — implements the `UserProfileRepository` interface: `findById`, `save`, `update` (guarded: never writes `role`), `delete` (throws — server-only), `exists`, plus `listPaginated({ pageSize, cursor })` for admin use.
- [ ] **5.5 (M)** Modify `src/factories/repository-factory.js:74-76` — replace `throw` with `new FirestoreUserProfileRepository()`; flip `DEFAULT_CONFIG.userProfileBackend` from `'localStorage'` to `'firestore'`.
- [ ] **5.6 (M)** `src/modules/role.js` — reads `getIdTokenResult().claims.role`, exposes `getRole()`, `onRoleChange(cb)` observable; triggers refresh via `getIdToken(true)` when called with `force=true`.
- [ ] **5.7 (S)** Modify `src/firebase-config.js` — expose Firestore/Functions emulator flags if not already.
- [ ] **5.8 (S)** Manual smoke: sign in, verify `users/{uid}` doc appears in emulator, verify `role.js` reports `'user'`. *(Validation gate.)*

**Validation**: new sign-in creates a Firestore user doc; role module returns `'user'` for fresh accounts.

---

## Group 6 — Auth + Router Integration

**Goal**: `/admin` route exists with role guard; auth forces token refresh on `roleChangedAt` bumps.
**Commit message**: `feat(rbac): add /admin route with role guard and token-refresh on role change`
**AC**: AC-2, AC-9

- [ ] **6.1 (M)** Extend [src/modules/auth.js](src/modules/auth.js): after sign-in, call `getIdTokenResult()`, cache role on `AuthModule`, emit via `onRoleChanged` callback; add `refreshTokenAndRole()` helper.
- [ ] **6.2 (M)** In `AuthModule`, open an `onSnapshot` listener on `users/{currentUid}`; when `roleChangedAt` changes, call `refreshTokenAndRole()`. Clean up listener on sign-out.
- [ ] **6.3 (M)** Modify [src/main.js:87-103](src/main.js) `setupRoutes`: register `/admin`; extend the existing `onBeforeNavigate` guard — if `newPath === '/admin'` and `role.js` reports not `owner`/`admin`, `navigate('/')` and return `false`.
- [ ] **6.4 (S)** Add `showAdmin()` view-toggle alongside `showHome`/`showProfile` + corresponding `<div id="adminView">` in `index.html`.
- [ ] **6.5 (S)** Manual smoke: deep-link to `/#/admin` as `user` → redirects to `/`. *(Validation gate.)*

**Validation**: route guard rejects non-admins; role observable fires on claim change.

---

## Group 7 — Admin Portal UI

**Goal**: Functional `<admin-portal>` web component with paginated user list and owner-only role dropdown.
**Commit message**: `feat(rbac): add Admin Portal web component with paginated user list`
**AC**: AC-3, AC-4, AC-9 (target refresh), AC-15

- [ ] **7.1 (L)** `src/components/AdminPortal.js` — Web Component per §X.3: `role` attribute, users table, `<select>` dropdown visible only when `role === 'owner'`, emits `role-change` and `page-request` events, loading/empty/error states using existing `LoadingSpinner` + `StatusBadge` patterns.
- [ ] **7.2 (M)** `src/services/admin-user-service.js` — `listUsers({ pageSize: 20, cursor })` calls `FirestoreUserProfileRepository.listPaginated`; `setUserRole({ targetUid, role })` calls the callable; strips fields to the limited set (displayName, email, photoURL, createdAt, lastSignInAt, role) before returning to the component.
- [ ] **7.3 (M)** `src/modules/admin-portal.js` — controller wiring the component to the service, handling `role-change` and `page-request` events, showing toast feedback on success/error.
- [ ] **7.4 (M)** Modify `src/modules/navigation.js` — add an "Admin" link that renders only when `role.js` reports `owner`/`admin`; subscribe to `onRoleChange` for live toggle.
- [ ] **7.5 (S)** Register `<admin-portal>` in `src/main.js` imports; instantiate `AdminPortalModule` and wire to `#adminView`.
- [ ] **7.6 (S)** Manual smoke: sign in as bootstrapped owner, open `/admin`, see user list with dropdown. *(Validation gate.)*

**Validation**: owner sees and can interact with the dropdown; admin sees list but no dropdown; user can't reach the page.

---

## Group 8 — Emulator End-to-End Walkthrough

**Goal**: Full story flow validated against the emulator before any real Firebase deploy.
**Commit message**: *(no commit — verification only; fixes discovered here fold into the appropriate prior group via `git commit --fixup`)*
**AC**: AC-1 through AC-10, AC-15

- [ ] **8.1 (S)** Spin up emulators + dev server.
- [ ] **8.2 (S)** Sign in as **User A** (emulator Google stub) → confirm `users/{uidA}` created with `role: 'user'` and corresponding claim (AC-1).
- [ ] **8.3 (S)** Run `bootstrap:owner` against `uidA` → next token refresh shows Admin Portal (AC-2, AC-4).
- [ ] **8.4 (S)** Sign in as **User B** in a separate browser profile → confirm `role: 'user'`, no Admin Portal.
- [ ] **8.5 (M)** As A, promote B to `admin` → verify audit entry (actorUid=A, targetUid=B, fromRole=user, toRole=admin), verify B's next token refresh reveals a read-only Admin Portal (AC-3, AC-5, AC-9).
- [ ] **8.6 (S)** As B, open devtools → call `setUserRole` directly via `httpsCallable` → returns `permission-denied` (AC-5).
- [ ] **8.7 (S)** As A, call `setUserRole` with an invalid role → `invalid-argument` (AC-6).
- [ ] **8.8 (S)** Attempt to demote yourself (the only owner) to `user` → `failed-precondition` (AC-7).
- [ ] **8.9 (M)** Simulate 21 `setUserRole` calls inside an hour → 21st returns `resource-exhausted` (AC-8).
- [ ] **8.10 (S)** Attempt to write `users/{uidB}.role` directly via client → rules deny (AC-10).
- [ ] **8.11 (S)** Demote B to `user` → verify Admin Portal disappears on next token refresh.

**Validation**: every happy + every failure branch behaves per spec.

---

## Group 9 — Docs + Phase Transition

**Goal**: Constitution corrected, phase transition recorded.
**Commit message**: `docs(rbac): advance Security to Phase 2 and correct Firebase plan tier to Blaze`
**AC**: AC-19

- [ ] **9.1 (S)** Constitution §VI.1: replace "Spark Plan Quotas (verified 2025-12-11)" section with Blaze equivalents; rewrite "Hard Constraints" to remove Spark-only language; keep cost discipline language.
- [ ] **9.2 (S)** Constitution §II.1: change Security row from "Phase 1: Basic Auth + Rules" to "Phase 2: App Check + Custom Claims"; update "Last Architecture Review" date to 2026-04-18.
- [ ] **9.3 (S)** Constitution §II.1 Cost row: update to reflect Blaze.
- [ ] **9.4 (S)** Constitution version bump: 1.0.2 → 1.1.0 (major change, new phase adopted) or 1.0.3 (if treated as minor correction). Default to **1.1.0** per §VIII.2 Amendment Process (new standards = minor).
- [ ] **9.5 (M)** Append entry to `.prompts/meta/architectural-decision-log.md`:
    - Date: 2026-04-18
    - Title: "Adopt Blaze + RBAC, enter Security Phase 2"
    - Triggers met: production launch pre-requisite work; App Check + custom claims patterns mature; feature spec 001-multi-user-rbac approved.
    - Decision: adopt Phase 2 for Security domain; other domains unchanged.
    - Consequences: Cloud Functions deployable; rules tested in CI; App Check required for privileged callables.
- [ ] **9.6 (S)** `git diff .specs/constitution.md` review for accidental edits. *(Validation gate.)*

**Validation**: constitution accurately reflects new state; decision log cites the RBAC feature.

---

## Group 10 — Preview Deploy + E2E on Real Firebase

**Goal**: Same walkthrough against real Firebase before merge.
**Commit message**: *(no commit — verification)*
**AC**: AC-13 (rules tested before deploy), AC-17

- [ ] **10.1 (S)** `firebase deploy --only firestore:rules --project salmoncow` with `--dry-run` first.
- [ ] **10.2 (M)** `firebase deploy --only firestore:rules,firestore:indexes,functions --project salmoncow` (real).
- [ ] **10.3 (S)** `npm run deploy:preview` (hosting preview channel).
- [ ] **10.4 (M)** Re-run Group 8 walkthrough on preview URL with real Google sign-in; confirm audit entries appear in prod Firestore.
- [ ] **10.5 (S)** Check Firebase console Usage tab post-walkthrough; confirm Firestore read/write deltas are within §VI.2 expectations (<5% of daily quotas).
- [ ] **10.6 (S)** If anything fails, create `git commit --fixup` against the appropriate earlier commit and re-test.

**Validation**: preview channel behaves identically to emulator; no quota spikes.

---

## Group 11 — Pull Request

**Goal**: PR opened per `git-conventions`; awaiting review + merge to `main`.
**AC**: AC-20

- [ ] **11.1 (S)** Rebase / autosquash fixups: `git rebase -i --autosquash main`.
- [ ] **11.2 (S)** Push branch: `git push -u origin feat/multi-user-rbac`.
- [ ] **11.3 (M)** `gh pr create` with:
    - **Title**: `feat: introduce three-role RBAC (owner/admin/user)`
    - **Body sections** (per constitution §V.1):
        - **Summary** — 2–3 bullets.
        - **Changes** — grouped list referencing each Group 1–9 commit.
        - **Testing** — checklist covering rules tests, function tests, emulator E2E, preview-channel E2E.
        - **Guidance references** — cite spec sections, skills used (`firebase-security`, `firebase-best-practices`, `firebase-testing`, `firebase-cost-resilience`, `security-principles`, `software-architecture`, `git-conventions`), constitution sections (§II.1, §III.1, §III.2, §III.3, §IV.2, §V.1, §V.2, §VI.1).
        - **Constitutional compliance** — explicit callouts for server-side authz, 100% critical-path coverage, no forbidden patterns, Security Phase 1→2 transition documented.
- [ ] **11.4 (S)** Verify CI green on the PR; address review comments with new commits (no force-push to the PR branch unless requested).

**Validation**: PR merges cleanly; `main` ships with RBAC active.

---

## AC → Task Map (traceability)

| AC | Covered in tasks |
|----|------------------|
| AC-1 | 3.5, 3.8, 8.2 |
| AC-2 | 6.3, 6.5, 8.3 |
| AC-3 | 7.1, 7.2, 8.5 |
| AC-4 | 7.1, 8.3, 8.5 |
| AC-5 | 3.4, 3.7, 8.5, 8.6 |
| AC-6 | 3.1, 3.4, 3.7, 8.7 |
| AC-7 | 3.3, 3.4, 3.7, 8.8 |
| AC-8 | 3.2, 3.4, 3.7, 8.9 |
| AC-9 | 6.1, 6.2, 7.1, 8.5, 8.11 |
| AC-10 | 2.3, 2.4, 5.4, 8.10 |
| AC-11 | 2.3, 2.4, 2.5, 2.6, 2.7, 2.8 |
| AC-12 | 3.7, 3.8, 3.9 |
| AC-13 | 2.8, 3.9, 10.1, 10.2 |
| AC-14 | 4.1, 4.3, 4.4, 5.3 |
| AC-15 | 5.4, 7.1, 7.2 |
| AC-16 | 2.3 |
| AC-17 | 3.2, 10.5 |
| AC-18 | 4.3 |
| AC-19 | 9.1, 9.2, 9.3, 9.4, 9.5 |
| AC-20 | 11.3 |

All 20 ACs covered across the 11 commit groups.

---

**Next step**: `/speckit-implement` to execute Groups 1–11 in order.
