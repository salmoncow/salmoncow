---
description: Create a pull request for the current branch following project best practices
---

Create a pull request for the current branch.

Follow these requirements from `core/development/git-best-practices.md`:

1. **Pre-flight Checks:**
   - Verify `gh` CLI is installed and authenticated
   - Check current branch name
   - Verify not on main/master branch
   - **Check for uncommitted changes:** `git status --porcelain`
   - Ensure branch is pushed to remote (`git rev-parse @{u}`)

2. **If Uncommitted Changes Exist:**
   - **BLOCK PR creation** - PRs should only include committed code
   - Show list of uncommitted files
   - Error message: "Cannot create PR with uncommitted changes"
   - Provide options:
     ```
     ❌ Cannot create PR: uncommitted changes detected

     Uncommitted files:
     - file1.js (modified)
     - file2.md (new file)

     Please choose one:
     1. Commit changes: /git-commit
     2. Stash changes: git stash
     3. Review changes: git diff
     4. Discard changes: git checkout -- <file>

     After resolving, retry: /gh-pr
     ```
   - **Exception:** Files matching .gitignore patterns can be ignored
   - Use: `git status --porcelain | grep -v '^??'` to check only tracked files
   - Untracked files (new files starting with `??`) should trigger warning

3. **If Branch Not Pushed:**
   - Offer to push first using `/git-push` workflow
   - Use `git push -u origin <branch>` if needed

4. **Analyze Changes for PR Description:**
   - Run `git log main...HEAD` (or `master...HEAD`) to see all commits
   - Run `git diff main...HEAD` to understand full scope of changes
   - Review commit messages for summary points
   - Identify which `.prompts/` files guided the implementation

5. **Draft PR Title and Body:**

   **Title Format:**
   - Use conventional commits style: `<type>(<scope>): <description>`
   - Examples: `feat(auth): Add Google OAuth integration`
   - Keep under 72 characters

   **Body Format:**
   ```markdown
   ## Summary
   [1-3 bullet points of what changed and why]

   ## Changes
   - [Specific change 1]
   - [Specific change 2]
   - [Specific change 3]

   ## Guidance References
   Following prompts:
   - `path/to/prompt.md` - [How it influenced decisions]

   ## Test Plan
   - [ ] [Testing step 1]
   - [ ] [Testing step 2]

   ## Checklist
   - [ ] No sensitive data committed
   - [ ] Follows documented patterns from `.prompts/`
   - [ ] Updated documentation if needed
   - [ ] CI checks will pass

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

6. **Create PR Using GitHub CLI:**
   ```bash
   gh pr create \
     --title "feat(scope): Description" \
     --body "$(cat <<'EOF'
   [PR body content]
   EOF
   )"
   ```

   **Options to consider:**
   - `--base main` (or `master`) - target branch
   - `--draft` - create as draft PR
   - `--web` - open in browser after creation

7. **Post-Creation:**
   - Display PR URL
   - Show next steps (wait for CI, request reviewers)
   - Remind about branch protection policies

**Branch Naming Expectations:**
Based on `git-best-practices.md`, branches should follow patterns:
- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Test additions

**IMPORTANT:**
- Do NOT create PR from main/master branch
- Ensure branch is pushed to remote first
- Use `--draft` flag for work-in-progress PRs
- Reference issue numbers if applicable (e.g., `Fixes #123`)
- Follow conventional commits format in title

**Error Handling:**
- If uncommitted changes exist: BLOCK and show options to commit/stash/discard
- If `gh` not installed: Provide installation instructions
- If not authenticated: Run `gh auth login`
- If branch not pushed: Offer to push first
- If PR already exists: Show existing PR URL

**Example: Uncommitted Changes Error**
```
$ /gh-pr

⚠️ Pre-flight check: Checking for uncommitted changes...

❌ Cannot create PR: uncommitted changes detected

Uncommitted files:
  M src/index.js (modified)
  M README.md (modified)
  ?? new-feature.js (untracked)

PRs should only include committed code. Please resolve uncommitted changes first.

Options:
1. Commit changes: /git-commit
2. Stash changes: git stash
3. Review changes: git diff
4. Discard changes: git checkout -- <file>

After resolving, retry: /gh-pr
```
