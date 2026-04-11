# MANDATORY: Claude Code Context & Development Guidelines

⚠️ **CRITICAL INSTRUCTION FOR CLAUDE**:
Before ANY architectural, implementation, or design decision in this project:
1. **MUST** reference this file's decision framework below
2. **MUST** read appropriate `.prompts/` files for the task type
3. **MUST** assess if prompts provide COMPREHENSIVE guidance for the task
4. **MUST** flag prompt gaps rather than guessing or hallucinating guidance
5. **MUST** document which guidance files influenced the decision in your response
6. **MUST** apply established patterns consistently
7. **MUST** cite specific guidance sections when making architectural choices

🎯 **Non-Negotiable**: This guidance consultation is required for every development task - not optional.

⚠️ **PROMPT GAP PROTOCOL**: If prompts are insufficient for the task, follow `meta/prompt-gap-protocol.md` to flag gaps and recommend prompt creation BEFORE implementation.

---

This file provides essential context for Claude when working on software projects. **All detailed guidance is located in `./.prompts/` and must be referenced for architectural and development decisions.**

## How to Use This Framework

### 1. Always Consult Prompts First
Before making any architectural or implementation decisions, reference the appropriate files in `./.prompts/` for detailed guidance and best practices.

### 2. Prompt File Reference Map

**Core Principles (Platform-Agnostic):**

Architecture:
- `core/architecture/code-structure.md` - Universal architecture patterns and organization
- `core/architecture/modular-architecture-principles.md` - Right-sized modularity approaches
- `core/architecture/feature-extensibility.md` - Building systems that can grow and evolve

Development:
- `core/development/asset-reusability.md` - Resource management and DRY principles
- `.claude/skills/git-conventions/SKILL.md` - Git conventions (Conventional Commits, branch naming, PR structure)

Security & Testing:
- `core/security/security-principles.md` - Security patterns and defensive practices
- `core/testing/testing-principles.md` - Testing strategies and quality assurance

Operations:
- `core/operations/monitoring-principles.md` - Observability and performance tracking
- `core/operations/budget-principles.md` - Cost management and resilience patterns
- `core/operations/platform-simplification-principles.md` - Platform selection and simplification

**Firebase Implementation (Platform-Specific):**
- `platforms/firebase/firebase-best-practices.md` - Firebase SDK patterns and fundamentals
- `platforms/firebase/firebase-security.md` - Firestore rules, App Check, custom claims
- `platforms/firebase/firebase-testing.md` - Emulator usage, security rules testing
- `platforms/firebase/firebase-monitoring.md` - Performance Monitoring, Analytics, Cloud Logging

**Technical Specifications (Project-Specific):**
- `.specs/constitution.md` - Project constitutional spec (quality standards, tech stack, workflows)
- `.specs/technical/build-system.md` - Vite configuration and optimization
- `.specs/technical/cicd-pipeline.md` - GitHub Actions CI/CD workflows
- `.specs/technical/firebase-deployment.md` - Firebase Hosting deployment process

**Meta-Guidance:**
- `meta/architectural-evolution-strategy.md` - Strategic framework for evolving architecture across all domains
- `meta/architectural-decision-log.md` - Historical record of architectural decisions made
- `meta/prompt-maintenance.md` - Keeping prompt library current and accurate
- `meta/prompt-gap-protocol.md` - Detecting and handling insufficient prompt coverage
- `meta/speckit-integration-guide.md` - Spec-kit + prompts hybrid architecture documentation

## Decision Framework

### When to Reference Which Prompt

**Adding New Features** →
- `core/architecture/modular-architecture-principles.md` + `core/architecture/feature-extensibility.md`
- Then: `platforms/firebase/firebase-best-practices.md` for implementation

**Refactoring Code** →
- `core/architecture/code-structure.md` + `core/architecture/modular-architecture-principles.md`

**Working with Assets/Resources** →
- `core/development/asset-reusability.md` + `core/architecture/code-structure.md`

