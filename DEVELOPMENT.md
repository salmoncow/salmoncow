# Development Guide

## Prerequisites

- Node.js — see [Node version](#node-version) below
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
npm run dev
```

This starts the Vite development server with Hot Module Replacement (HMR) at http://localhost:3000

### Build Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build with Vite |
| `npm run preview` | Preview production build locally |
| `npm run clean` | Remove build output (`dist/`) |
| `npm run deploy` | Build and deploy to production |
| `npm run deploy:preview` | Build and deploy to preview channel |

## Build Process

The project uses **Vite** for modern development tooling:

### Development Mode (`npm run dev`)
- Instant server start with native ES modules
- Hot Module Replacement (HMR) for instant updates
- Fast refresh without losing application state
- On-demand compilation for fast iteration

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

**Production**: https://salmoncow.web.app

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

### Budget alerts (manual — requires billing permissions)

The project is on Blaze, and `setUserRole` is a publicly reachable callable.
Constitution §VI.1 wants alerts at 70% and 90% of quota, but the entire
cost-control program is currently "check the console every Monday". A budget
alert is the automated floor and cannot be set from this repo — it needs
billing-account access:

1. GCP Console → **Billing** → **Budgets & alerts** → **Create budget**
2. Scope to project `salmoncow`
3. Set a monthly amount you would want to know about (the free quotas make
   anything above a few dollars a signal that something is wrong, not growth)
4. Add threshold rules at **50%**, **70%**, and **90%** of actual spend
5. Set email recipients to the billing admin

Firebase Console → ⚙️ → **Usage and billing** → **Details & settings** links to
the same budgets page.

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
├── dist/                       # Build output (gitignored)
│   ├── index.html
│   └── assets/                 # Optimized assets with hashes
│       ├── js/                 # Minified JavaScript bundles
│       ├── styles/             # Optimized CSS
│       └── images/             # Optimized images
│
├── src/                        # Source files (Vite root)
│   ├── index.html              # HTML entry point
│   ├── main.js                 # JavaScript entry point
│   ├── firebase-config.js      # Firebase configuration
│   ├── modules/
│   │   ├── auth.js             # Authentication
│   │   ├── navigation.js       # Navigation bar
│   │   └── ui.js               # UI utilities
│   ├── styles/
│   │   ├── main.css            # Base styles
│   │   └── navigation.css      # Navigation styles
│   └── assets/
│       └── images/             # Source images
│           ├── branding/       # Logo and brand assets
│           └── placeholders/   # Default avatars, etc.
│
├── public/                     # Static assets (copied as-is)
│   └── assets/
│       └── images/
│           └── placeholders/   # Public static images
│
├── .prompts/                   # Development guidance
├── vite.config.js              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── firebase.json               # Hosting configuration
├── .firebaserc                 # Firebase project ID
├── .env                        # Environment variables (not committed)
└── .env.example                # Environment template
```

## Firebase Configuration

### Environment Variables

Firebase config is loaded from `.env` via Vite's native environment variable support:
- **Configuration file**: `src/firebase-config.js`
- **Access pattern**: `import.meta.env.VITE_*`
- **Loading**: Automatic at build time and dev server startup

### Required Firebase Console Settings

1. **Authentication**: Enable Google sign-in provider
2. **Authorized Domains**: Automatically configured for `*.web.app`
3. **Support Email**: Required for Google OAuth

## Architecture

The application uses modular JavaScript architecture:

- **`auth.js`** - Firebase Authentication integration
- **`navigation.js`** - Navigation bar and user dropdown
- **`ui.js`** - DOM manipulation and UI state
- **`main.js`** - Application orchestrator

New features can be added as modules without modifying existing code.
