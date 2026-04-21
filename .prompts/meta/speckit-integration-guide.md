# Spec-Kit Integration Guide

**Status**: Meta-Guidance
**Created**: 2025-12-11
**Purpose**: Document the integration between spec-kit (project specifications) and `.prompts/` (foundational patterns)

---

## Overview

This project uses a **hybrid guidance architecture** combining:
1. **Spec-Kit** (`.specs/`) - Project-specific, executable specifications
2. **Prompts** (`.prompts/`) - Foundational, universal patterns

**Philosophy**: Spec-kit defines **what this project must do**, prompts define **how good software is built**.

---

## I. System Architecture

### I.1 Clear Boundaries

**Spec-Kit (`.specs/`)** contains:
- ✅ Project-specific constraints (free tier limit, 2-platform max)
- ✅ Current architectural state (Phase 1 for all domains)
- ✅ Technology stack decisions (Vanilla WC, Firebase, Vite)
- ✅ Quality thresholds for THIS project (80% coverage, <3s load time)
- ✅ Per-feature specifications (requirements, plans, tasks)
- ✅ Technical configurations (Vite config, CI/CD workflows)

**Global Skills (`~/.claude/skills/`)** provides:
- ✅ Foundational architectural patterns (SOLID, modularity, DRY) — `software-architecture`
- ✅ Universal security principles (auth/authz, input validation) — `security-principles`
- ✅ Platform-agnostic best practices (testing pyramid, FinOps) — `testing-principles`, `operations-principles`
- ✅ Firebase implementation guidance (SDK patterns, security rules) — `firebase-*` skills
- ✅ Asset reusability and DRY principles — `asset-reusability`
- ✅ Git conventions — `git-conventions`

**Local Artifacts (`.prompts/meta/`)** contains:
- ✅ Strategic frameworks (architectural evolution, platform selection)

### I.2 File Structure

```
salmoncow/
├── .specs/                          # Spec-Kit (Project-Specific)
│   ├── constitution.md             # Constitutional spec (single source of truth)
│   ├── technical/
│   │   ├── build-system.md        # Vite configuration
│   │   ├── cicd-pipeline.md       # GitHub Actions workflows
│   │   └── firebase-deployment.md # Firebase Hosting deployment
│   └── features/                   # Per-feature specifications (ephemeral)
│       └── <feature-name>.md      # Created via /speckit-specify
│
├── .prompts/                        # Project-Specific Meta-Guidance
│   └── meta/                       # Strategic frameworks and history
│       ├── architectural-evolution-strategy.md
│       ├── architectural-decision-log.md
│       └── speckit-integration-guide.md
│
├── ~/.claude/skills/                # Global Skills (auto-activated)
│   ├── software-architecture/      # SOLID, modularity, extensibility
│   ├── security-principles/        # Auth, data protection, API security
│   ├── testing-principles/         # Testing pyramid, strategies
│   ├── asset-reusability/          # Resource management, DRY
│   ├── operations-principles/      # Monitoring, budget, platform selection
│   ├── git-conventions/            # Conventional Commits, branch naming
│   ├── firebase-best-practices/    # SDK patterns, Firestore, Cloud Functions
│   ├── firebase-security/          # Security rules, App Check, custom claims
│   ├── firebase-testing/           # Emulator testing, rules testing
│   ├── firebase-monitoring/        # Performance, analytics, logging
│   └── firebase-cost-resilience/   # FinOps, resilience, offline support
│
├── .claude/commands/                # Spec-Kit Slash Commands
│   ├── speckit-constitution.md
│   ├── speckit-specify.md
│   ├── speckit-plan.md
│   ├── speckit-tasks.md
│   └── speckit-implement.md
│
└── CLAUDE.md                        # Entry point with decision framework
```

---

## II. When to Use What

### II.1 Decision Tree

**Starting a new feature?**
→ `/speckit-specify` (creates `.specs/features/<feature>.md`)
→ References constitution + prompts

**Checking project constraints?**
→ `/speckit-constitution` (reads `.specs/constitution.md`)

**Understanding architectural patterns?**
→ Global skills auto-activate (`software-architecture`, `security-principles`, etc.)