**Security Implementation** →
- `core/security/security-principles.md` (universal patterns)
- Then: `platforms/firebase/firebase-security.md` (Firebase implementation)

**Performance Optimization** →
- `core/operations/monitoring-principles.md` + `core/operations/budget-principles.md`
- Then: `platforms/firebase/firebase-monitoring.md` + `platforms/firebase/firebase-resilience.md`

**Testing Strategy** →
- `core/testing/testing-principles.md` (universal testing)
- Then: `platforms/firebase/firebase-testing.md` (Firebase emulator, rules testing)

**Deployment Planning** →
- `.specs/technical/cicd-pipeline.md` (GitHub Actions CI/CD workflows)
- `.specs/technical/firebase-deployment.md` (Firebase Hosting deployment process)

**Cost Management** →
- `core/operations/budget-principles.md` (universal FinOps)
- Then: `platforms/firebase/firebase-finops.md` + `platforms/firebase/firebase-resilience.md`

**Technology Selection** →
- `core/operations/platform-simplification-principles.md`
- `.specs/constitution.md` (approved technology stack, platform constraints)

**Architectural Evolution** →
- `meta/architectural-evolution-strategy.md` (framework for phase transitions)
- `meta/architectural-decision-log.md` (check current phase for each domain)
- Consult decision triggers before recommending phase transitions

**Version Control & Commits** →
- `.claude/skills/git-conventions/SKILL.md` (Conventional Commits, branch naming, PR structure)

**Build Tool Configuration** →
- `.specs/technical/build-system.md` (Vite setup, optimization, environment variables)
- `.specs/technical/firebase-deployment.md` (Firebase Hosting integration)

**Prompt Library Updates** →
- `meta/prompt-maintenance.md`

**Project Configuration & Constraints** →
- `.specs/constitution.md` (current phase, quality thresholds, technology stack, cost constraints)
- `.specs/technical/build-system.md` (Vite configuration and optimization)
- `.specs/technical/cicd-pipeline.md` (GitHub Actions workflows)
- `.specs/technical/firebase-deployment.md` (Firebase Hosting deployment)

**Architecture Review** →
- `.specs/constitution.md` §II.1 (current state, metrics - single source of truth)
- Delta-based review process (see below)

### Architecture Review Process

For periodic architecture reviews:
1. **Check what changed**: `git diff <last-review-commit>..HEAD --stat`
2. **Review changed files** against:
   - Constitution §II.3-4 (modularity, code structure)
   - Constitution §III.2 (security standards)
   - Constitution §IV.2 (forbidden patterns)
3. **Update constitution §II.1** if metrics changed (component count, module count, etc.)
4. **Add decision log entry** only if issues require architectural action
5. **Update "Last Architecture Review" date** in constitution §II.1

## Core Working Principles

1. **Reference First**: Always check relevant prompt files before making decisions
2. **Start Simple**: Follow the right-sized complexity principles from the prompts
3. **Document Decisions**: Reference which prompt files guided your approach
4. **Stay Consistent**: Follow patterns established in the prompt files
5. **Adapt Context**: Apply prompt guidance to the specific technology stack in use
6. **Git Quality**: Git conventions are enforced by `.claude/skills/git-conventions/SKILL.md`

## Workflow Integration

1. **Identify the Problem Type** (architecture, security, performance, etc.)
2. **Reference Appropriate Prompt File(s)** from `./.prompts/`
3. **Assess Prompt Coverage** - Is guidance comprehensive for this task?
   - If **YES**: Proceed to step 4
   - If **NO**: Follow `meta/prompt-gap-protocol.md` to flag gap and recommend prompt creation
4. **Apply Guidance** to the specific technology and context
5. **Document Which Prompts Influenced the Decision**
6. **Follow Through** with testing and validation as outlined in prompts

## Spec-Kit + Prompts Workflow

### When to Use Spec-Kit vs. .prompts/

