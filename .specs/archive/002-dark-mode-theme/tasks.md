# Task Breakdown: Dark Mode Theme

> **Archived.** This is the historical record of a shipped feature, kept as-is.
> Some links point at `.prompts/core/**` and `.prompts/platforms/**`, which no
> longer exist — foundational guidance moved to the global skills described in
> [CLAUDE.md](../../../CLAUDE.md). The paths are left unedited so the document
> still reflects what was actually referenced at the time.

**Feature**: 002-dark-mode-theme
**Spec**: [spec.md](./spec.md) (Sections I–XI)
**Created**: 2026-04-22
**Status**: Shipped 2026-04-22 (PR #41) — archived, historical record

Each numbered group below maps to one logical phase in §XI.8 of the spec and is a **prospective commit**. Commit only when all boxes in a group are checked and the group's validation gate passes.

**Complexity legend**: S = <30min · M = 30min–2h · L = >2h
**AC refs**: acceptance criteria from §IV of the spec.

**Sequencing rule**: Groups 1 and 2 are **invisible refactors** (no runtime behaviour change because nothing sets `<html data-theme>` yet). Group 3 is the first commit that *activates* dark mode. This ordering means any revert up through Group 2 is zero-risk to light-mode users.

---

## Group 1 — CSS Token Foundation

**Goal**: Semantic surface tokens at `:root` plus `[data-theme="dark"]` override block live in `main.css`; `navigation.css` tokens remapped onto the shared set. Zero runtime behaviour change — light mode renders pixel-identically because nothing sets the theme attribute yet.
**Commit message**: `feat(theme): add :root semantic tokens and dark override layer`
**AC**: AC-1 (groundwork only)

- [ ] **1.1 (S)** Create branch `feat/dark-mode-theme` from `main` (per `git-conventions`).
- [ ] **1.2 (M)** Extend [src/styles/main.css](../../../src/styles/main.css): add the semantic token block per §XI.3 (`--surface-bg`, `--surface-elevated`, `--surface-border`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--focus-ring`, `--shadow-card`, `--error-fg`, `--toggle-track`) inside `:root`, and the matching `[data-theme="dark"] { ... }` block. Include `color-scheme: light dark;` on the dark block for native control adaptation.
- [ ] **1.3 (S)** Update the existing `body { background: #f3f4f6 }` in `main.css` to `var(--surface-bg)`. (Sole token use in this group — everything else happens in Group 2.)
- [ ] **1.4 (M)** Remap [src/assets/styles/navigation.css:22](../../../src/assets/styles/navigation.css) dropdown tokens onto the shared semantic set per §XI.3 migration table: `--dropdown-bg → var(--surface-elevated)`, `--dropdown-border → var(--surface-border)`, `--dropdown-text → var(--text-primary)`, `--dropdown-text-secondary → var(--text-secondary)`, `--dropdown-hover-bg → var(--surface-bg)`. The nav bar background itself stays `--brand-primary` (brand, not surface) in both themes.
- [ ] **1.5 (S)** `npm run build` completes without errors. Visual diff: `npm run dev:app` and eyeball every page — must look identical to `main`. *(Validation gate.)*

**Validation**: Zero visual regression in light mode; build clean.

---

## Group 2 — Component Style Sweeps

**Goal**: Migrate hardcoded colours in the six Web Components' `addStyles()` methods to the shared tokens. Still no runtime behaviour change — only substitutions that map 1:1 to current light-mode values.
**Commit message**: `refactor(components): use surface tokens in component styles for theme support`
**AC**: AC-1 (full surface coverage)

- [ ] **2.1 (M)** [src/components/UserPortal.js:242](../../../src/components/UserPortal.js) — sweep per §XI.3 migration table: `white` → `var(--surface-elevated)`, `rgba(0,0,0,.08)` shadow → `var(--shadow-card)`, `#1f2937` → `var(--text-primary)`, `#6b7280` → `var(--text-secondary)`, `#9ca3af` → `var(--text-tertiary)`, `#e5e7eb`/`#f3f4f6` borders → `var(--surface-border)`/`var(--surface-bg)`, `#c62828` → `var(--error-fg)`, `#d1d5db` → `var(--toggle-track)`. The salmon `--brand-primary` references stay as-is.
- [ ] **2.2 (M)** [src/components/AdminPortal.js](../../../src/components/AdminPortal.js) — same treatment; audit every colour literal in `addStyles()`.
- [ ] **2.3 (S)** [src/components/LoadingSpinner.js](../../../src/components/LoadingSpinner.js) — sweep text/background/border literals.
- [ ] **2.4 (S)** [src/components/StatusBadge.js](../../../src/components/StatusBadge.js) — sweep, preserving status colour semantics (success-green / warning-amber / error-red should remain readable on dark; may need per-token dark overrides if contrast fails — decide per-case).
- [ ] **2.5 (S)** [src/components/UserAvatar.js](../../../src/components/UserAvatar.js) — audit; replace any hardcoded colours.
- [ ] **2.6 (M)** [src/components/ToastContainer.js](../../../src/components/ToastContainer.js) — toast backgrounds for `success|error|warning|info|loading` must read well on dark. Prefer token references; add per-type dark overrides only where contrast genuinely fails.
- [ ] **2.7 (S)** Visual diff pass: light mode on every page must still look identical. *(Validation gate.)*
- [ ] **2.8 (S)** Manual dev-tools check: set `document.documentElement.dataset.theme = 'dark'` in DevTools console — every surface should flip coherently. No island of hardcoded light colour visible.

**Validation**: Zero light-mode regression; forced-dark smoke test via DevTools shows fully themed surfaces.

---

## Group 3 — ThemeModule + Pre-Paint Script

**Goal**: `ThemeModule` exists and is wired in `main.js`; inline pre-paint script prevents FOUC. Theme now resolves from `localStorage` (or `'system'` fallback) on every load — but is not yet connected to the user's Firestore preference. For signed-in users with a stored preference, the `system`/OS default applies until Group 4 lands.
**Commit message**: `feat(theme): add ThemeModule and inline pre-paint script`
**AC**: AC-3, AC-4, AC-5, AC-7, AC-8

- [ ] **3.1 (L)** Create [src/modules/theme.js](../../../src/modules/theme.js) implementing `ThemeModule` per §XI.1:
    - `THEMES = Object.freeze(['light','dark','system'])` whitelist.
    - `STORAGE_KEY = 'salmoncow.theme'`.
    - `init()` — reads localStorage (validated), applies, attaches `matchMedia` listener iff resolved == `'system'`.
    - `applyPreference(theme)` — whitelist-validates; `console.warn` + no-op on invalid; sets `document.documentElement.dataset.theme`; writes localStorage; attaches/detaches `matchMedia` listener based on new value.
    - `onProfileLoaded(profile)` — `applyPreference(profile?.preferences?.theme)`; guards against `null`/undefined.
    - `onSignOut()` — no-op (localStorage already holds last-known; do **not** force `'system'`).
    - `getResolvedTheme()` — returns `'light'|'dark'`; for tests.
    - `destroy()` — idempotent `matchMedia().removeEventListener`.
    - Internal helper `resolveSystem()` using `window.matchMedia('(prefers-color-scheme: dark)').matches`.
    - Internal helper `validate(v)` returning whitelisted value or `null`.
- [ ] **3.2 (M)** Add inline pre-paint `<script>` at the top of `<head>` in [src/index.html:7](../../../src/index.html) per §XI.4. Whitelist-on-read; try/catch around `localStorage`; sole sink is `document.documentElement.dataset.theme`. Keep it hand-written — **do not** import a module here (would defer past FOUC).
- [ ] **3.3 (M)** In [src/main.js:55](../../../src/main.js) `init()`: import and instantiate `ThemeModule` before the UI module init; call `theme.init()` right after. Store on `this.theme` for later wiring.
- [ ] **3.4 (S)** `npm run build` + `npm run dev:app`: signed-out cold load must pick up OS preference; reload must be FOUC-free on DevTools Slow-3G throttle. *(Validation gate.)*
- [ ] **3.5 (S)** DevTools console: `app.theme.applyPreference('dark')` flips the UI; `'system'` reverts; `'garbage'` logs a warning and does nothing.

**Validation**: OS preference respected on cold load; no FOUC on throttled reload; invalid inputs safely rejected.

---

## Group 4 — Profile Integration (Authoritative + Optimistic)

**Goal**: Authenticated user's Firestore `preferences.theme` drives the applied theme on sign-in; user-initiated changes from the `<select>` apply instantly (optimistic) and persist via the existing `updatePreferences` path.
**Commit message**: `feat(theme): wire ThemeModule to user profile state and optimistic updates`
**AC**: AC-2, AC-6 (full coverage)

- [ ] **4.1 (M)** In [src/main.js:174](../../../src/main.js) `initializeUserPortal()`, **after** `this.profileService` is constructed: register `this.profileService.onStateChange((profile) => this.theme.onProfileLoaded(profile))`. Store the unsubscribe returned by `onStateChange` on `this._themeProfileUnsub` for symmetry with other teardown.
- [ ] **4.2 (M)** In [src/modules/user-portal.js:22](../../../src/modules/user-portal.js) `UserPortalModule` constructor: accept an optional second argument `{ theme }` DI. In `handlePreferenceChange(key, value)` at [user-portal.js:105](../../../src/modules/user-portal.js): if `key === 'theme'` and `this.theme`, call `this.theme.applyPreference(value)` **before** awaiting `updatePreferences`. On failure, the existing `loadProfile` fallback already refreshes from authoritative state — `onStateChange` will fire with the reverted value and `theme.onProfileLoaded` reapplies it. No extra revert logic needed.
- [ ] **4.3 (S)** In [src/main.js:171](../../../src/main.js) `initializeUserPortal`: pass `{ theme: this.theme }` to the `UserPortalModule` constructor.
- [ ] **4.4 (S)** `npm run dev` (emulator + app). Sign in; change dropdown to `dark` → UI flips within one animation frame. Refresh → dark persists. Inspect Firestore emulator UI → `users/{uid}.preferences.theme === 'dark'`. *(Validation gate.)*
- [ ] **4.5 (S)** Sign out → theme **does not** flip (AC-5: stays on last-applied). Sign back in → Firestore value reapplies.

**Validation**: Full round-trip: UI action → Firestore → next load reads correct theme; optimistic path is instant; revert path is handled by existing error plumbing.

---

## Group 5 — Unit Tests + Test Harness

**Goal**: Add a plain-JS `test:unit` vitest lane and cover `ThemeModule` per §XI.6. Chain into root `test` script so CI runs it alongside rules + functions tests.
**Commit message**: `test(theme): add ThemeModule unit tests and test:unit script`
**AC**: AC-9

- [ ] **5.1 (S)** Add `jsdom` to `devDependencies` if not already transitively available (run `npm ls jsdom` to check; add `"jsdom": "^25.0.0"` if missing).
- [ ] **5.2 (S)** Add `vitest.config.js` at repo root (or extend if present) with `test.environment: 'jsdom'` scoped to `tests/unit/**`. Keep `tests/rules/**` on the default environment to not disturb the existing rules suite.
- [ ] **5.3 (S)** `package.json`: add `"test:unit": "vitest run tests/unit"`. Update `"test"` to `"npm run test:rules && npm run test:functions && npm run test:unit"`.
- [ ] **5.4 (L)** Create [tests/unit/modules/theme.test.js](../../../tests/unit/modules/theme.test.js) with the 10 cases enumerated in §XI.6:
    - init: no localStorage → `'system'`-resolved.
    - init: `localStorage='dark'` → `'dark'`, no matchMedia listener.
    - init: `localStorage='system'` + mocked OS dark → `'dark'`, listener attached.
    - init: `localStorage='garbage'` → `'system'`-resolved, bad value left in storage (will be overwritten on next valid `applyPreference`).
    - `applyPreference('dark')` → dataset + localStorage updated, listener detached.
    - `applyPreference('system')` → listener attached; mocked change flips dataset.
    - `applyPreference('invalid')` → no-op, no throw, `console.warn` called.
    - `destroy()` → `removeEventListener` invoked; subsequent mocked change events ignored.
    - `onProfileLoaded({ preferences: { theme: 'light' } })` equivalent to `applyPreference('light')`.
    - `onProfileLoaded(null)` → no-op.
    Use `vi.fn()` for the `matchMedia` mock returning `{ matches, addEventListener, removeEventListener }`. AAA pattern; descriptive names.
- [ ] **5.5 (S)** `npm run test:unit` → all green. *(Validation gate.)*
- [ ] **5.6 (S)** `npm test` → all three lanes green (rules + functions + unit).

**Validation**: All unit tests pass; chained test script green; no regression in existing lanes.

---

## Group 6 — Manual QA + PR

**Goal**: Evidence-backed PR matching constitution §V.1 step 7 (Summary / Changes / Testing / Guidance References).
**Commit message**: merged PR only — no new commit.
**AC**: AC-1 through AC-12 (all)

- [ ] **6.1 (M)** Execute the §XI.6 manual QA checklist in full — 10 checkboxes, two OS modes × multiple flows. Capture **both** light-mode and dark-mode screenshots for at least: `/`, `/profile`, `/admin` (if testable), the navigation dropdown, and a toast.
- [ ] **6.2 (S)** Safari check: manual smoke test on macOS Safari (legacy `matchMedia.addListener` compat — our code uses the modern `addEventListener` which Safari has supported since 14; document Safari version tested).
- [ ] **6.3 (S)** Write PR body: Summary, Changes (list the 6 commit groups), Testing (`npm test` output summary + manual QA checklist with links to screenshots), Guidance References (cite constitution §II.1 / §III.2 / §III.3 / §IV.2 / §VI.1, and the pattern files listed in §X of the spec).
- [ ] **6.4 (S)** `gh pr create` targeting `main`. Link to the feature spec: `.specs/features/002-dark-mode-theme/spec.md`.
- [ ] **6.5 (S)** After merge: `git mv .specs/features/002-dark-mode-theme/ .specs/archive/002-dark-mode-theme/` (per features/README.md lifecycle).

**Validation**: PR merged green; feature archived.

---

## Follow-Up (Out of Scope — Do NOT Include in This PR)

Flagged in §XI.2 of the spec:

- **`UserProfileService.updatePreferences` map-merge bug** — current implementation writes `{ preferences: { [key]: value } }` to Firestore, which replaces the `preferences` map rather than merging. Risk: an older client or concurrent tab writing only `{ theme }` clobbers `{ emailNotifications }`. Not triggered by this feature alone (the only two preferences the service knows about are `theme` and `emailNotifications`, and both writes go through this same broken path, so the last-write-wins behaviour is internally consistent), **but** it's a latent correctness bug. Recommend a dedicated fix PR that merges against the current cached profile's preferences before writing, or switches to dotted-path `updateDoc(..., { 'preferences.theme': value })` — the latter is simpler. See [src/services/user-profile-service.js:121](../../../src/services/user-profile-service.js).

---

**Next step**: `/speckit-implement` to execute Groups 1 → 6 in order, committing at the end of each group only when the validation gate passes.
