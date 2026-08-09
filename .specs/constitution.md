# Project Constitution: Salmoncow

**Version:** 2.0.0
**Last Updated:** 2026-08-09
**Last Architecture Review:** 2026-08-09
**Review Frequency:** Quarterly (next: 2026-11-09)

This document holds the constraints that are specific to **this** project:
current architectural phase, quality thresholds, cost limits, and the patterns
that are off the table.

It deliberately does not restate general engineering guidance. Foundational
patterns for architecture, security, testing, operations, and Firebase come from
the global skills described in [CLAUDE.md](../CLAUDE.md), which load by task
context and are not checked into this repo. Operational procedure — setup,
build, type checking, coverage, observability, rollback — lives in
[DEVELOPMENT.md](../DEVELOPMENT.md).

---

## I. Core Principles

### I.1 Progressive Complexity

Start simple; add complexity only when justified by measurable pain.

- Follow phase-based evolution, never skipping a phase.
- Measure before evolving. If a trigger in §II.2 is unmet, stay put and say why.
- Prefer the boring option. A gate that fails on day one gets deleted rather
  than fixed.

### I.2 Platform Simplification

**Maximum 2–3 platforms. Currently 2: Firebase and GitHub.**

Adding a third requires explicit justification, a documented evaluation of
extending the existing two first, and a decision-log entry.

This constraint has already had teeth: error reporting goes to Cloud Logging via
a Cloud Function rather than a third-party APM, because that keeps the count
at two.

---

## II. Architectural Standards

### II.1 Current State

| Domain | Phase | Notes |
|---|---|---|
| UI Components | 1: Vanilla Web Components | 6 components; Lit at 10+ (§II.2) |
| Security | 2: App Check + custom claims | App Check **enforced** on Firestore and callables; rules validate field shape and types |
| Data | 1: Simple collections + rules | Single-field queries only; no composite indexes |
| Testing | 2: Automated | 229 tests across unit, rules, and functions lanes |
| Deployment | 2: GitHub Actions | Deploys gated on the test suite |
| Monitoring | 2: Performance + error reporting | Client errors reach Cloud Logging |
| Cost | Blaze, within free quotas | $5/month budget alert configured |
| Platform | 2 (Firebase + GitHub) | Maintain at 2 |

**Metrics (2026-08-09)**

- **Live in production** at salmoncow.com
- Components: 6 · Modules: 8 · Services: 2 · Repositories: 1 + interface
- Infrastructure: 6 · Cloud Functions: 3 · Routes: 3
- Tests: 229 (129 unit / 63 rules / 37 functions)
- Coverage: `src/` ~27%, `functions/src/` ~80%
- Team size: 1

### II.2 Evolution Triggers

Do not advance a phase until the trigger is met. If it is not, record which
part is unmet.

| Transition | Trigger |
|---|---|
| UI → Lit | 10+ components **and** 3+ concrete pain points |
| Data → optimized NoSQL | Composite queries needed, or read volume near quota |
| Monitoring → alerting | A production incident that log inspection missed |

### II.3 Modularity Requirements

1. **Single responsibility** per module.
2. **Dependency direction is one-way**: components and modules → services →
   repositories → infrastructure. Never the reverse.
3. **Module size**: target under 500 lines; split above 750.

**Forbidden:**

- God modules (>500 lines with multiple responsibilities)
- Circular dependencies
- **Direct infrastructure dependencies in application code.** Only
  `src/infrastructure/firebase-sdk.js` may import the Firebase SDK; everything
  else goes through a repository or infrastructure module. This was violated
  once and cost a duplicate `users/{uid}` read path plus a stale-cache bug.
- Premature abstraction before three real use cases

### II.4 Layout

```
src/components/      Web Components + co-located .css
src/modules/         Controllers
src/services/        Application logic
src/repositories/    Data access behind an interface
src/factories/       Composition seam
src/infrastructure/  Firebase, App Check, errors, performance
src/utils/           Shared helpers
```

---

## III. Quality Standards

### III.1 Testing

- **All tests must pass before merge to main.** Enforced: both deploy workflows
  depend on the test suite, and `main` requires those checks.
- **100% coverage on authorization paths.** `role.js` is at 100% and must stay
  there.
- **≥80% overall** is the direction of travel, not a gate. `src/` is ~27%;
  coverage is reported in CI but not enforced, and a threshold should be
  ratcheted up behind real progress rather than set ahead of it.
- Security tests are required for anything touching auth or rules.

There is deliberately **no UI, component, or E2E testing**, and no test-pyramid
ratio target. Both were judged overkill for this application; do not reintroduce
them without a concrete regression that reached production.

