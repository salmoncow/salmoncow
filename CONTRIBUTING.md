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

Follow conventional branch naming from [git-best-practices.md](.prompts/core/development/git-best-practices.md):

```bash
git checkout main
git pull origin main
git checkout -b <type>/<description>
```

**Branch naming format:** `<type>/<description>`
- Types: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`
- Use lowercase, hyphens only
- Be descriptive: `feat/user-dashboard`, `fix/login-timeout`

### 2. Make Changes Following Architectural Guidance

Before making changes, consult:
- **[CLAUDE.md](CLAUDE.md)** - Decision framework and mandatory consultation protocol
- **[.specs/constitution.md](.specs/constitution.md)** - Project constraints, quality standards, tech stack
- **[.prompts/](.prompts/)** - Foundational patterns and Firebase best practices

**Key principles:**
- Follow progressive complexity (don't over-engineer)
- Reference `.prompts/` files for architectural patterns
- Check `.specs/constitution.md` for project-specific constraints

### 3. Commit Using Conventional Commits

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
git commit -m "<type>(<scope>): <subject>"
```

**Common types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`

**Examples:**
```bash
git commit -m "feat(auth): add Google OAuth sign-in"
git commit -m "fix(ui): resolve avatar fallback display"
git commit -m "docs: update deployment instructions"
```

**Important guidelines:**
- Write atomic commits (one logical change per commit)
- Explain "why" in the commit body, not just "what"
- Reference guidance files that influenced your decisions

See [git-best-practices.md](.prompts/core/development/git-best-practices.md) for detailed commit guidelines.

### 4. Create a Pull Request

Push your branch and create a PR:

```bash
git push -u origin <branch-name>
```

Then create a PR via GitHub web UI. The PR template will auto-populate with required sections:
- **Summary** - Brief description and rationale
- **Changes** - List of specific changes
- **Testing** - Test results
- **Guidance References** - Constitutional compliance and prompt references
- **Related Issues** - Link to issues

See [git-best-practices.md](.prompts/core/development/git-best-practices.md) lines 1057-1081 for PR description best practices.

## Git Conventions

### Branch Naming

**Format:** `<type>/<description>`

**Rules:**
- Lowercase only
- Use hyphens (not underscores or spaces)
- 2-5 words, max 50 characters
- Be descriptive

**Examples:**
```bash
feat/add-user-dashboard
fix/login-timeout-error
docs/update-api-guide
refactor/auth-module
```

### Commit Messages

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code restructuring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes

**Guidelines:**
- Subject line: 50 characters or less
- Use imperative mood ("add" not "added")
- No period at the end
- Body: explain "why" not "what"

### Pull Requests

**Required sections:**
1. **Summary** - What and why
2. **Changes** - Bullet list of changes
3. **Testing** - Test checklist
4. **Guidance References** - Constitutional + prompt references
5. **Related Issues** - Link issues

**Branch protection:**
- No direct commits to `main`
- All changes via Pull Requests
- PR approval required before merge

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
- **Git workflow:** See [.prompts/core/development/git-best-practices.md](.prompts/core/development/git-best-practices.md)
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
- [.prompts/core/development/git-best-practices.md](.prompts/core/development/git-best-practices.md) - Git conventions (comprehensive)
