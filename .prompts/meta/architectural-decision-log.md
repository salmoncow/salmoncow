# Architectural Decision Log

**Purpose**: Historical record of architectural decisions made for this project
**Format**: Append new entries (newest first)
**Related**: See [architectural-evolution-strategy.md](./architectural-evolution-strategy.md) for decision frameworks

---

## How to Use This Log

### Adding Decisions

When making architectural changes, add an entry using this template:

```markdown
### YYYY-MM-DD: [Decision Title]

**Domains Affected**: [UI, Security, Data, Testing, Deployment, Monitoring, Cost, Platform]

**Current Phase** → **New Phase**:
- Domain 1: Phase X → Phase Y
- Domain 2: Phase X → Phase Y

**Decision**:
[What was decided]

**Rationale**:
[Why this decision was made]
- Pain point 1
- Pain point 2
- Trigger conditions met

**Alternatives Considered**:
- Option A: [reason for rejection]
- Option B: [reason for rejection]

**Success Criteria**:
- [ ] Metric 1: target
- [ ] Metric 2: target
- [ ] Review at: [date]

**Implementation Notes**:
[Any important details for future reference]

---
```

---

## Current Architectural State

**For current domain phases and metrics, see [.specs/constitution.md §II.1](../../.specs/constitution.md#ii1-current-state).**

The constitution is the single source of truth for current state. This log is an append-only historical record of decisions made.

---

## Decision Log Entries

### 2026-08-09: Production integrity review — phases 0–5

**Context.** The project had been dormant ~3 months and was live in production
while its documentation described a pre-launch prototype. A full review across
security, architecture, CI/CD, observability, and documentation produced a
five-phase remediation, executed as PRs #48–#65.

**Decisions and their triggers**

| Domain | Change | Trigger |
|---|---|---|
| Security | Field-level Firestore rules; DOM-based rendering | Stored-XSS chain reachable by any signed-in user |
| CI/CD | Deploys gated on the test suite | Deploy and test workflows ran in parallel; a red suite could not stop a release |
| Monitoring | Phase 1 → 2 | Site was live with zero error visibility; the trigger had fired unnoticed |
| Testing | Phase 1 → 2 | 79 → 229 tests; `role.js` 0% → 100% |
| Tooling | ESLint, Prettier, `checkJs`, coverage | No static analysis of any kind on ~4,600 lines |
| Stack | Firebase SDK 10.13.2 → 12.17.1, centralized | Test tooling peered `firebase@^11`; the SDK could not be installed for types |
| Architecture | RoleModule routed through the repository | §II.3 violation; duplicate `users/{uid}` read path and a stale-cache bug |

**Phases NOT advanced, and why**

- **UI → Lit**: 6 components against a 10-component trigger. Not met.
- **Data → optimized NoSQL**: still single-field queries; no composite indexes
  needed. Not met.
- **UI/E2E testing**: ruled out as disproportionate for this application. This
  is a standing decision, not a deferral.

**Constitution v2.0.0.** Cut 737 → 252 lines. The document had lost authority by
describing a project that no longer existed — pre-launch, zero users, manual
testing, CI as "future" — and 45 of its links were dead. Removed §VII
References (all 14 dead; that guidance became global skills), the spec-kit
restatement duplicated in CLAUDE.md, a Quick Reference that contradicted §II.1
on every count, and generic Firebase snippets. `.specs/technical/` was deleted
outright: three files frozen at 2026-01-29 containing another machine's
absolute paths and unfilled template placeholders, describing shipped work as
future. DEVELOPMENT.md covers that ground accurately.

**Lessons recorded in the constitution itself**

- Only `src/infrastructure/firebase-sdk.js` may import the Firebase SDK.
- A coverage gate set ahead of reality gets deleted; ratchet it behind progress.
- The repo is public: document mechanisms, never gaps.

### 2026-04-20: Adopt Blaze plan and advance Security to Phase 2 for multi-user RBAC

**Domains Affected**: Security, Cost, Data, Testing

**Current Phase** → **New Phase**:
- Security: Phase 1 (Basic Auth + Rules) → **Phase 2 (App Check + Custom Claims)**
- Cost: Phase 1 (Spark Free Tier) → **Blaze pay-as-you-go (within free quotas)**
- Data: Phase 1 (Simple Collections, no usage) → **Phase 1 (Simple Collections + Rules, in active use)**
- Testing: Phase 1 (Manual) → **Phase 1 + critical-path Phase 2 (rules + functions unit tests)**

**Decision**:
Upgrade the Firebase project to the Blaze plan and implement three-role RBAC
(`owner` / `admin` / `user`) using Firebase Auth custom claims as the primary
security signal, a Firestore `users/{uid}` mirror as the source of truth for
the admin UI, and a callable Cloud Function as the sole writer of the `role`
claim. App Check (reCAPTCHA Enterprise) enforced on the callable in prod.

**Rationale**:
- **Feature necessity**: the RBAC feature (approved spec
  `.specs/features/001-multi-user-rbac/spec.md`) requires server-side writes
  via `setCustomUserClaims`, which is Admin-SDK-only and therefore Blaze-only.
  No workaround preserves the security model on Spark.
- **Security Phase 2 triggers met**: custom claims are now in use; App Check
  is wired; rules are exercised under the emulator with a full permission
  matrix; 55 unit tests cover the critical path.
- **Cost impact**: Blaze preserves the same monthly free quotas. At hobby
  scale the project will stay at $0/month; overages (if any) cost pennies
  per thousand reads/writes. The security gain outweighs the billing risk.
- **Dev/prod parity**: adopted emulator-only local dev (Firestore emulator
  via `npm run dev` with import/export-on-exit) so rules and triggers are
  exercised on every save.

**Alternatives Considered**:
1. **Stay on Spark, roles in Firestore only (no custom claims)**:
   - Rejected: would force `get()` calls in every rule (1 read per check,
     free tier impact), weaker perf, and every role change would happen via
     a downloaded service-account key script rather than an in-app portal.
2. **Upgrade to Blaze later, after launch**:
   - Rejected: the RBAC feature has concrete near-term value for learning
     Firebase, and the upgrade has zero cost at current usage.
3. **Per-user role stored as a Firestore field only, enforced client-side**:
   - Rejected outright: violates constitution §III.2 (server-side authz on
     every protected op) — clients would be the security boundary.

**Success Criteria**:
- [x] All 20 acceptance criteria in the RBAC feature spec validated (via
      unit tests + emulator E2E)
- [x] Owner claim + Firestore mirror stay in sync (audit entry per change)
- [x] No client path writes the `role` field (rules + defense-in-depth
      strip in FirestoreUserProfileRepository)
- [ ] Preview-channel E2E still to run (Group 10 of the rollout)
- [ ] Post-launch: monitor Firestore + Functions usage weekly for the first
      month; alert at 70% of any Blaze free quota
- [ ] Next quarterly review: 2026-07-20

**Implementation Notes**:
- 11-group commit sequence on branch `feat/multi-user-rbac`
- 55 unit tests (41 rules + 14 functions) run via `firebase emulators:exec`
- Local dev moved to emulator-only (`npm run dev` boots Auth + Firestore +
  Functions with state import/export to `.emulator-data/`)
- Bootstrap runbook at `.specs/features/001-multi-user-rbac/bootstrap.md`
- One known emulator caveat documented: `enforceAppCheck` relaxed under
  `FUNCTIONS_EMULATOR` env var because the emulator doesn't mock the
  App Check token exchange. Production enforcement unchanged. A separate
  task (spawned 2026-04-20) captures this pattern in the `firebase-testing`
  skill for reuse.

**Review Date**: 2026-07-20 (quarterly review)

---

### 2025-12-09: Establish Progressive Architecture Strategy

**Domains Affected**: All

**Current Phase** → **New Phase**:
- All domains: Undefined → Phase 1 (defined starting points)

**Decision**:
Adopt a progressive, AI-friendly architectural evolution strategy across all domains. Start with minimal complexity (vanilla JS, Firebase-only, manual processes) and evolve deliberately based on measured triggers.

**Rationale**:
- **Platform Simplification**: Minimize operational overhead by consolidating on Firebase + GitHub (2 platforms total)
- **Progressive Complexity**: Avoid over-engineering at MVP stage; add complexity only when pain justifies it
- **AI-Assisted Evolution**: Choose technologies (Web Components, Firebase) that support high-quality AI-assisted migrations
- **Flexibility**: Maintain clear migration paths to Lit and React if project scales
- **Cost Management**: Stay within Firebase free tier as long as possible

**Specific Component Strategy**:
- Start with Vanilla Web Components for UI reusability
- Enables component reusability without framework overhead
- Natural migration path: Vanilla WC → Lit (95% AI-assisted) → React (80% AI-assisted)
- Solves immediate need (auth loading flash) while maintaining flexibility

**Alternatives Considered**:
1. **React from start**:
   - Rejected: Over-engineering for MVP with <5 components
   - Would add framework overhead and complexity prematurely
   - Migration from React is harder than migration to React

2. **Template Functions (Vanilla)**:
   - Rejected: Less reusable than Web Components
   - More verbose for component reuse
   - Harder migration path to Lit/React

3. **No component strategy**:
   - Rejected: Leads to code duplication and inconsistent patterns
   - Harder to maintain as project grows

4. **Multiple platforms** (e.g., Firebase + AWS + Vercel):
   - Rejected: Operational overhead of managing multiple platforms
   - Conflicts with platform simplification principle

**Success Criteria**:
- [ ] Stay within Firebase free tier for 6 months
- [ ] Zero platform additions for 6 months (unless Firebase insufficient)
- [ ] Create 10+ reusable Web Components within 6 months
- [ ] Developer satisfaction ≥7/10 with chosen architecture
- [ ] Successful quarterly architectural reviews (next: 2026-03-09)
- [ ] If migration needed, AI-assisted migration ≥80% success rate

**Implementation Notes**:
- Created architectural-evolution-strategy.md for evergreen guidance
- Created architectural-decision-log.md (this file) for historical tracking
- Immediate next step: Implement Web Components for auth loading state
- Component directory structure: `/src/components/`
- Document components in `/src/components/README.md`

**Review Date**: 2026-03-09 (quarterly review)

---

## Future Decisions

Add new decision entries above this line.

Use the template provided at the top of this file.

---

## How Claude Should Use This Log

### For Current State Queries

```
User: "What phase are we in for UI components?"
Claude: Check architectural-decision-log.md → Current Architectural State table
Response: "Phase 1: Vanilla Web Components (as of last update)"
```

### For Evolution Recommendations

```
User: "Should we migrate to React?"
Claude:
1. Check decision log → Current: Phase 1 (Vanilla WC), ~3-4 components
2. Check strategy → Phase 1 → Phase 3 trigger: Need 50+ components
3. Response: "Not yet. Currently ~3-4 components, triggers require 50+."
4. Cite: architectural-evolution-strategy.md triggers for Phase 1 → Phase 3
```

### For Adding Decisions

```
User: "We're adding unit tests"
Claude:
1. Check strategy → Testing: Phase 1 → Phase 2 triggers
2. Verify triggers met (e.g., 10+ modules, production planned)
3. Add decision log entry using template
4. Update "Current Architectural State" table
5. Document decision rationale
```

### For Historical Context

```
User: "Why did we choose Web Components?"
Claude: Check architectural-decision-log.md → 2025-12-09 entry
Response: "Rationale: Platform simplification, AI-assisted migration path..."
```

---

## Notes

- **This log is append-only**: Never delete entries, only add new ones
- **Keep strategy evergreen**: Update architectural-evolution-strategy.md for frameworks, not this log
- **Update current state**: When decisions are made, update the Current Architectural State table
- **Review quarterly**: During quarterly reviews, assess if current phases still accurate