**Implementing Firebase integration?**
→ Global skills auto-activate (`firebase-best-practices`, `firebase-security`, etc.)

**Wondering if you should evolve architecture?**
→ Read `.prompts/meta/architectural-evolution-strategy.md`
→ Check decision triggers
→ If triggers met: Create spec via `/speckit-specify`

**Need to understand Git workflow?**
→ `git-conventions` skill auto-activates

### II.2 Workflow Integration

**Feature Development Workflow**:
```
1. /speckit-constitution
   ↓ (read project constraints)
2. /speckit-specify <feature-name>
   ↓ (create requirement spec, references constitution + skills)
3. /speckit-plan
   ↓ (design implementation, skills auto-activate for relevant patterns)
4. /speckit-tasks
   ↓ (break down work)
5. /speckit-implement
   ↓ (execute, following constitutional constraints + skill guidance)
6. Git commit (conventional format from .claude/skills/git-conventions/SKILL.md)
7. Create PR (citing constitutional compliance + prompt references)
```

**Architectural Evolution Workflow**:
```
1. Read .prompts/meta/architectural-decision-log.md
   ↓ (check current phase)
2. Read .prompts/meta/architectural-evolution-strategy.md
   ↓ (check decision triggers)
3. If triggers met:
   a. /speckit-specify architectural-evolution-<domain>
   b. Document in architectural-decision-log.md
   c. Update .specs/constitution.md with new phase
4. If triggers NOT met:
   Stay in current phase, cite unmet triggers
```

---

## III. Cross-Reference Conventions

### III.1 In Constitutional Spec

**Pattern**: Distill project-specific constraints; global skills provide detailed patterns automatically

```markdown
## II.3 Modularity Requirements

**Principles** (from software-architecture skill):
1. Single Responsibility: Each module has one clear purpose
2. Clear Interfaces: Module contracts documented and stable
```

### III.2 In Feature Specs

**Pattern**: Cite constitutional section; skills provide patterns automatically

```markdown
## Architecture Approach

**Constitutional Constraints**: §II.3 Modularity Requirements

This feature follows single-responsibility principle (one service module).
Dependency direction: Component → Service → Firebase Infrastructure.
```

### III.3 In Git Commits

**Pattern**: Cite constitutional compliance

```markdown
git commit -m "feat: implement user profile data layer

Constitutional compliance:
- §III.2: Input validation on all boundaries
- §III.3: Firestore query uses limit(10)
- §VI.2: 1-hour cache TTL for free tier"
```

---

## IV. Content Organization Principles

### IV.1 What Belongs in Constitution

**Include**:
- Current architectural phase for each domain (UI, Security, Data, etc.)
- Project-specific quality thresholds (80% coverage, <3s load time)
- Technology stack decisions (Vanilla WC, Firebase, Vite, GitHub Actions)
- Forbidden patterns specific to this project (Firebase anti-patterns)
- Current team size, component count, module count (metrics)
- Cost constraints (Firebase free tier: 50K reads/day, 20K writes/day)

**Exclude**:
- Detailed implementation patterns (those live in global skills)
- Historical decisions (those go in architectural-decision-log.md)
- Universal principles (those live in global skills)

### IV.2 What Belongs in Global Skills

Global skills (`~/.claude/skills/`) contain foundational patterns applicable to any project: architecture, security, testing, operations, asset reusability, git conventions, and Firebase implementation guidance. Skills auto-activate based on task context.

**Exclude from skills**:
- Project-specific constraints (those go in constitution)
- Current architectural state (those go in constitution)
- Per-feature requirements (those go in .specs/features/)
- Project-specific configurations (those go in .specs/technical/)

### IV.3 What Belongs in Feature Specs

**Include** (per feature, ephemeral):
- User stories and acceptance criteria
- Feature-specific requirements
- Implementation plan referencing prompts
- Task breakdown
- Testing checklist

**Lifecycle**: Created in `.specs/features/<name>/` → Implemented → Moved to `.specs/archive/<name>/` after merge (archive is a peer of features/, not nested, so features/ stays portable across projects)

**Exclude**:
- Long-lived documentation (goes in README)
- Reusable patterns (goes in prompts)
- Project constraints (goes in constitution)

