<p align="center">
  <img src="src/assets/images/branding/logo.svg" alt="Salmoncow Logo" width="200">
</p>

# Salmoncow

[![Test](https://github.com/salmoncow/salmoncow/actions/workflows/test.yml/badge.svg)](https://github.com/salmoncow/salmoncow/actions/workflows/test.yml)

A small single-page application built on Firebase, used as a working sandbox for
modern web practices without a UI framework.

## Purpose

A lightweight but real application — it runs in production — for exploring:

- Firebase Authentication with Google sign-in
- Role-based access control via custom claims, enforced in Firestore Security
  Rules and a Cloud Functions callable
- Firestore as the source of truth, behind a repository layer
- Vanilla Web Components and modular JavaScript, no framework
- Firebase Hosting, App Check, and a gated CI/CD pipeline

## Live Site

**Production**: https://salmoncow.com

## Tech Stack

| Area | Choice |
|---|---|
| Build | Vite 7 |
| Language | Vanilla ES2022 modules, type-checked via JSDoc |
| UI | Native Web Components, plain CSS with custom properties |
| Auth | Firebase Authentication (Google) |
| Data | Cloud Firestore + Security Rules |
| Server | Cloud Functions (TypeScript, Node 22) |
| Abuse control | Firebase App Check (reCAPTCHA Enterprise) |
| Observability | Firebase Performance + client errors to Cloud Logging |
| CI/CD | GitHub Actions; deploys gated on the test suite |

## Quick Start

**Prerequisites**: Node 24 (see `.nvmrc`), Java 21 (the Firestore emulator needs
a JVM), and the Firebase CLI.

```bash
npm install
cp .env.example .env   # fill in your Firebase web config
npm run dev
```

`npm run dev` starts the **Firebase emulator suite** (Auth, Firestore,
Functions) and Vite together, so local development never touches production
data. It serves at http://localhost:3000.

For Vite on its own, without emulators:

```bash
npm run dev:app
```

## Tests

```bash
npm test          # unit + Firestore rules + Cloud Functions
npm run test:unit # fastest lane, no emulator required
```

The rules and functions lanes start emulators themselves, so Java must be
installed.

## Checks

The same gate CI runs, in the same order:

```bash
npm run lint && npm run format:check && npm run typecheck && npm run build && npm test
```

## Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** — setup, type checking, coverage,
  observability, and rollback procedures
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — git conventions and workflow
- **[.specs/constitution.md](.specs/constitution.md)** — project constraints and
  current architectural phase

## License

Apache 2.0
