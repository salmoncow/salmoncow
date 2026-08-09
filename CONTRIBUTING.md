# Contributing to SalmonCow

Thank you for your interest in contributing to SalmonCow! This document provides guidelines for contributing to the project.

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone https://github.com/salmoncow/salmoncow.git
   cd salmoncow
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Read the development guide:**
   See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup, build process, and deployment workflows.

## Development Workflow

### 1. Create a Feature Branch

Follow the git conventions in [.claude/skills/git-conventions/SKILL.md](.claude/skills/git-conventions/SKILL.md) for branch naming, commit messages, and PR structure.

```bash
git checkout main
git pull origin main
git checkout -b <type>/<description>
```

### 2. Make Changes Following Architectural Guidance

Before making changes, consult:
- **[CLAUDE.md](CLAUDE.md)** - Decision framework and consultation protocol
- **[.specs/constitution.md](.specs/constitution.md)** - Project constraints, quality standards, tech stack
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Setup, architecture, and operational runbooks

**Key principles:**
- Follow progressive complexity (don't over-engineer)
- Check `.specs/constitution.md` for project-specific constraints
- Keep the dependency direction one-way: components and modules → services →
  repositories → infrastructure

### 3. Commit and Create PR

All git conventions (commit messages, branch naming, PR structure) are defined in [.claude/skills/git-conventions/SKILL.md](.claude/skills/git-conventions/SKILL.md). Key points:

- **Commits**: `<type>(<scope>): <subject>` — atomic, imperative mood
- **PRs**: Must include Summary, Changes, Testing sections
- **Branch protection**: No direct commits to `main`, all changes via PRs

Push your branch and create a PR:
```bash
git push -u origin <branch-name>
```

## Architectural Decisions

Guidance lives in two places:

**1. Project-specific (`.specs/`)**
- [`.specs/constitution.md`](.specs/constitution.md) — constraints, quality
  standards, cost limits, and the current architectural phase

**2. Foundational patterns — global skills**
Architecture, security, testing, and Firebase patterns come from the global
skills in `~/.claude/skills/`, which load automatically by task context. They
are not checked into this repo.

`.prompts/` holds only the architectural history that is specific to this
project:
- [`.prompts/meta/architectural-decision-log.md`](.prompts/meta/architectural-decision-log.md) — what was decided and why
- [`.prompts/meta/architectural-evolution-strategy.md`](.prompts/meta/architectural-evolution-strategy.md) — phase-transition triggers

**Before making architectural decisions:**
1. Read `.specs/constitution.md` for project constraints
2. Check the decision log for prior art
3. If a phase transition is in play, check the evolution triggers before
   advancing — the constitution's rule is to stay put until there is measurable
   pain
4. Record the decision in the decision log if it changes a phase

See [CLAUDE.md](CLAUDE.md) for the complete decision framework.

## Getting Help

- **Documentation questions:** Check [CLAUDE.md](CLAUDE.md), [.specs/constitution.md](.specs/constitution.md), or [DEVELOPMENT.md](DEVELOPMENT.md)
- **Development setup:** See [DEVELOPMENT.md](DEVELOPMENT.md)
- **Git conventions:** See [.claude/skills/git-conventions/SKILL.md](.claude/skills/git-conventions/SKILL.md)
- **Issues:** Create a GitHub issue with details

## Code of Conduct

Be respectful, constructive, and collaborative.

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

---

**Quick Reference:**
- [CLAUDE.md](CLAUDE.md) - Decision framework
- [DEVELOPMENT.md](DEVELOPMENT.md) - Setup and build
- [.specs/constitution.md](.specs/constitution.md) - Project constraints
- [.claude/skills/git-conventions/SKILL.md](.claude/skills/git-conventions/SKILL.md) - Git conventions
