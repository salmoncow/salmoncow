# Claude Code Development Guidelines

## Foundational Guidance

Global skills (`~/.claude/skills/`) provide foundational patterns for architecture, security, testing, operations, Firebase implementation, and git conventions. These activate automatically based on task context — no manual consultation needed.

If you encounter a task where no skill or project artifact provides sufficient guidance, flag the gap before proceeding. Do not guess or hallucinate guidance.

---

## Project-Specific Artifacts

**Constitutional Spec (single source of truth):**
- `.specs/constitution.md` — Project constraints, current phase, quality thresholds, tech stack, cost limits

**Technical Specifications:**
- `.specs/technical/build-system.md` — Vite configuration and optimization
- `.specs/technical/cicd-pipeline.md` — GitHub Actions CI/CD workflows
- `.specs/technical/firebase-deployment.md` — Firebase Hosting deployment process

**Architectural History:**
- `.prompts/meta/architectural-evolution-strategy.md` — Framework for phase transitions and decision triggers
- `.prompts/meta/architectural-decision-log.md` — Historical record of architectural decisions

---

## Architecture Review Process

For periodic architecture reviews:
1. **Check what changed**: `git diff <last-review-commit>..HEAD --stat`
2. **Review changed files** against:
   - Constitution II.3-4 (modularity, code structure)
   - Constitution III.2 (security standards)
   - Constitution IV.2 (forbidden patterns)
3. **Update constitution II.1** if metrics changed (component count, module count, etc.)
4. **Add decision log entry** only if issues require architectural action
5. **Update "Last Architecture Review" date** in constitution II.1

---

## Spec-Kit Workflow

### When to Use Spec-Kit

**Use Spec-Kit (`.specs/`) for** project-specific constraints, feature requirements, technical configurations, and implementation plans.

### Feature Development Workflow

1. **Consult Constitution**: Read `.specs/constitution.md` for project constraints
2. **Create Spec**: `/speckit-specify <feature-name>`
3. **Plan Implementation**: `/speckit-plan`
4. **Break Down Work**: `/speckit-tasks`
5. **Implement**: `/speckit-implement`

### Architectural Evolution Workflow

1. **Check State**: `.prompts/meta/architectural-decision-log.md` (current phases)
2. **Evaluate Triggers**: `.prompts/meta/architectural-evolution-strategy.md` (decision triggers)
3. **If Triggers Met**: `/speckit-specify architectural-evolution-<domain>` then update decision log + constitution
4. **If Triggers NOT Met**: Stay in current phase, cite unmet triggers

### Spec-Kit Commands

| Command | Description |
|---------|-------------|
| `/speckit-constitution` | View project constitutional spec |
| `/speckit-specify <feature>` | Create feature requirement specification |
| `/speckit-plan` | Design technical implementation plan |
| `/speckit-tasks` | Break down into actionable tasks |
| `/speckit-implement` | Execute implementation with validation |

**See also**: `.prompts/meta/speckit-integration-guide.md` for complete integration documentation

---

## Common Commands

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR at http://localhost:3000 |
| `npm run build` | Create production build in `dist/` directory |
| `npm run preview` | Preview production build locally |
| `npm run clean` | Remove `dist/` directory |

### Deployment

| Command | Description |
|---------|-------------|
| `npm run deploy` | Build and deploy to Firebase production |
| `npm run deploy:preview` | Deploy to Firebase preview channel (7-day expiry) |
| `firebase login` | Authenticate with Firebase CLI |
| `firebase use salmoncow` | Switch to salmoncow project |
| `firebase open hosting:site` | Open live site in browser |

### Git

Git conventions (branch naming, commit messages, PR structure) are enforced by the `git-conventions` skill. See `.claude/skills/git-conventions/SKILL.md` for the full reference.
