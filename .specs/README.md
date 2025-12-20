# Spec-Kit: Project Specifications

Project-specific specifications, constraints, and technical configurations for the SalmonCow project.

**Note**: This directory works alongside **Prompts** (`.prompts/`) for a hybrid architecture:
- **Spec-Kit** (this directory) = Project-specific constraints, technical configurations, and feature specifications
- **Prompts** (`.prompts/`) = Foundational, universal patterns and best practices

See [Spec-Kit Integration Guide](../.prompts/meta/speckit-integration-guide.md) for complete documentation.

---

## Directory Structure

```
.specs/
├── constitution.md          # Project constitutional spec (single source of truth)
├── technical/               # Technical configurations
│   ├── build-system.md     # Vite configuration and optimization
│   ├── cicd-pipeline.md    # GitHub Actions CI/CD workflows
│   └── firebase-deployment.md  # Firebase Hosting deployment process
└── features/                # Per-feature specifications (ephemeral)
    └── <feature-name>.md   # Created via /speckit-specify
```

### Constitution

The **constitution.md** file is the single source of truth for:
- Core principles (progressive complexity, platform simplification, AI-assisted evolution)
- Current architectural state and phases for all domains (UI, Security, Data, Testing, etc.)
- Quality standards (testing coverage, security, performance, code quality)
- Technology stack decisions (approved technologies and forbidden patterns)
- Development workflows and cost constraints

**Always consult the constitution before starting new features or making architectural decisions.**

### Technical Specifications

Project-specific technical configurations:
- **build-system.md** - Vite configuration, environment variables, optimization settings
- **cicd-pipeline.md** - GitHub Actions workflows, deployment automation
- **firebase-deployment.md** - Firebase Hosting setup, deployment process, CDN configuration

### Feature Specifications

Ephemeral specifications for individual features, created via `/speckit-specify`:
- User stories and acceptance criteria
- Implementation plans referencing prompts
- Task breakdowns
- Testing checklists

**Lifecycle**: Created → Implemented → Archived to `features/archive/` after merge

---

## Available Commands

Use these slash commands to work with spec-kit:

| Command | Description |
|---------|-------------|
| `/speckit-constitution` | View project constitutional spec |
| `/speckit-specify <feature>` | Create feature requirement specification |
| `/speckit-plan` | Design technical implementation plan |
| `/speckit-tasks` | Break down feature into actionable tasks |
| `/speckit-implement` | Execute implementation with validation |

---

## Quick Start

### When to Use Spec-Kit vs. Prompts

**Use Spec-Kit (.specs/) for:**
- Checking project-specific constraints (free tier limits, platform restrictions)
- Understanding current architectural phase (Phase 1 vs Phase 2)
- Creating feature specifications and implementation plans
- Reviewing technical configurations (Vite, CI/CD, Firebase)

**Use Prompts (.prompts/) for:**
- Learning foundational architectural patterns (SOLID, modularity, DRY)
- Understanding universal security/testing principles
- Implementing Firebase SDK features (SDK patterns, best practices)
- Making strategic decisions (architectural evolution, platform selection)

### Feature Development Workflow

```
1. /speckit-constitution
   ↓ Read project constraints and current architectural state
2. /speckit-specify <feature-name>
   ↓ Create feature spec (references constitution + prompts)
3. /speckit-plan
   ↓ Design implementation (applies prompt patterns)
4. /speckit-tasks
   ↓ Break down work into tasks
5. /speckit-implement
   ↓ Execute implementation (follows constitutional + prompt guidance)
6. Git commit with references
   ↓ Cite constitutional compliance + prompt guidance
```

---

## Cross-References

**Related Documentation:**
- [Spec-Kit Integration Guide](../.prompts/meta/speckit-integration-guide.md) - Comprehensive guide to hybrid architecture
- [CLAUDE.md](../CLAUDE.md) - Decision framework and mandatory consultation protocol
- [Prompts Library](../.prompts/README.md) - Foundational patterns and best practices
- [Architectural Evolution Strategy](../.prompts/meta/architectural-evolution-strategy.md) - Phase transition framework
- [Architectural Decision Log](../.prompts/meta/architectural-decision-log.md) - Historical decisions

---

**Maintained By**: Project lead
**Review Frequency**: Quarterly (with architectural review)
**Last Updated**: 2025-12-20
