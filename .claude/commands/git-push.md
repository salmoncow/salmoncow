---
description: Push current branch to remote following project best practices
---

Push the current branch to remote repository.

Follow these requirements from `core/development/git-best-practices.md`:

1. **Verify Current State:**
   - Check current branch name with `git branch --show-current`
   - Verify commits to push with `git log @{u}..HEAD` (if upstream exists)
   - Check for uncommitted changes with `git status`
   - Ensure working tree is clean

2. **Safety Checks:**
   - ⚠️ **NEVER force push to main/master** unless explicitly confirmed
   - Warn if attempting to push to protected branches (main, master)
   - Check if branch has upstream tracking with `git rev-parse --abbrev-ref @{u}`
   - Verify remote exists with `git remote -v`

3. **Push Strategy:**
   - **First time push** (no upstream): `git push -u origin <branch>`
   - **Subsequent pushes** (upstream exists): `git push`
   - **Force push** (only if user explicitly confirms): `git push --force-with-lease`

4. **Decision Logic:**
   ```
   Is working tree clean?
   ├─ No → Warn user, offer to commit first
   └─ Yes → Continue

   Is current branch main/master?
   ├─ Yes → WARN: Should use PRs, ask for confirmation
   └─ No → Continue

   Does upstream tracking exist?
   ├─ No → Use: git push -u origin <branch>
   └─ Yes → Use: git push

   Are there commits to push?
   ├─ No → Inform user, nothing to push
   └─ Yes → Execute push
   ```

5. **Output Information:**
   - Show which branch is being pushed
   - Show number of commits being pushed
   - Show remote URL
   - Confirm success and provide next steps (e.g., "Create PR at <url>")

6. **Error Handling:**
   - If push rejected (non-fast-forward), explain and suggest options
   - If authentication fails, provide troubleshooting steps
   - If remote branch has changes, suggest `git pull --rebase`

**IMPORTANT:**
- Do NOT force push without explicit user confirmation
- WARN before pushing to main/master (should use PRs)
- Verify authentication is configured before attempting
- For feature branches, suggest creating PR after successful push

**Examples:**

**First push of feature branch:**
```bash
# Current branch: feat/new-feature
# No upstream set
git push -u origin feat/new-feature
# Output: "Branch pushed! Create PR: https://github.com/user/repo/compare/feat/new-feature"
```

**Subsequent push to existing branch:**
```bash
# Current branch: feat/new-feature
# Upstream: origin/feat/new-feature
git push
# Output: "3 commits pushed to origin/feat/new-feature"
```

**Attempting to push to main (should warn):**
```bash
# Current branch: main
# WARN: Direct pushes to main should go through PRs
# Ask: "Are you sure? This violates branch protection best practices."
```
