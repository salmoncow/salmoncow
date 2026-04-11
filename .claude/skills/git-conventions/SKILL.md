---
name: git-conventions
description: >
  Enforces Conventional Commits, branch naming conventions, and PR structure for all git operations.
  Use this skill whenever you are about to run git commit, git checkout -b, git branch, git push,
  gh pr create, or any git command that creates a branch, commit, or pull request. Also use it when
  the user asks you to commit changes, create a branch, make a PR, or do anything involving version
  control — even if they don't mention "git" explicitly.
---

# Git Conventions

This skill enforces consistent git conventions across all projects. It applies to every branch
creation, commit, and pull request — regardless of language, framework, or repo.

## When This Applies

Before executing any command that creates a **branch**, **commit**, or **pull request**, validate
the output against the rules below. Never execute a non-conforming git command. Fix it first.

If the user provides a message or name that violates these conventions, propose the corrected
version and briefly explain what changed.

---

## Branch Naming

**Format:** `<type>/<description>` or `<type>/<description>-#<issue-number>`

**Rules:**
- Lowercase only — no uppercase letters
- Hyphens as word separators — no underscores or spaces
- 2–5 words in the description, max 50 characters total
- Alphanumeric characters and hyphens only (plus the `/` separator)

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `hotfix`, `release`, `experiment`, `spike`, `deps`, `perf`, `security`

**Examples:**

```bash
# Good
feat/add-dark-mode-toggle
fix/resolve-login-timeout
docs/update-api-guide
hotfix/patch-auth-bypass-#142

# Bad — and why
feat/Add-Dark-Mode        # uppercase
fix/login_timeout_error   # underscores
feat/a                    # too vague
docs/update-the-entire-api-documentation-for-all-endpoints  # too long
```

**Before running `git checkout -b` or `git branch`, verify:**
1. Type prefix is from the allowed list
2. All lowercase, hyphens only
3. 2–5 words, under 50 characters
4. Description clearly communicates purpose

---

## Commit Messages

**Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

Scope and body are optional. Footer is used for breaking changes and issue references.

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

**Subject rules:**
- Imperative mood ("add", not "added" or "adds")
- Lowercase first letter
- No period at the end
- Max 72 characters

**Body rules:**
- Blank line between subject and body
- Wrap at 72 characters
- Explain *why*, not *what* — the diff shows the what

**Footer rules:**
- Breaking changes: `BREAKING CHANGE: <description>` or append `!` after type — e.g., `feat(api)!: change response format`
- Issue references: `Closes #42`, `Fixes #58`

**Atomic commits:** Each commit should contain exactly one logical change. If you find yourself
writing "and" in the subject, consider splitting into multiple commits.

**Examples:**

```bash
# Simple feature
feat(auth): add Google OAuth sign-in

# Bug fix with context
fix(ui): resolve avatar fallback when image fails to load

Avatar images now fall back to default-avatar.svg when the user's
profile photo returns a 404 or times out.

Fixes #58

# Breaking change
feat(api)!: migrate to v2 response format

BREAKING CHANGE: API responses now wrap data in an envelope object.
Clients must update their parsing logic.

# Documentation
docs: update README with deployment instructions

# Bad — and why
fix: fixed bug                          # past tense, vague
update code                             # no type prefix, vague
feat: add login, fix CSS, update docs   # multiple unrelated changes
Added new feature for users             # no type, past tense, vague
```

**Before running `git commit`, verify:**
1. Type is from the allowed list
2. Subject is imperative mood, lowercase, no period, ≤72 chars
3. Scope (if present) is a meaningful module/area name
4. Body (if present) has blank line separator, explains why
5. Each commit is one atomic logical change
6. Breaking changes use `!` suffix or `BREAKING CHANGE:` footer

---

## Pull Request Creation

**Title:** Same format as commit subject — `<type>(<scope>): <subject>`, under 70 characters.

**Body — required sections:**

```markdown
## Summary
- Why this change exists (1–3 bullet points)

## Changes
- Specific change 1
- Specific change 2
- Specific change 3

## Testing
- [ ] Test scenario 1
- [ ] Test scenario 2
```

If commits reference issues, include them: `Closes #42` or `Related to #58`.

**Example:**

```markdown
Title: feat(auth): add Google OAuth sign-in

## Summary
- Enable users to sign in with their Google accounts
- Replaces the manual email/password registration flow

## Changes
- Add `auth.js` module with signIn/signOut functions
- Update header component with sign-in button and user avatar
- Add error handling for failed OAuth attempts
- Configure Firebase Authentication with Google provider

## Testing
- [ ] Sign in with Google account succeeds
- [ ] Sign out clears session and redirects to home
- [ ] Failed sign-in shows error toast
- [ ] Existing sessions persist across page refresh
```

**Before running `gh pr create`, verify:**
1. Title follows `<type>(<scope>): <subject>` format, under 70 chars
2. Summary section explains *why* (not just what)
3. Changes section lists specific modifications
4. Testing section has actionable checklist items
5. Related issues are linked

---

## Quick Reference

| Type       | Use for                                  |
|------------|------------------------------------------|
| `feat`     | New feature or capability                |
| `fix`      | Bug fix                                  |
| `docs`     | Documentation only                       |
| `style`    | Formatting, whitespace (no logic change) |
| `refactor` | Restructuring without behavior change    |
| `perf`     | Performance improvement                  |
| `test`     | Adding or updating tests                 |
| `chore`    | Maintenance, dependencies, config        |
| `ci`       | CI/CD pipeline changes                   |
| `build`    | Build system changes                     |
| `revert`   | Reverting a previous commit              |