**Use Spec-Kit (.specs/) for:**
- Project-specific constraints → `.specs/constitution.md`
- Feature requirements & planning → `.specs/features/`
- Technical configurations → `.specs/technical/`
- Implementation plans and work breakdown

**Use Prompts (.prompts/) for:**
- Foundational architectural patterns → `.prompts/core/architecture/`
- Universal security/testing principles → `.prompts/core/security/`, `.prompts/core/testing/`
- Firebase SDK implementation guidance → `.prompts/platforms/firebase/`
- Strategic frameworks → `.prompts/meta/architectural-evolution-strategy.md`

### Feature Development Workflow

1. **Consult Constitution**: Read `.specs/constitution.md` for project constraints
2. **Create Spec**: `/speckit-specify <feature-name>` (references constitutional constraints)
3. **Plan Implementation**: `/speckit-plan` (references `.prompts/core/*` patterns)
4. **Break Down Work**: `/speckit-tasks`
5. **Implement**: `/speckit-implement` (follows `.prompts/platforms/firebase/*` guidance)
6. **Document**: Commit with guidance references (constitutional + prompts)

### Architectural Evolution Workflow

1. **Check State**: `.prompts/meta/architectural-decision-log.md` (current phases)
2. **Evaluate Triggers**: `.prompts/meta/architectural-evolution-strategy.md` (decision triggers)
3. **If Triggers Met**: `/speckit-specify architectural-evolution-<domain>` → Update decision log + constitution
4. **If Triggers NOT Met**: Stay in current phase, cite unmet triggers

### Spec-Kit Commands

- **`/speckit-constitution`** - View project constitutional spec
- **`/speckit-specify <feature>`** - Create feature requirement specification
- **`/speckit-plan`** - Design technical implementation plan
- **`/speckit-tasks`** - Break down into actionable tasks
- **`/speckit-implement`** - Execute implementation with validation

**See also**: `.prompts/meta/speckit-integration-guide.md` for complete integration documentation

---

## Session Initialization Protocol

At the start of each development session, Claude must:
- [ ] Acknowledge this guidance framework is active and mandatory
- [ ] Confirm understanding of the decision mapping above
- [ ] Understand the prompt gap protocol (`meta/prompt-gap-protocol.md`)
- [ ] Understand spec-kit integration (`.prompts/meta/speckit-integration-guide.md`)
- [ ] Reference appropriate guidance files before making architectural decisions
- [ ] Assess prompt coverage and flag gaps when detected
- [ ] Document guidance citations in all responses involving design choices
- [ ] Git conventions enforced by `.claude/skills/git-conventions/SKILL.md` (conventional commits, branch naming, PR structure)

## Response Documentation Template

For any architectural or implementation decision, include:

```markdown
**Guidance References:**
- `filename.md` (lines X-Y) - Specific principle applied
- Decision rationale based on documented patterns

**Patterns Applied:**
- Pattern name and implementation approach
```

## Common Commands

This section provides quick reference for frequently-used commands in this project.

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR at http://localhost:3000 |
| `npm run build` | Create production build in `dist/` directory |
| `npm run preview` | Preview production build locally |
| `npm run clean` | Remove `dist/` directory |

### Deployment Commands

| Command | Description |
|---------|-------------|
| `npm run deploy` | Build and deploy to Firebase production |
| `npm run deploy:preview` | Deploy to Firebase preview channel (7-day expiry) |
| `firebase login` | Authenticate with Firebase CLI |
| `firebase use salmoncow` | Switch to salmoncow project |
| `firebase open hosting:site` | Open live site in browser |

### Git Workflow

Git conventions (branch naming, commit messages, PR structure) are enforced by the project skill at `.claude/skills/git-conventions/SKILL.md`. See that file for the full reference.

---

The detailed principles, patterns, and best practices are maintained in the `./.prompts/` directory and `.claude/skills/` directory. This file serves as both a navigation guide and a mandatory protocol for consistent development practices.