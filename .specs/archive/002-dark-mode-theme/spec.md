# Feature Specification: Dark Mode Theme

**Version**: 1.0.0
**Created**: 2026-04-22
**Status**: Draft

---

## I. Overview

Apply a user-selectable colour theme (light / dark / system) across the SalmonCow web app and persist the authenticated user's choice in their Firestore `users/{uid}` profile document.

The preference **data model and persistence layer already exist**:
- [src/types/user-profile.js:13](../../../src/types/user-profile.js) — `UserPreferences.theme: 'light' | 'dark' | 'system'`, default `'system'`
- [src/components/UserPortal.js:146](../../../src/components/UserPortal.js) — theme `<select>` already rendered and emits `preference-change`
- [src/modules/user-portal.js:105](../../../src/modules/user-portal.js) — change handler already forwards to `UserProfileService.updatePreferences()`
- [src/repositories/firestore-user-profile-repository.js:99](../../../src/repositories/firestore-user-profile-repository.js) — `update()` already persists the `preferences` map

**What this feature adds** is everything *downstream* of that persisted value: the runtime that reads it, applies it to the DOM, respects the OS preference when `system` is selected, prevents a light-mode flash on cold load, and the CSS-token refactor that makes "dark mode" actually mean something visually.

---

## II. Constitutional Constraints

Citing [.specs/constitution.md](../../constitution.md).

**Current phase (§II.1)** — UI is **Phase 1 (Vanilla Web Components)**; we must not introduce a framework or styling lib. CSS custom properties + `[data-theme]` attribute on `<html>` is the idiomatic Phase 1 approach.

**Quality standards**:
- **§III.2 Security** — Theme data is non-sensitive; no new attack surface. Existing rules already restrict `users/{uid}` writes to the owner and reject client writes to `role`/`roleChangedAt` (verified in [firestore-user-profile-repository.js:37](../../../src/repositories/firestore-user-profile-repository.js)). `preferences.theme` is already permitted.
- **§III.3 Performance** — FCP target <1.5s p95. Initial theme **must** be applied before first paint (inline `<script>` in `index.html` reading from `localStorage`) to avoid a flash of light-mode content (FOUC).
- **§III.4 Code Quality** — Conventional commits, PR-only changes.

**Forbidden patterns avoided (§IV.2)**:
- No new Firestore reads introduced — the theme piggybacks on the existing `getOrCreateProfile()` fetch during auth state change.
- No uncleaned `onSnapshot()` listeners. The `matchMedia` listener for system-preference changes **is** new and must be torn down on sign-out / module destroy.
- No client-side filtering, no unbounded reads.

**Cost (§VI)** — Zero additional Firestore read/write budget. Theme writes reuse the existing `updatePreferences` path (~1 write per user-initiated theme change).

**Evolution triggers not crossed** — this feature adds **one** module (`theme.js`) and does not move any domain into a new phase.

---

## III. User Stories

**US-1 — Signed-in user picks a theme and it sticks across sessions/devices.**
As an authenticated user, when I change the Theme dropdown in my profile to "Dark", the app switches to dark colours immediately and the choice is stored in my Firestore profile so signing in on another browser shows the same theme.

**US-2 — Signed-in user follows the OS.**
As an authenticated user, when I leave Theme set to "System", the app tracks my OS-level `prefers-color-scheme`: if I toggle macOS dark mode mid-session, the app follows without a reload.

**US-3 — Anonymous visitor sees a consistent theme.**
As an unauthenticated visitor, the app respects my OS `prefers-color-scheme` on first visit. If I later sign in and I have a stored preference, that preference takes over on the next auth state callback.

**US-4 — No flash of wrong theme on cold load.**
As any user reloading the page with dark mode active, I do **not** see a split-second light-mode flash before the theme applies.

---

## IV. Acceptance Criteria