---

## V. Avoiding Duplication

### V.1 Duplication Detection

**Quarterly Review** (with architectural review):
```bash
# Search for duplicate content
rg -i "single responsibility" .prompts/ .specs/
rg -i "test pyramid" .prompts/ .specs/

# Check for similar patterns
diff .specs/constitution.md .prompts/core/architecture/modular-architecture-principles.md
```

**If duplication found**:
1. Identify which is more specific (constitutional constraint vs. universal pattern)
2. Keep universal pattern in global skills
3. Distill project-specific constraint in constitution

### V.2 Duplication Prevention

Constitution should contain only project-specific constraints. Universal patterns live in global skills and auto-activate. If the constitution restates a universal pattern, replace it with a concise project-specific constraint that references the relevant skill concept.

```markdown
## Security Standards

Project-specific requirements (security-principles skill provides universal patterns):
- Firestore security rules tested in emulator BEFORE deployment
- App Check enabled for production (Phase 2)
```

---

## VI. Maintenance & Updates

### VI.1 Constitutional Spec Maintenance

**Frequency**: Quarterly (with architectural review)

**Update Triggers**:
- Architectural phase transition (e.g., UI Phase 1 → Phase 2)
- New technology adopted (e.g., TypeScript added)
- Quality thresholds changed (e.g., coverage target increased)
- Cost constraints changed (e.g., Firebase pricing update)

**Process**:
1. Update §II.1 Current Architectural State
2. Update version (increment minor: 1.0.0 → 1.1.0)
3. Update "Last Updated" date
4. Document change in architectural-decision-log.md

### VI.2 Skills Maintenance

**Frequency**: Bi-annual

**Update Triggers**:
- Firebase SDK version update (major version)
- GitHub Actions version update (v4 → v5)
- Node.js LTS version update
- Deprecated patterns discovered

**Process**:
1. Update technology versions in skill files (`~/.claude/skills/`)
2. Test examples still work
3. Foundational patterns rarely change

### VI.3 Feature Specs Lifecycle

**Created**: Via `/speckit-specify`
**Active**: During development
**Archived**: After feature merged to main

**Archive Process**:
```bash
# After feature merged — move to .specs/archive/ (peer of features/, not nested)
mkdir -p .specs/archive
git mv .specs/features/001-user-profile .specs/archive/001-user-profile
git commit -m "chore(specs): archive user-profile spec (feature completed)"
```

The archive is a peer of `features/` rather than nested inside it so that
`.specs/features/` stays portable: when copying `.specs/` to a new project
as scaffolding, leave `archive/` behind — it's this project's history, not
generic guidance.

---

## VII. Claude's Consultation Protocol

### VII.1 Consultation

**Before architectural or implementation decisions**:
1. Read `.specs/constitution.md` for project constraints
2. Global skills auto-activate to provide foundational patterns
3. Check `.prompts/meta/` for evolution strategy and decision history when relevant

**Priority Order**:
1. Constitutional spec (project-specific constraints take precedence)
2. Global skills (foundational patterns, auto-activated)
3. Meta artifacts (evolution strategy, decision log)

### VII.2 Gap Detection

**If guidance is insufficient**:
1. Flag the gap before proceeding
2. Identify gap type:
   - Constitutional gap? → update `.specs/constitution.md`
   - Skill gap? → propose new or updated global skill
   - Technical spec gap? → create `.specs/technical/` file
3. Recommend creation, then proceed

---

## VIII. Success Metrics

### VIII.1 Adoption Metrics (3 months)

- ✅ 100% of new features use `/speckit-specify` workflow
- ✅ 80%+ of commits cite constitutional compliance
- ✅ 100% of PRs include guidance references
- ✅ Zero features violate forbidden patterns

### VIII.2 Quality Metrics (6 months)

- ✅ Zero duplication detected between constitution and skills
- ✅ Constitutional spec updated quarterly (on schedule)
- ✅ Skills maintained bi-annually
- ✅ All architectural decisions reference decision triggers

### VIII.3 Long-Term Health (12 months)