### III.2 Security

- Validate input at **every** boundary, client and server.
- **Never** trust client-side auth state, and never rely on UI restrictions for
  authorization. Anything the UI hides is convenience.
- Server-side authorization on every protected operation.
- Escape all interpolated values, and never re-inject a decoded attribute into
  `innerHTML` — that specific mistake produced a stored-XSS chain.
- Firestore rules validate field **sets, types, and sizes**, not just ownership.
- Rules tested in the emulator before deploy.
- No secrets in client code. App Check enforced on Firestore and on every
  role-mutating callable. Enforcement is a service-level setting, not a
  `request.app` rule — the emulator cannot populate `request.app`, so such a
  rule would be untestable, and rules cannot be rolled back quickly.
- Minimize PII: error reports carry message, stack, source, route, and uid only.

### III.3 Performance

Measured by Firebase Performance in production:

| Metric | Target (p95) |
|---|---|
| FCP | < 1.5 s |
| LCP | < 2.5 s |
| TTI | < 5 s |
| CLS | < 0.1 |

### III.4 Code Quality

- All changes via pull request; no direct commits to `main` (enforced by
  ruleset).
- CI gate, in order: lint → format → typecheck → build → tests.
- Conventional Commits; see the `git-conventions` skill.
- Comments explain **why**, not what.

---

## IV. Technology Standards

### IV.1 Approved Stack

| Area | Choice |
|---|---|
| Build | Vite 7 |
| Language | Vanilla ES2022 modules, type-checked via JSDoc |
| UI | Native Web Components, plain CSS |
| Backend | Firebase: Auth, Firestore, Functions (TS, Node 22), Hosting, App Check |
| Firebase SDK | **12.17.1**, pinned in `src/infrastructure/firebase-sdk.js` |
| Node | 24 at the root, 22 in `functions/` — deliberately different |
| CI/CD | GitHub Actions |

### IV.2 Forbidden Patterns

**Firebase**

- `getDocs()` without a limit
- `onSnapshot()` without cleanup
- Client-side filtering in place of a query — and if filtering client-side is
  unavoidable, the UI must say so rather than imply completeness
- Unpaginated large reads; missing indexes for composite queries

**Architecture**

- The §II.3 forbidden list
- Skipping architectural phases

**Process**

- Committing secrets
- Force-pushing `main`
- Deploying around the test gate (`npm run deploy` bypasses it; prefer merging)
- Documenting gaps, absent controls, or blind spots in this **public** repo —
  describe mechanisms, never weaknesses

---

## V. Cost Constraints

**Plan:** Blaze (pay-as-you-go), on the same free quotas as Spark; billed only
on overage.

**Free quotas:** Firestore 50k reads / 20k writes / 20k deletes per day, 1 GiB
storage · Hosting 10 GiB storage, 360 MB/day transfer · Functions 2M
invocations/month · Auth unlimited.

**Controls**

- A **$5/month budget alert** is configured. It measures *spend, not quota
  consumption*, and is an alert rather than a cap — a burst that exhausts a
  daily free quota costs nothing and triggers nothing.
- Investigate at 70% of any quota; optimize at 90%.
- Cache reads where sensible; paginate; batch writes.
- Service-account keys are never committed.

---

## VI. Maintenance

### VI.1 Amendment Process

- **Minor** (metrics, current state): edit directly, bump patch, update the date.
- **Major** (new or changed standards): add a decision-log entry, bump minor.
- **Breaking** (removed standards): decision-log entry plus migration plan, bump
  major.

### VI.2 Review

Quarterly, alongside an architecture review: refresh §II.1 metrics, check
whether any §II.2 trigger is now met, verify the Firebase quotas are unchanged,
and confirm this document still matches the code.

A constitution that describes a project that no longer exists stops being
consulted. Version 1.1.0 claimed pre-launch with zero users and manual testing
while the site was live with automated CI — which is exactly how it lost its
authority.

---

**Version history**

- 1.0.0 (2025-12-11): Initial spec.
- 1.1.0 (2026-04-20): Security to Phase 2; Spark → Blaze.
- 2.0.0 (2026-08-09): Cut from 737 lines to project-specific constraints.
  Removed §VII References (all 14 links dead — that guidance moved to global
  skills), the spec-kit workflow restatement duplicated in CLAUDE.md, the
  Quick Reference that contradicted §II.1 on every count, and the generic
  Firebase snippets. Corrected the phase table, metrics, and stack to match a
  live, tested, CI-gated project. See the architectural decision log.
