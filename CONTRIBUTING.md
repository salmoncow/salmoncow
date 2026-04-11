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
- **[CLAUDE.md](CLAUDE.md)** - Decision framework and mandatory consultation protocol
- **[.specs/constitution.md](.specs/constitution.md)** - Project constraints, quality standards, tech stack
- **[.prompts/](.prompts/)** - Foundational patterns and Firebase best practices

**Key principles:**
- Follow progressive complexity (don't over-engineer)
- Reference `.prompts/` files for architectural patterns
- Check `.specs/constitution.md` for project-specific constraints

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

This project uses a **hybrid guidance architecture**:

**1. Spec-Kit (`.specs/`)** - Project-specific constraints
- `.specs/constitution.md` - Quality standards, tech stack, cost constraints
- `.specs/technical/` - Build system, CI/CD, deployment configs

**2. Prompts (`.prompts/`)** - Foundational patterns
- `.prompts/core/` - Platform-agnostic principles
- `.prompts/platforms/firebase/` - Firebase implementation guidance
- `.prompts/meta/` - Architectural evolution strategy

**Before making architectural decisions:**
1. Read `.specs/constitution.md` for project constraints
2. Check `.prompts/` for relevant patterns
3. Follow decision triggers in `.prompts/meta/architectural-evolution-strategy.md`
4. Document which guidance influenced your decision

See [CLAUDE.md](CLAUDE.md) for the complete decision framework.

## Getting Help

- **Documentation questions:** Check [CLAUDE.md](CLAUDE.md), [.specs/constitution.md](.specs/constitution.md), or [.prompts/](.prompts/)
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