**Runtime behaviour**
- AC-1. Setting `<html data-theme="dark">` visibly switches every surface (body, cards, text, buttons, nav, toasts, admin portal, user portal) to a dark palette. No element retains a hardcoded light-mode colour.
- AC-2. Changing the Theme dropdown in the User Portal updates the DOM within one animation frame, persists to Firestore, and survives a hard reload.
- AC-3. When `preferences.theme === 'system'`, the applied theme matches `window.matchMedia('(prefers-color-scheme: dark)').matches` and updates live when the OS setting changes.
- AC-4. On cold load, a brief inline `<script>` in `index.html` reads a `localStorage` key (`salmoncow.theme`) and sets `<html data-theme>` *before* stylesheets evaluate; no FOUC is visible in a throttled-3G profile.
- AC-5. On sign-out, the applied theme reverts to the `localStorage`-cached value (or `system` if none), and the theme module unsubscribes any live listeners.

**Data layer**
- AC-6. Firestore `users/{uid}.preferences.theme` is written only via the existing `UserProfileService.updatePreferences()` path — no new repository method is introduced.
- AC-7. `localStorage` cache is updated whenever the applied theme changes, for any reason (user selection, profile load, system-preference change while in `system` mode).
- AC-8. Invalid stored values (anything not `'light'|'dark'|'system'`) are ignored and treated as `'system'`.

**Testing**
- AC-9. Unit tests cover: resolving `'system'` → `'light'|'dark'` via mocked `matchMedia`; applying/removing the DOM attribute; `localStorage` read/write; invalid-value fallback; subscription teardown.
- AC-10. The existing Firestore rules test suite is re-run unchanged and still passes (no rules surface touched).

**Non-functional**
- AC-11. The feature adds no new npm dependency.
- AC-12. The feature adds **one** new module file (`src/modules/theme.js`) and refactors existing CSS/component styles to reference tokens; module count stays ≤ 9 (well under the 10-module Phase-2-testing trigger).

---

## V. Architecture Approach

**Module boundary** — One new module, `src/modules/theme.js`, exposing a `ThemeModule` with:
- `init()` — reads `localStorage`, applies initial theme, starts `matchMedia` listener if the resolved preference is `system`.
- `applyPreference(theme)` — applies one of `'light'|'dark'|'system'`, updates `localStorage`, re-wires `matchMedia` subscription as needed.
- `onProfileLoaded(profile)` / `onSignOut()` — called by `App` / `UserPortalModule` at the existing auth-state hooks in [main.js:278](../../../src/main.js).
- `destroy()` — idempotent teardown of `matchMedia` listener.

**Dependency direction** (§II.3) — `ThemeModule` depends only on `window` APIs and is called from `App` (presentation layer). It does **not** import `UserProfileService` or Firestore SDK; it receives theme values as plain strings from the existing profile-change hook. This keeps the module pure and trivial to unit-test.

**Integration points**:
- `src/main.js` — instantiate `ThemeModule` before auth state listener wires up; call `theme.onProfileLoaded(profile)` from inside the existing `setupAuthStateListener` → `userPortal.handleAuthStateChange` flow (add a parallel call, do not re-plumb through the portal).
- `index.html` — inline pre-paint script (see §III.3) to set `<html data-theme>` from `localStorage` before CSS loads.
- `src/styles/main.css` — introduce `:root { --color-bg: ...; --color-fg: ...; ... }` and a `[data-theme="dark"] { ... }` override block; migrate hardcoded `#f3f4f6`, `#1f2937`, etc. to tokens.
- Component inline styles (`UserPortal`, `UserAvatar`, `StatusBadge`, `AdminPortal`, `ToastContainer`, `LoadingSpinner`, `navigation.css`) — migrate hardcoded colours to the same tokens. Component styles attach to `document.head` once (existing pattern), so tokens cascade naturally into light-DOM children.

**Pattern references**:
- [.prompts/core/architecture/modular-architecture-principles.md](../../../.prompts/core/architecture/modular-architecture-principles.md) — single-responsibility module; no cross-cutting infrastructure.
- [.prompts/core/architecture/code-structure.md](../../../.prompts/core/architecture/code-structure.md) — `modules/` is the right layer (application logic, not infra).
- [.prompts/core/development/asset-reusability.md](../../../.prompts/core/development/asset-reusability.md) — design tokens over duplicated colour literals.

