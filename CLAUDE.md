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
- `core/development/git-best-practices.md` - Git workflows, commit conventions, branching strategies

Security & Testing:
- `core/security/security-principles.md` - Security patterns and defensive practices
- `core/testing/testing-principles.md` - Testing strategies and quality assurance

Deployment & Operations:
- `core/deployment/deployment-principles.md` - CI/CD patterns and deployment strategies
- `core/operations/monitoring-principles.md` - Observability and performance tracking
- `core/operations/budget-principles.md` - Cost management and resilience patterns
- `core/operations/platform-simplification-principles.md` - Platform selection and simplification

**Firebase Implementation (Platform-Specific):**
- `platforms/firebase/firebase-best-practices.md` - Firebase SDK patterns and fundamentals
- `platforms/firebase/firebase-security.md` - Firestore rules, App Check, custom claims
- `platforms/firebase/firebase-testing.md` - Emulator usage, security rules testing
- `platforms/firebase/firebase-deployment.md` - GitHub Actions, Hosting, Functions deployment
- `platforms/firebase/firebase-monitoring.md` - Performance Monitoring, Analytics, Cloud Logging
- `platforms/firebase/firebase-finops.md` - Free tier maximization and cost optimization
- `platforms/firebase/firebase-resilience.md` - Error handling, retry patterns
- `platforms/firebase/firebase-platform-guide.md` - Firebase + GitHub strategy

**Meta-Guidance:**
- `meta/prompt-maintenance.md` - Keeping prompt library current and accurate
- `meta/prompt-gap-protocol.md` - Detecting and handling insufficient prompt coverage

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
- `core/deployment/deployment-principles.md` (CI/CD patterns)
- Then: `platforms/firebase/firebase-deployment.md` (GitHub Actions setup)

**Cost Management** →
- `core/operations/budget-principles.md` (universal FinOps)
- Then: `platforms/firebase/firebase-finops.md` + `platforms/firebase/firebase-resilience.md`

**Technology Selection** →
- `core/operations/platform-simplification-principles.md`
- Then: `platforms/firebase/firebase-platform-guide.md` for Firebase strategy

**Version Control & Commits** →
- `core/development/git-best-practices.md`

**Prompt Library Updates** →
- `meta/prompt-maintenance.md`

## Core Working Principles

1. **Reference First**: Always check relevant prompt files before making decisions
2. **Start Simple**: Follow the right-sized complexity principles from the prompts
3. **Document Decisions**: Reference which prompt files guided your approach
4. **Stay Consistent**: Follow patterns established in the prompt files
5. **Adapt Context**: Apply prompt guidance to the specific technology stack in use

## Workflow Integration

1. **Identify the Problem Type** (architecture, security, performance, etc.)
2. **Reference Appropriate Prompt File(s)** from `./.prompts/`
3. **Assess Prompt Coverage** - Is guidance comprehensive for this task?
   - If **YES**: Proceed to step 4
   - If **NO**: Follow `meta/prompt-gap-protocol.md` to flag gap and recommend prompt creation
4. **Apply Guidance** to the specific technology and context
5. **Document Which Prompts Influenced the Decision**
6. **Follow Through** with testing and validation as outlined in prompts

## Session Initialization Protocol

At the start of each development session, Claude must:
- [ ] Acknowledge this guidance framework is active and mandatory
- [ ] Confirm understanding of the decision mapping above
- [ ] Understand the prompt gap protocol (`meta/prompt-gap-protocol.md`)
- [ ] Reference appropriate guidance files before making architectural decisions
- [ ] Assess prompt coverage and flag gaps when detected
- [ ] Document guidance citations in all responses involving design choices

## Response Documentation Template

For any architectural or implementation decision, include:

```markdown
**Guidance References:**
- `filename.md` (lines X-Y) - Specific principle applied
- Decision rationale based on documented patterns

**Patterns Applied:**
- Pattern name and implementation approach
```

## Available Commands

### `/commit` - Create Git Commit
Quickly create a git commit for recent changes following project best practices.

**Usage:** `/commit`

**What it does:**
1. Reviews current changes (`git status`, `git diff`)
2. Analyzes commit history for style consistency
3. Drafts a commit message following `core/development/git-best-practices.md`
4. Stages relevant files and creates commit
5. Includes Claude Code co-authorship attribution

**Requirements:**
- Follows conventional commits format
- Verifies no sensitive files are committed
- Cites guidance prompts that influenced changes
- Uses heredoc format for proper message formatting

**Note:** Does NOT push to remote unless explicitly requested.

### `/push` - Push to Remote
Push current branch to remote repository following git best practices.

**Usage:** `/push`

**What it does:**
1. Verifies working tree is clean
2. Checks current branch and upstream tracking
3. Warns if pushing to main/master (should use PRs)
4. Uses `git push -u origin <branch>` for first push
5. Uses `git push` for subsequent pushes
6. Provides PR creation link after successful push

**Safety features:**
- NEVER force pushes without explicit confirmation
- Warns before pushing to protected branches
- Checks for uncommitted changes
- Handles non-fast-forward scenarios

**Note:** Follow `core/development/git-best-practices.md` - use PRs for main/master.

---

The detailed principles, patterns, and best practices are all maintained in the `./.prompts/` directory. This file serves as both a navigation guide and a mandatory protocol for consistent development practices.