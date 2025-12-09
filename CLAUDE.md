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
- `core/development/vite-best-practices.md` - Modern build tooling, HMR, environment variables, optimization

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
- `core/development/git-best-practices.md` (REQUIRED: conventional commits, PR descriptions, atomic commits)

**Build Tool Configuration** →
- `core/development/vite-best-practices.md` (Vite setup, optimization, environment variables)
- Then: `platforms/firebase/firebase-deployment.md` (Firebase Hosting integration)

**Prompt Library Updates** →
- `meta/prompt-maintenance.md`

## Core Working Principles

1. **Reference First**: Always check relevant prompt files before making decisions
2. **Start Simple**: Follow the right-sized complexity principles from the prompts
3. **Document Decisions**: Reference which prompt files guided your approach
4. **Stay Consistent**: Follow patterns established in the prompt files
5. **Adapt Context**: Apply prompt guidance to the specific technology stack in use
6. **Git Quality**: ALWAYS follow `core/development/git-best-practices.md` for commits and PRs
   - Use conventional commits format (feat:, fix:, docs:, etc.)
   - Break changes into atomic, logical commits
   - Write detailed PR descriptions with Summary, Changes, Testing sections
   - Include guidance references in commit messages

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

### Command Organization

Commands use prefixes for easy discovery and auto-completion:
- **`/git-*`** - Git operations (branch, commit, push, sync, cleanup)
- **`/gh-*`** - GitHub operations (pull requests, issues, releases)

💡 **Tip:** Type `/git-` or `/gh-` and press TAB to see all commands in that category.

---

### Git Commands

All git commands follow patterns from `core/development/git-best-practices.md`.

#### `/git-branch <name>` - Create New Branch
Create a feature branch from latest main following naming conventions.

**Usage:** `/git-branch feat/feature-name` or `/git-branch fix/bug-name #123`

**What it does:**
1. Validates branch name against conventions (lowercase, hyphens, valid type)
2. Blocks if uncommitted changes exist
3. Switches to main and pulls latest
4. Creates and switches to new branch
5. Parses and formats issue numbers automatically

**Examples:**
- `/git-branch feat/add-user-dashboard`
- `/git-branch fix/login-timeout-error #58`

**Next step:** Make changes, then `/git-commit`

---

#### `/git-commit` - Commit Changes
Create a git commit for recent changes following project best practices.

**Usage:** `/git-commit`

**What it does:**
1. Reviews current changes (`git status`, `git diff`)
2. Analyzes commit history for style consistency
3. Drafts commit message following conventional commits format
4. Stages relevant files and creates commit
5. Includes Claude Code co-authorship attribution

**Requirements:**
- Follows conventional commits format
- Verifies no sensitive files are committed
- Cites guidance prompts that influenced changes

**Next step:** `/git-push` to share your commits

---

#### `/git-push` - Push to Remote
Push current branch to remote repository following git best practices.

**Usage:** `/git-push`

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

**Next step:** `/gh-pr` to create pull request

---

#### `/git-sync` - Sync with Main
Update current branch with latest changes from main.

**Usage:** `/git-sync`

**What it does:**
1. Fetches latest from origin
2. Rebases current branch on origin/main
3. Handles conflicts with clear guidance
4. Shows updated commit status

**When to use:** When main branch has new commits you need to integrate

**Safety features:**
- Only works on feature branches, not main/master
- Blocks if uncommitted changes exist
- Provides conflict resolution instructions
- Uses rebase for cleaner history

**Note:** After sync, next push may require `--force-with-lease` (handled by `/git-push`)

---

#### `/git-cleanup` - Clean Up Branch
Clean up local branch after PR is merged.

**Usage:** `/git-cleanup`

**What it does:**
1. Stores current branch name
2. Verifies branch is merged to main (safety check)
3. Switches to main and pulls latest
4. Deletes local feature branch
5. Optionally deletes remote branch

**When to use:** After your PR is merged to main

**Safety features:**
- Blocks if on main/master
- Warns if branch has unmerged commits
- Warns if branch has unpushed commits
- Uses safe delete (`-d` not `-D`)
- Asks before deleting remote branch

**Next step:** Create new branch with `/git-branch`

---

### GitHub Commands

Commands using GitHub CLI (`gh`) for platform operations.

#### `/gh-pr` - Create Pull Request
Create a pull request for current branch using GitHub CLI.

**Usage:** `/gh-pr`

**What it does:**
1. Verifies `gh` CLI is installed and authenticated
2. Ensures branch is pushed to remote (offers to push if not)
3. Analyzes commits since branching from main
4. Drafts PR title following conventional commits format
5. Generates PR body with summary, changes, test plan
6. Creates PR using `gh pr create`
7. Displays PR URL and next steps

**PR Body includes:**
- Summary of changes and rationale
- Guidance references (which prompts influenced decisions)
- Test plan checklist
- Documentation updates if applicable

**Requirements:**
- GitHub CLI (`gh`) must be installed
- Branch must be pushed to remote
- Cannot create PR from main/master branch

**Next step:** Wait for PR review and approval, then `/git-cleanup` after merge

---

The detailed principles, patterns, and best practices are all maintained in the `./.prompts/` directory. This file serves as both a navigation guide and a mandatory protocol for consistent development practices.