---

## VI. Security Requirements

- Only the owner of `users/{uid}` can write `preferences` — already enforced by existing Firestore rules (verified by existing test suite). No rules change.
- `preferences.theme` passes the repo's `sanitizeUpdate` because it's not in `FORBIDDEN_CLIENT_FIELDS`. No change to that allowlist.
- Validate the incoming string on the client: `updatePreferences` is called only with values from a closed `<option>` set, but the `ThemeModule` **must** also whitelist (`['light','dark','system']`) before applying — defence in depth, matches §III.2 ("input validation at all boundaries").
- `localStorage` value is untrusted input on read (user could tamper). Treat it exactly like any external input: validate against the same whitelist; fall back to `'system'` on anything else.
- No `innerHTML` injection: the module manipulates `document.documentElement.dataset.theme` only — no HTML strings, no XSS surface.

**Pattern references**:
- [.prompts/core/security/security-principles.md](../../../.prompts/core/security/security-principles.md) — input validation at boundaries.
- [.prompts/platforms/firebase/firebase-security.md](../../../.prompts/platforms/firebase/firebase-security.md) — rules already cover this data shape.

---

## VII. Firebase Implementation

**No new Firestore surface.** The feature consumes `preferences.theme` via the existing profile fetch and writes it via the existing `updatePreferences()` call.

- **Reads**: 0 new. Theme is extracted from the same `getOrCreateProfile` result that already loads on sign-in.
- **Writes**: 1 per user-initiated theme change (existing `updatePreferences` path). No batching needed.
- **Listeners**: 0 new. Do **not** add an `onSnapshot` for cross-device live theme sync — not worth the quota and listener-cleanup burden for a rarely-changing preference. Next-sign-in sync is sufficient (US-1 spec).
- **Cost budget**: Negligible. Worst case at 1,000 DAU with 1 theme change/user/month ≈ 1,000 writes/month, vs. the 20k/day Blaze free quota (§VI.1).

**Pattern references**:
- [.prompts/platforms/firebase/firebase-best-practices.md](../../../.prompts/platforms/firebase/firebase-best-practices.md) — prefer one-shot reads over listeners for rarely-changing data.
- [.prompts/platforms/firebase/firebase-finops.md](../../../.prompts/platforms/firebase/firebase-finops.md) — 0-read designs beat cached-read designs.

---

## VIII. Testing Requirements

Per constitution §III.1 (70/20/10 pyramid, ≥80% overall, 100% for critical paths). Theme is **not** a critical path; standard coverage applies.

**Unit tests** (new — `tests/unit/modules/theme.test.js` or similar, matching existing test layout):
- Applies `light`/`dark` to `document.documentElement.dataset.theme` correctly.
- Resolves `system` via mocked `matchMedia` for both dark-true and dark-false OS states.
- Re-applies when the mocked `matchMedia` change event fires, only while mode is `system`.
- Stops reacting to `matchMedia` after switching away from `system`.
- Reads `localStorage` on `init()`; falls back to `'system'` on missing/invalid values.
- Writes `localStorage` on every applied change.
- `destroy()` removes the `matchMedia` listener (verify the mock `removeEventListener` is called).

