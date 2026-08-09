# Development Guide

## Prerequisites

- Node.js — see [Node version](#node-version) below
- **Java 21** — the Firestore emulator runs on the JVM, so `npm run dev` and
  both emulator-backed test lanes need it
- Firebase CLI (`npm install -g firebase-tools`)
- Modern web browser

### Node version

This repo intentionally uses two different Node versions, pinned via `.nvmrc`:

- Repo root: Node 24 (for Vite, Vitest, and other build/test tooling — see root `.nvmrc` and `engines.node` in [package.json](package.json)).
- `functions/`: Node 22 (matches the Cloud Functions deployed runtime — see [functions/.nvmrc](functions/.nvmrc) and `engines.node` in [functions/package.json](functions/package.json)).

If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in each directory before running tests or starting the Firebase emulators. Running with the wrong host Node version will surface a `functions: Your requested "node" version "22" doesn't match your global version ...` warning from the Firebase CLI — the emulator falls back to your host Node, which can mask runtime differences that only appear once deployed. Don't unify the two versions.

## Local Development

### Setup

```bash
npm install
cp .env.example .env   # fill in your Firebase web config
npm run dev
```

`npm run dev` starts the **Firebase emulator suite** (Auth, Firestore,
Functions) *and* Vite, so local development never touches production data. It
serves at http://localhost:3000, and emulator state is imported from and
exported to `.emulator-data/` so it survives restarts.

This is why Java 21 is a prerequisite — the Firestore emulator runs on the JVM.
If you only need the UI and no backend, `npm run dev:app` runs Vite alone.

### Scripts

**Develop**

| Command | Description |
|---------|-------------|
| `npm run dev` | Emulator suite + Vite (the normal entry point) |
| `npm run dev:app` | Vite alone, no emulators |
| `npm run emulators` | Emulator suite alone |

**Verify** — these are exactly what CI runs, in this order

| Command | Description |
|---------|-------------|
| `npm run lint` | ESLint over JS and TS |
| `npm run format:check` | Prettier check (`npm run format` to fix) |
| `npm run typecheck` | `tsc --noEmit` over `src/` via JSDoc |
| `npm run build` | Production build to `dist/` |
| `npm test` | Unit + rules + functions |
| `npm run test:unit` | Unit lane only — fast, no emulator |
| `npm run test:rules` | Firestore rules against the emulator |
| `npm run test:functions` | Cloud Functions against the emulator |
| `npm run test:coverage` | Unit lane with a coverage report |
| `npm run test:coverage:functions` | Functions lane with coverage |

**Ship and operate**

| Command | Description |
|---------|-------------|
| `npm run deploy` | Build and deploy hosting (prefer merging to `main`) |
| `npm run deploy:preview` | Deploy to a 7-day preview channel |
| `npm run firebase:open` | Open the live site |
| `npm run clean` | Remove `dist/` |
| `npm run optimize:logo` | Re-run SVGO over the source logo |
| `npm run bootstrap:owner` | One-shot: grant the first `owner` claim |

Prefer merging to `main` over `npm run deploy`: the pipeline gates on the test
suite, a local deploy does not.

## Build Process

The project uses **Vite** for modern development tooling:

### Development Mode (`npm run dev`)
- Firebase emulators for Auth, Firestore, and Functions, wired automatically
  (see `src/infrastructure/emulator.js` — detection is env-based, never a
  hostname check, so a production build can never enter emulator mode)
- Instant server start with native ES modules
- Hot Module Replacement, without losing application state

### Production Build (`npm run build`)
- Automatic code splitting and tree-shaking
- Asset optimization and hashing
- Minification with Terser
- Source maps for debugging
- Output to `dist/` directory

### Environment Variables
- Vite natively loads `.env` files from project root
- Variables prefixed with `VITE_` are exposed to client code
- Access via `import.meta.env.VITE_*` in source files
- No build-time template injection needed

## Deployment

### Firebase Hosting

**Production**: https://salmoncow.com (also reachable at
https://salmoncow.web.app)

```bash
# Deploy to production
npm run deploy

# Deploy to preview channel (expires in 7 days)
npm run deploy:preview

# Open live site
npm run firebase:open
```

### Firebase CLI Setup

```bash
firebase login
firebase use salmoncow
```

### Hosting Features

- Global CDN with automatic HTTPS
- Static assets cached for 1 year
- HTML cached for 1 hour with revalidation
- Security headers (XSS protection, clickjacking prevention)
- SPA routing (all routes serve `index.html`)

## Type checking

`src/` is JavaScript, but its JSDoc is verified by TypeScript:

```bash
npm run typecheck
```

This also runs in CI as a step inside the `Run test suite` job. It is a step
rather than a job of its own on purpose — every job becomes its own required
status check, and adding one without updating the branch ruleset silently stops
gating on it.

Nothing is emitted; Vite still owns the build.

### Firebase modules and the SDK version

Firebase is loaded from the gstatic CDN and marked external in
`vite.config.js`, so it is never bundled — the browser fetches it at runtime.

**The version lives in exactly one file: `src/infrastructure/firebase-sdk.js`.**
Every Firebase import in `src/` comes from that module, which re-exports the
CDN entry points explicitly. Bumping the SDK is a one-file edit. It used to be
hard-coded in seven feature files, where missing one would have loaded two SDK
versions side by side in the same page.

`src/types/firebase-cdn.d.ts` maps those URLs onto the `firebase` package,
installed as a **devDependency for types only**.

Three things must stay in step, and
`tests/unit/firebase-sdk-version.test.js` asserts all three:

1. the CDN URLs in `firebase-sdk.js`,
2. the URLs declared in `firebase-cdn.d.ts`,
3. the exact `firebase` devDependency version.

The failure modes differ and are all silent: 1≠2 resurfaces as unresolved
modules; 2≠3 means type-checking against a different SDK than actually ships,
so the checker validates confidently against an API the browser does not have.
The devDependency is pinned exactly rather than with a caret, so a minor bump
cannot drift away from the runtime unnoticed.

Note `@firebase/rules-unit-testing` peers a matching major (`^12` for v5.x). If
a future SDK bump makes `npm ci` fail with `ERESOLVE`, that is the pairing to
check first.

### Staged strictness

`strict` is on, with two deliberate relaxations recorded in `tsconfig.json`:

- `noImplicitAny: false` — the codebase predates type checking and most
  parameters have no `@param`. Requiring them meant ~110 annotation-only edits
  with no behavioural benefit.
- `useUnknownInCatchVariables: false` — a dozen catch blocks read `err.code` /
  `err.message` from Firebase errors.

Everything that finds real mistakes stays on: property access, null safety, and
type mismatches. Enabling this the first time surfaced genuinely broken JSDoc —
`Result` and `User` were referenced in `@returns` but never imported, so those
annotations resolved to nothing.

To tighten later, flip `noImplicitAny` back on and work through the backlog
file by file; nothing else needs to change.

## Coverage

```bash
npm run test:coverage             # src/ via the unit lane
npm run test:coverage:functions   # functions/src/ (starts the emulator)
```

HTML reports land in `coverage/unit/` and `functions/coverage/` (both
gitignored). CI runs both and prints the summary; **nothing is enforced yet**.

### Baseline (2026-08-08)

| target | lines | notes |
|---|---:|---|
| `functions/src/` | **79.6%** | effectively at the §III.1 bar |
| `src/` | **17.9%** | 653 / 3640 lines |

Both configs set `all: true` deliberately. Without it, coverage only counts
files a test happens to import, so untested modules vanish from the report
instead of counting as 0% — which flatters the number badly here.

### What the baseline says

Well covered: `escape-html.js`, `error-reporter.js`, `remote-error-sink.js`
(96–97%), `theme.js` (91%), `firestore-user-profile-repository.js` (89%).

At **0%**: every web component, plus `auth.js`, `router.js`, `navigation.js`,
`admin-portal.js`, `user-portal.js`, `admin-user-service.js`, and the
infrastructure singletons.

Two gaps worth naming:

- **`role.js` is 0%.** It is the client-side authorization state machine, and
  §III.1 asks for 100% on auth paths. This is the single most valuable place to
  add tests.
- **`logClientError.ts` is 0%** despite having tests. Its suite exercises the
  Zod schema and asserts on source text, but never invokes the handler — a case
  where test *count* looked healthy and execution was zero. Coverage is what
  surfaced it.

### Why no thresholds

A gate at the constitution's ≥80% would fail on day one, and a gate that fails
on day one gets deleted. Measure, raise coverage where it matters, then ratchet
a threshold up behind the progress rather than ahead of it.

## Observability

### Error reporting

All client errors funnel through
[src/infrastructure/error-reporter.js](src/infrastructure/error-reporter.js).
`installGlobalHandlers()` runs first in `App.init()` and captures uncaught
exceptions and unhandled promise rejections; anything else calls
`reportError(error, { source })` directly.

The reporter never throws, never blocks, dedupes identical errors, and caps
reports per page session, so a component throwing every frame cannot flood.
Reports carry message, stack, source, route, timestamp, and explicit context
only — no email, displayName, or photoURL (constitution §III.2).

There are two sinks: the console (always), and a remote sink that ships reports
to the `logClientError` callable, which writes them to **Cloud Logging**.

#### Reading production errors

Cloud Logging → Logs Explorer, on project `salmoncow`:

```
jsonPayload.clientError = true
```

Useful fields: `clientMessage`, `clientStack`, `source`, `route`,
`clientSeverity`, `uid` (null unless the caller was signed in), and `context`.

To alert on them, build a log-based alert on that same filter — Logging →
Logs-based Metrics, then an alerting policy on the metric.

> The structured payload deliberately avoids a `message` key.
> `firebase-functions/logger` treats `message` as the entry's own log text and
> overwrites it, which silently destroyed the client's message until it was
> caught against the emulator. Use `clientMessage`.

#### If Cloud Logging goes quiet, check App Check first

App Check gates the callable, so anything that breaks attestation silently
stops all remote error reporting — and takes `setUserRole` with it.

The failure mode has no user-visible symptom: callables are never reached, and
the sink swallows the rejection by design. The tell is in the browser console:

```
@firebase/app-check: AppCheck: Requests throttled due to 403 error.
Attempts allowed again after 23h:59m:30s (appCheck/throttled).
```

After a 403 the SDK **throttles itself for 24 hours**, so a brief
misconfiguration causes a long outage, and fixing the cause does not clear the
throttle for browsers already in it (clearing site data does).

This happened once already: `https://www.google.com` was in `script-src` but
missing from `connect-src`, so reCAPTCHA Enterprise could load but not complete
its challenge. `tests/unit/csp-inline-script-hash.test.js` now pins the origins
App Check needs.

#### Coverage

The remote sink attaches once App Check has initialized, so remote coverage
begins from that point in the bootstrap sequence. Anything earlier is still
surfaced locally by the console sink and by the degraded-state banner — which is
why `renderBootstrapFailure()` is built to depend on nothing Firebase provides.

Practical consequence for triage: a quiet period in Cloud Logging is not by
itself proof that nothing failed. Read it alongside Hosting traffic and
Performance data.

The sink is off under the emulator by default, since local development produces
plenty of deliberate errors. Set `VITE_REMOTE_ERRORS=true` to exercise the real
path locally against the functions emulator.

### Performance Monitoring

[src/infrastructure/performance.js](src/infrastructure/performance.js)
initializes Firebase Performance in production (skipped under the emulator,
where local page loads would pollute production percentiles). This is what
makes the constitution §III.3 p95 targets — FCP, LCP, TTI, CLS — measurable
rather than aspirational. Data appears in Firebase Console → Performance,
typically within a few hours of first traffic.

Firebase **Analytics** is deliberately *not* enabled. Its SDK loads gtag from
`https://www.googletagmanager.com`, which would mean putting a documented
CSP-bypass origin back into `script-src` — the exact entry removed in `af76bae`
once it was found to be unused. `VITE_FIREBASE_MEASUREMENT_ID` is therefore
still inert config; leave it or remove it, but don't assume it does anything.

### Budget alert

A **$5/month** budget alert is configured on the billing account for this
project. Review or adjust it at GCP Console → **Billing** → **Budgets & alerts**
(Firebase Console → ⚙️ → **Usage and billing** → **Details & settings** links to
the same page).

$5 is a deliberately tight threshold rather than a spending limit. Blaze free
quotas should keep normal usage at or near $0, so any meaningful spend is a
signal that something is wrong — a runaway function, an abusive caller, a
query pattern gone quadratic — not that the project is growing.

Two things it does **not** cover, so it complements rather than replaces the
§VI.1 quota checks:

- It measures **spend, not quota consumption**, and billing data lags by hours.
  A burst that burns most of a daily free quota costs nothing and so triggers
  nothing.
- It is an **alert, not a cap**. Nothing stops spend automatically; the alert
  is a prompt to go look.

For faster signal on the Functions side, alert on the `logClientError` and
`setUserRole` invocation counts in Cloud Monitoring, which react in minutes
rather than hours.

## Rollback

Deploys to `main` are gated on the test suite (see
[.github/workflows/test-suite.yml](.github/workflows/test-suite.yml)), so a red
suite blocks a release. That does not help once something bad is already live.
The three surfaces roll back very differently, and only one of them is easy.

### Hosting — easy, one click

Firebase Console → Hosting → release history → **Rollback** on the previous
release. Takes about a minute and needs no repo change. Do this first for
anything visual or client-side; it buys time to fix forward calmly.

### Firestore rules — no one-click rollback

**This is the sharpest edge in the project.** The console shows previous
rulesets, but there is no restore button — recovering means deploying the old
rules again. A bad ruleset is live until you do.

```bash
git revert --no-edit <bad-commit>
git push origin main    # blocked on a direct push; open a PR (see below)
```

`main` is protected by a ruleset requiring a PR, so a revert goes through the
normal PR flow. Merging re-enters the gated path: `deploy-backend.yml` is
path-filtered on `firestore.rules`, so the revert triggers a redeploy
automatically once tests pass.

Before merging a rules revert, check whether the rules are *too permissive*
(leaking data) or *too strict* (locking users out). Too-permissive is an
incident — take the fastest correct path. Too-strict is visible but contained;
tests plus a preview verification are worth the extra few minutes.

### Cloud Functions — revert and redeploy

Same shape as rules: no console rollback. Revert the commit touching
`functions/**` and let `deploy-backend.yml` redeploy. Note that
`setUserRole` writes custom claims *before* mirroring to Firestore
(deliberately — it fails closed on revocation), so a mid-flight failure can
leave a claim set with no matching `users/{uid}.role`. Check the `audit`
collection to see which role changes actually committed.

### Escape hatch when CI itself is broken

The deploy workflows are gated on tests, and `workflow_dispatch` on
`deploy-backend.yml` is gated too — deliberately, so nobody routinely deploys
around the suite. If the suite is broken *and* you have a live incident, deploy
from a clean checkout of a known-good commit:

```bash
git checkout <known-good-sha>
npm ci && npm ci --prefix functions && npm run build --prefix functions
firebase deploy --only firestore:rules --project salmoncow
```

Prefer reverting on `main` over this — it keeps the deployed state and the repo
in agreement. A local deploy makes production diverge from `main`, which is its
own problem to clean up.

### After any rollback

1. Confirm the live behaviour is actually restored (not just that the deploy
   went green).
2. For rules, verify a real user write path still works — signing in and
   changing a theme preference exercises read, write, and the rules validators
   in one go.
3. Re-run `npm test` locally against the reverted tree so the regression is
   captured before fixing forward.

## Project Structure

```
├── src/                          # Vite root
│   ├── index.html                # Entry point (inline theme pre-paint script)
│   ├── main.js                   # Bootstrap and composition
│   ├── firebase-config.js        # Config from import.meta.env
│   ├── components/               # Web Components + co-located .css
│   ├── modules/                  # Controllers (auth, role, router, theme, …)
│   ├── services/                 # Application layer
│   ├── repositories/             # Data access (interface + Firestore impl)
│   ├── factories/                # Composition seam
│   ├── infrastructure/           # Firebase SDK, App Check, errors, performance
│   ├── types/                    # JSDoc typedefs + CDN module declarations
│   ├── utils/                    # Shared helpers (escaping, URL safety)
│   ├── styles/main.css           # Global tokens
│   └── assets/                   # Images, navigation.css
│
├── functions/                    # Cloud Functions (TypeScript, Node 22)
│   ├── src/                      # setUserRole, onUserCreate, logClientError
│   └── tests/
│
├── tests/
│   ├── unit/                     # Plain-node lane (no emulator)
│   └── rules/                    # Firestore rules against the emulator
│
├── scripts/bootstrap-owner.ts    # One-shot first-owner grant
├── .specs/                       # Constitution + archived feature specs
├── .github/workflows/            # CI/CD
├── firestore.rules               # Security rules
├── firebase.json                 # Hosting, headers/CSP, emulators, functions
├── eslint.config.mjs             # Lint config
└── .env.example                  # Environment template
```

Dependency direction is one-way: components and modules → services →
repositories → infrastructure. Nothing below reaches back up, and only
`src/infrastructure/firebase-sdk.js` imports the Firebase SDK.

## Firebase Configuration

### Environment Variables

Firebase config is loaded from `.env` via Vite's native environment variable support:
- **Configuration file**: `src/firebase-config.js`
- **Access pattern**: `import.meta.env.VITE_*`
- **Loading**: Automatic at build time and dev server startup

### Required Firebase Console Settings

1. **Authentication** — enable the Google sign-in provider
2. **Authorized Domains** — `*.web.app` is automatic; add any custom domain
3. **Support Email** — required for Google OAuth
4. **Firestore** — database created; rules and indexes deploy from this repo
5. **Cloud Functions** — requires the Blaze plan
6. **App Check** — register a reCAPTCHA Enterprise site key and set
   `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`; without it, protected callables reject
   in production
7. **First owner** — roles come from a custom claim, and the first one has to be
   granted out-of-band with `npm run bootstrap:owner`

## Architecture

Layered, with a one-way dependency direction:

- **`components/`** — Web Components. Presentation only; they render and emit
  events, and never talk to Firebase.
- **`modules/`** — controllers wiring components to services: `auth`, `role`
  (authorization state from the ID-token claim), `router` (hash routing with
  guards), `theme`, `navigation`, and the two portal controllers.
- **`services/`** — application logic: `user-profile` (with a 5-minute cache)
  and `admin-user`.
- **`repositories/`** — data access behind an interface, so callers never touch
  the Firestore SDK. This is the only path to `users/{uid}`, reads and live
  subscriptions alike.
- **`infrastructure/`** — Firebase singletons, App Check, error reporting,
  performance, emulator detection, and the single SDK version.
- **`main.js`** — composition root: builds the graph and wires it together.

Security is enforced server-side, never in the client. Firestore rules read the
`role` custom claim directly, and `setUserRole` re-checks the caller's claim.
Anything the UI hides is convenience, not a control.