- ✅ Hybrid system maintained with minimal friction
- ✅ Clear boundaries respected (no confusion about what goes where)
- ✅ Spec-kit natural part of workflow (not burdensome)
- ✅ Skills stay evergreen and relevant

---

## IX. Common Scenarios

### Scenario 1: Adding New Feature

**Question**: How do I start implementing user authentication?

**Answer**:
```
1. /speckit-constitution
   Read §II.1 (current phase: Security Phase 1 - Basic Auth + Rules)
   Read §III.2 (security standards: input validation, server-side checks)

2. /speckit-specify user-authentication
   Create feature spec at .specs/features/user-authentication.md
   Reference constitutional constraints (§II.1, §III.2)
   Skills auto-activate: security-principles, firebase-security

3. /speckit-plan
   Design implementation applying Firebase Auth patterns

4. /speckit-tasks
   Break down: Setup → Auth UI → Firebase integration → Security rules

5. /speckit-implement
   Execute following constitutional constraints + skill guidance
```

### Scenario 2: Evolving Architecture

**Question**: Should we migrate from Vanilla WC to Lit?

**Answer**:
```
1. Read .prompts/meta/architectural-decision-log.md
   Current: UI Phase 1 (Vanilla Web Components), ~3-4 components

2. Read .prompts/meta/architectural-evolution-strategy.md
   Check Phase 1 → Phase 2 triggers:
   - Requires 10+ components (currently 3-4) ❌
   - Requires 3+ pain points (manual state sync errors, etc.) ❌

3. Decision: NOT YET
   Triggers not met. Stay in Phase 1.
   Revisit when component count reaches 10.

4. Document non-decision
   No need to create spec or update decision log.
   Just cite unmet triggers.
```

### Scenario 3: Checking If Pattern Allowed

**Question**: Can I use client-side filtering for this Firestore query?

**Answer**:
```
1. Read .specs/constitution.md §IV.2 (Forbidden Patterns)
   ❌ Client-side filtering (use Firestore queries: where(), limit(), orderBy())

2. Decision: NO
   This is explicitly forbidden to preserve free tier.

3. Alternative:
   firebase-best-practices skill provides query patterns.
   Use Firestore query with where() clause instead.
```

### Scenario 4: Finding Implementation Guidance

**Question**: How do I implement caching for Firestore reads?

**Answer**:
```
1. Read .specs/constitution.md §VI.2 (Cost Optimization)
   Requirement: Implement caching before 70% of read limit
   Pattern: 1-hour TTL

2. firebase-cost-resilience skill provides caching patterns (Map + TTL)

3. Implement:
   Apply pattern from skill, respect TTL from constitution
```

---

## X. Troubleshooting

### Issue: Can't Find Guidance

**Symptom**: Unclear which file to consult

**Solution**:
1. Start with CLAUDE.md for project-specific context
2. Global skills auto-activate for foundational patterns
3. If still unclear, check this integration guide

### Issue: Conflicting Guidance

**Symptom**: Constitution says X, skill says Y

**Resolution**:
- Constitutional spec takes precedence (project-specific override)
- Skills provide default/recommended approach
- If constitutional spec contradicts universal best practice, that's intentional (document why in decision log)

### Issue: Gap in Guidance

**Symptom**: No clear guidance for the task

**Solution**:
1. Flag the gap before proceeding
2. Identify gap type (constitutional, skill, or technical spec)
3. Recommend creation
4. Proceed after gap is addressed

---

## XI. References

**Entry Points**:
- `/CLAUDE.md` — Project-specific context and commands
- `.specs/constitution.md` — Project constitutional spec
- `~/.claude/skills/` — Global skills (auto-activated)

**Slash Commands**:
- `/speckit-constitution` — View constitutional spec
- `/speckit-specify` — Create feature spec
- `/speckit-plan` — Design implementation
- `/speckit-tasks` — Break down work
- `/speckit-implement` — Execute

**Project Artifacts**:
- `.prompts/meta/architectural-evolution-strategy.md` — Evolution framework
- `.prompts/meta/architectural-decision-log.md` — Historical decisions

---

**Maintained By**: Project lead
**Review Frequency**: Quarterly (with architectural review)
**Last Review**: 2025-12-11
**Next Review**: 2026-03-11