**Integration smoke** (optional, manual is acceptable per §III.1 Phase 1 stance):
- Load app signed-out → verify OS preference respected.
- Sign in → verify Firestore value overrides; change dropdown → verify immediate DOM update + Firestore write.
- Hard reload → verify no FOUC (QA with Network throttle = Slow 3G in DevTools).
- Cross-browser: Chrome, Safari (WebKit's `matchMedia` legacy API nuance).

**Rules tests** — Unchanged; no rules surface modified. Re-run to confirm no regression.

**Pattern references**:
- [.prompts/core/testing/testing-principles.md](../../../.prompts/core/testing/testing-principles.md) — AAA pattern, descriptive names.
- [.prompts/platforms/firebase/firebase-testing.md](../../../.prompts/platforms/firebase/firebase-testing.md) — emulator / rules regression workflow.

---

## IX. Out of Scope

To keep this feature focused and avoid scope creep:
- **Accent-colour customisation / full theming API** — dark/light only; the existing `--brand-primary` stays as-is (or gets one dark-mode tweak if contrast demands it).
- **Per-route themes** or scheduled/automatic switching (e.g. "dark after sunset") — not requested.
- **High-contrast / accessibility-preset themes** — out of scope; WCAG AA contrast on both light and dark is in scope.
- **Cross-device live sync via `onSnapshot`** — explicitly rejected in §VII.
- **Animated theme transitions** — a `transition: background-color 150ms` on `body` is nice-to-have; leave to implementation judgement, do not spec.

---

## X. References

**Constitutional constraints cited**:
- §II.1 — UI Phase 1 (Vanilla Web Components) — no framework introduction
- §II.3 — Modularity (single-responsibility, dependency direction)
- §III.2 — Security (input validation at all boundaries)
- §III.3 — Performance (FCP <1.5s, FOUC prevention)
- §IV.2 — Forbidden patterns (no uncleaned listeners; no new unnecessary `onSnapshot`)
- §VI.1 — Blaze free quotas (no new read/write pressure)

**Foundational patterns referenced**:
- [.prompts/core/architecture/modular-architecture-principles.md](../../../.prompts/core/architecture/modular-architecture-principles.md)
- [.prompts/core/architecture/code-structure.md](../../../.prompts/core/architecture/code-structure.md)
- [.prompts/core/security/security-principles.md](../../../.prompts/core/security/security-principles.md)
- [.prompts/core/testing/testing-principles.md](../../../.prompts/core/testing/testing-principles.md)
- [.prompts/core/development/asset-reusability.md](../../../.prompts/core/development/asset-reusability.md)
- [.prompts/platforms/firebase/firebase-best-practices.md](../../../.prompts/platforms/firebase/firebase-best-practices.md)
- [.prompts/platforms/firebase/firebase-finops.md](../../../.prompts/platforms/firebase/firebase-finops.md)
- [.prompts/platforms/firebase/firebase-security.md](../../../.prompts/platforms/firebase/firebase-security.md)

**Existing code touchpoints**:
- [src/types/user-profile.js](../../../src/types/user-profile.js) — data model (unchanged)
- [src/components/UserPortal.js](../../../src/components/UserPortal.js) — theme selector (unchanged behaviour)
- [src/modules/user-portal.js](../../../src/modules/user-portal.js) — change handler (unchanged)
- [src/main.js](../../../src/main.js) — integration point for `ThemeModule.init()` and profile-loaded hook
- [src/styles/main.css](../../../src/styles/main.css) — token refactor site
- [index.html](../../../index.html) — inline pre-paint script

---

## XI. Technical Implementation Plan

### XI.1 Architecture

**Module shape** — one new file, `src/modules/theme.js`, exporting a `ThemeModule` class. Pure DOM + `window` APIs; no Firebase imports; no coupling to `UserProfileService`. Receives plain strings at its public methods.

```
ThemeModule
├── init()                            → read localStorage, apply initial theme, start system watcher if resolved === 'system'
├── applyPreference(theme: string)    → whitelist-validate; set dataset + localStorage; start/stop system watcher
├── onProfileLoaded(profile)          → delegates to applyPreference(profile?.preferences?.theme)
├── onSignOut()                       → re-resolve from localStorage (keep last-known; don't force 'system')
├── getResolvedTheme(): 'light'|'dark'→ expose for tests; computed from stored pref + matchMedia
└── destroy()                         → remove matchMedia listener; idempotent
```

**Dependency flow** (respects §II.3 Application → Service → Infrastructure):
```
main.js  ──instantiates──▶  ThemeModule
main.js  ──onAuth──▶  UserPortalModule.handleAuthStateChange  ──(new)──▶  theme.onProfileLoaded(profile)
UserPortal <select>  ──preference-change──▶  UserPortalModule  ──updatePreferences──▶  Firestore
                                                                   └──(new)──▶  theme.applyPreference(value)    // apply optimistically
```

Key choice: `ThemeModule` **is called from both sides** — optimistically on user action (instant UI response) *and* authoritatively after Firestore confirms via the next profile fetch / state callback. Because the module is idempotent, double-apply is a no-op. This avoids having to add a new observer on `UserProfileService.onStateChange` (the service's existing callback, [user-profile-service.js:179](../../../src/services/user-profile-service.js)) if we don't want to — but using `onStateChange` is the cleanest wiring and the plan picks it (see XI.8 step 5).

### XI.2 Data Layer

**No Firestore schema change.** `users/{uid}.preferences.theme` already exists (§I citations).

**Queries** — none new. Reads piggyback on existing `getOrCreateProfile` (1 get per sign-in, cached 5 min by [user-profile-service.js:27](../../../src/services/user-profile-service.js)).

**Writes** — reuses existing `UserProfileService.updatePreferences()` → `repository.update()` → `updateDoc({ preferences: { theme } }, merge via service pattern)`.
> Note: current `updatePreferences({ theme: 'dark' })` sends `{ preferences: { theme: 'dark' } }` which on Firestore **replaces** the `preferences` map. Since all preference UI goes through the same path and the service layer spreads the full object, this is already fine for the in-memory `preferences` object — but the service should write a **merged** preferences map so an older tab writing `{ theme }` doesn't clobber `{ emailNotifications }`. Verify [user-profile-service.js:121](../../../src/services/user-profile-service.js) merges against current cached profile before writing. **This is a latent bug separate from the feature; flag it but do NOT fix it here** — out of scope, candidate for a follow-up task.

**Rules** — no change. Existing [firestore.rules](../../../firestore.rules) already permits the owner to write non-forbidden fields on their own `users/{uid}` doc; `preferences.theme` is not forbidden.

### XI.3 UI Components (Phase 1: Vanilla Web Components)

**No new components.** The existing `<user-portal>` already renders the theme `<select>`. No component API change.

**CSS token layer** (new) — introduce a shared token set at `:root` and override at `[data-theme="dark"]`. The existing `navigation.css` already defines `:root { --brand-primary, --dropdown-bg, ... }`; **extend that pattern** rather than creating a parallel system. Split into two concerns:

1. **Semantic surface tokens** (new, in `src/styles/main.css` `:root`):
   ```css
   :root {
     --surface-bg:        #f3f4f6;
     --surface-elevated:  #ffffff;
     --surface-border:    #e5e7eb;
     --text-primary:      #1f2937;
     --text-secondary:    #6b7280;
     --text-tertiary:     #9ca3af;
     --focus-ring:        rgba(214, 110, 79, 0.2);
     --shadow-card:       0 4px 20px rgba(0, 0, 0, 0.08);
     --error-fg:          #c62828;
     --toggle-track:      #d1d5db;
   }
   [data-theme="dark"] {
     --surface-bg:        #0b1220;
     --surface-elevated:  #111827;
     --surface-border:    #1f2937;
     --text-primary:      #f3f4f6;
     --text-secondary:    #9ca3af;
     --text-tertiary:     #6b7280;
     --focus-ring:        rgba(214, 110, 79, 0.35);
     --shadow-card:       0 4px 20px rgba(0, 0, 0, 0.45);
     --error-fg:          #f87171;
     --toggle-track:      #374151;
   }
   ```
   Exact values are the *implementation's* decision — contrast must meet WCAG AA (§IX scope statement). These are a starting palette, not a contract.

2. **Brand tokens stay as-is**; `--brand-primary` is the salmon accent and remains constant across themes (only the surfaces/text invert).

**Migration targets** (hardcoded → token):
| File | Hardcoded values to replace |
|---|---|
| [src/styles/main.css:9](../../../src/styles/main.css) | `background: #f3f4f6` → `var(--surface-bg)` |
| [src/components/UserPortal.js:242](../../../src/components/UserPortal.js) | `white`, `rgba(0,0,0,.08)`, `#1f2937`, `#6b7280`, `#9ca3af`, `#e5e7eb`, `#f3f4f6`, `#c62828`, `#d1d5db`, `#374151` → tokens |
| [src/assets/styles/navigation.css:22](../../../src/assets/styles/navigation.css) | `--dropdown-bg: #ffffff` → `var(--surface-elevated)`, `--dropdown-border: #e5e7eb` → `var(--surface-border)`, `--dropdown-text: #333333` → `var(--text-primary)`, `--dropdown-hover-bg: #f3f4f6` → `var(--surface-bg)` (keep the nav bar itself branded = salmon in both themes) |
| `src/components/LoadingSpinner.js`, `StatusBadge.js`, `UserAvatar.js`, `AdminPortal.js`, `ToastContainer.js` | audit each `addStyles()` method, same treatment |

**The `<select>` element** in UserPortal — ensure the SVG arrow data-URI and `background-color: white` both switch. Either wrap both in tokens or set `color-scheme: light dark` on `:root`/`[data-theme="dark"]` so native form controls adapt automatically (preferred — one CSS line, eliminates per-input styling).

### XI.4 Pre-Paint FOUC Prevention

Add a short inline `<script>` in [src/index.html:7](../../../src/index.html) `<head>`, **before** any stylesheet is referenced (Vite injects the CSS link during build, but the inline script runs first since it's in the HTML source):

```html
<script>
  (function () {
    try {
      var v = localStorage.getItem('salmoncow.theme');
      if (v !== 'light' && v !== 'dark' && v !== 'system') v = 'system';
      var resolved = v === 'system'
        ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : v;
      document.documentElement.dataset.theme = resolved;
    } catch (_) { /* localStorage disabled; accept light default */ }
  })();
</script>
```

Rationale:
- **Inline + synchronous**: no network round-trip, no module import, no parse deferral. Runs before render.
- **Whitelist-on-read**: tampered localStorage values fall back to `system` (AC-8).
- **Try/catch**: private-mode Safari can throw on `localStorage.getItem`; swallow and accept the default.
- **~300 bytes minified**: inside any reasonable perf budget; does not affect FCP measurably.

Keep the script hand-written and minimal — do **not** import a module here (would defer to after HTML parse → FOUC reintroduced).

### XI.5 Security Implementation

Cross-ref §VI of this spec. Concretely:

1. **Whitelist on every boundary**:
   - Inline pre-paint script (above): whitelists before `dataset.theme =`.
   - `ThemeModule.applyPreference(v)`: whitelists `v` against `['light','dark','system']`; invalid → no-op + `console.warn`.
   - `UserPortalModule.handlePreferenceChange('theme', v)`: already forwards to `updatePreferences`; since the `<select>` is closed-set and same-origin, no additional validation needed *at the service layer*, but `ThemeModule` validation still applies upstream.
2. **Firestore rules**: no change. Owner-only write is already enforced.
3. **No `innerHTML`**: `ThemeModule` only touches `document.documentElement.dataset.theme` and `localStorage`. No XSS surface.
4. **Pre-paint script audit**: the only sink is `dataset.theme`, and the assigned value is whitelisted. No string concat into HTML / eval / Function.

### XI.6 Testing Strategy

**State of test harness** — `tests/rules/*.test.ts` uses vitest via the Firestore emulator exec wrapper ([package.json:13](../../../package.json)). There is **no existing JS-module unit-test setup** — `vitest` is installed but only runs `tests/rules/`. This feature adds a small plain-JS unit layer.

**Two-part test plan**:

1. **New: `tests/unit/modules/theme.test.js`** with a minimal `vitest.config.js` addition or a new `test:unit` script:
   ```json
   "test:unit": "vitest run tests/unit"
   ```
   and chain it into the existing `test` script: `"test": "npm run test:rules && npm run test:functions && npm run test:unit"`.

   **Test cases** (AAA, mocked `matchMedia` + `localStorage` via `jsdom`):
   - `init()` with no localStorage → applies `'system'`-resolved theme.
   - `init()` with `localStorage = 'dark'` → applies `'dark'`; does not attach `matchMedia` listener.
   - `init()` with `localStorage = 'system'` + OS dark → applies `'dark'`; attaches listener.
   - `init()` with `localStorage = 'garbage'` → applies `'system'`-resolved; localStorage rewritten? (**decide once**: plan says leave the bad value, it will be corrected on the next valid `applyPreference`).
   - `applyPreference('dark')` → `documentElement.dataset.theme === 'dark'`, `localStorage.salmoncow.theme === 'dark'`, listener detached.
   - `applyPreference('system')` → listener attached; firing mock change flips `dataset.theme`.
   - `applyPreference('invalid')` → no-op, no throw.
   - `destroy()` → `matchMedia().removeEventListener` called; subsequent mock change events are ignored.
   - `onProfileLoaded({ preferences: { theme: 'light' } })` → equivalent to `applyPreference('light')`.
   - `onProfileLoaded(null)` → no-op (signed-out guard).

2. **Existing rules tests** — run unchanged. Expect 100% pass. No rules surface touched.

3. **Manual QA checklist** (signed off in PR description per constitution §V.1 step 7):
   - [ ] Signed-out cold load, OS=light → light theme visible, no flash.
   - [ ] Signed-out cold load, OS=dark → dark theme visible, no flash.
   - [ ] Sign in with stored `theme='dark'` → dark theme persists across refresh.
   - [ ] Change OS setting while `theme='system'` → app follows without reload.
   - [ ] Change OS setting while `theme='light'` → app does **not** change (AC-3 negative case).
   - [ ] Toggle dropdown to `dark` → Firestore `users/{uid}.preferences.theme === 'dark'` (inspect emulator).
   - [ ] Two browsers: change in one, sign in on the other → second picks up new value on next sign-in.
   - [ ] DevTools Slow-3G cold load → no FOUC.
   - [ ] Safari + Chrome parity.
   - [ ] Keyboard focus rings still visible on dark.

### XI.7 Performance Considerations

- **Bundle size** — `ThemeModule` ~1 KB minified; inline pre-paint script ~300 B in HTML. No new npm deps. Total page-weight delta: under 1.5 KB gzip.
- **Firestore quota** — 0 additional reads, ~1 write per user per preference change. At 1,000 DAU × 1 change/month = 1,000 writes/month vs. Blaze free 600k writes/month — **0.16%** of budget. Stays well within §VI.1 targets.
- **Runtime** — setting `dataset.theme` triggers style recalc on the `<html>` subtree; benchmark target <8 ms on mid-range mobile. Only runs on init and on genuine preference change.
- **Caching** — the 5-min service cache in `UserProfileService` already covers the read path. `localStorage` acts as a first-paint cache; it is authoritative until Firestore confirms (up to one profile fetch later).

### XI.8 Implementation Steps (ordered)

1. **CSS token layer** — extend `src/styles/main.css` with `:root` semantic tokens + `[data-theme="dark"]` overrides; add `color-scheme: light dark;` under the dark block for native controls. Do **not** change any component styles yet — tokens should degrade to the current palette when unreferenced.
2. **Inline pre-paint script** — add `<script>` at the top of `<head>` in [src/index.html:7](../../../src/index.html) per XI.4.
3. **Create `src/modules/theme.js`** — implement `ThemeModule` per XI.1 shape. Keep it ~100 lines; resist abstraction.
4. **Wire `ThemeModule` in `main.js`** — instantiate before `setupAuthStateListener` in [src/main.js:55](../../../src/main.js); call `theme.init()` there.
5. **Subscribe to profile state changes** — in `main.js`, after `this.profileService` exists (line 174), register `this.profileService.onStateChange((profile) => this.theme.onProfileLoaded(profile))`. This handles both sign-in (profile set) and sign-out (profile null → no-op).
6. **Optimistic apply** — in [src/modules/user-portal.js:108](../../../src/modules/user-portal.js) `handlePreferenceChange`, when `key === 'theme'`, call `this.theme.applyPreference(value)` **before** awaiting the Firestore write. Pass `theme` into `UserPortalModule`'s constructor via DI (new optional arg; falsy = no-op).
7. **Migrate CSS literals → tokens** — sweep the files listed in XI.3 migration table. One file per commit; each commit visually regression-tested in light mode (should look identical) and in dark mode (should look coherent).
8. **Add `test:unit` script + `tests/unit/modules/theme.test.js`** — install any missing `jsdom` dep if vitest doesn't pull it transitively (`@vitest/ui` not needed). Update the top-level `test` script to chain.
9. **Manual QA** per XI.6 checklist.
10. **PR** — summary, per-AC evidence (screenshots of light + dark), guidance references section citing §II.1, §III.2, §III.3.

### XI.9 Files to Create / Modify

**Create**:
- `src/modules/theme.js` (~100 LOC)
- `tests/unit/modules/theme.test.js` (~150 LOC, mocked DOM)

**Modify**:
- `src/index.html` — add inline pre-paint `<script>` (§XI.4)
- `src/styles/main.css` — add token layer + dark override (§XI.3)
- `src/assets/styles/navigation.css` — remap existing tokens onto shared semantic tokens (§XI.3 table)
- `src/components/UserPortal.js` — `addStyles()` hardcoded colours → tokens
- `src/components/AdminPortal.js` — same
- `src/components/LoadingSpinner.js` — same
- `src/components/StatusBadge.js` — same
- `src/components/UserAvatar.js` — same (if any hardcoded colours present; audit)
- `src/components/ToastContainer.js` — same (toast backgrounds especially; ensure success/error/info still read well on dark)
- `src/main.js` — instantiate `ThemeModule`, wire to `onStateChange` (§XI.8 steps 4–5)
- `src/modules/user-portal.js` — accept optional `theme` DI, call `applyPreference` optimistically (§XI.8 step 6)
- `package.json` — add `test:unit` script; extend `test` script

**Not modified** (explicit):
- `firestore.rules` — no rules change needed.
- `src/types/user-profile.js` — data model is already correct.
- `src/repositories/firestore-user-profile-repository.js` — no repo change; `preferences.theme` flows through existing `update()`.
- `src/services/user-profile-service.js` — **not modified in this feature**, though the latent merge-vs-overwrite concern in XI.2 deserves a follow-up task.
- `functions/**` — no Cloud Function surface touched.

### XI.10 Estimated Complexity

| Dimension | Estimate |
|---|---|
| New files | 2 (`theme.js`, `theme.test.js`) |
| Modified files | ~10 (CSS + components + html + main + package) |
| New LOC | ~250 (module + tests + token CSS) |
| Churn LOC | ~80 (literal→token sweeps) |
| New Firestore reads | 0 |
| New Firestore writes | ~1 per user-initiated change (existing path) |
| New npm deps | 0 (jsdom may already be in vitest's tree; verify) |
| Risk of regression | Low — CSS-token migration is the only surface that could break layout; each file migrated in isolation |
| Effort | ~1 focused day to land cleanly (module + tokens + component sweep + tests + QA) |

### XI.11 Plan Validation (Constitution checklist)

- [x] **Phase respected** — UI stays Phase 1 (Vanilla WC), no framework added.
- [x] **Approved patterns** — design tokens (asset-reusability), modular single-responsibility (modular-architecture), boundary validation (security-principles), one-shot reads over listeners (firebase-best-practices).
- [x] **Forbidden patterns avoided** — no unbounded reads; no uncleaned listeners (matchMedia is cleaned in `destroy()`); no new `onSnapshot`; no premature abstraction (single module, no plugin system).
- [x] **Quality standards addressed** — FOUC mitigation for §III.3; boundary whitelist for §III.2; unit tests per §III.1 proportional-to-criticality.
- [x] **Cost constraints** — 0 new reads, negligible writes; well under §VI.1 Blaze free quotas.
- [x] **Metric impact** — adds 1 module (8 → 9), still under the 10-module Phase 2 testing trigger.

---

**Next step**: `/speckit-tasks` to produce the ordered, committable task breakdown in `tasks.md`.
