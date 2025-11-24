---
description: Create a pull request for the current branch following project best practices
---

Create a pull request for the current branch.

Follow these requirements from `core/development/git-best-practices.md`:

1. **Pre-flight Checks:**
   - Verify `gh` CLI is installed and authenticated
   - Check current branch name
   - Ensure branch is pushed to remote (`git rev-parse @{u}`)
   - Verify not on main/master branch
   - Check for uncommitted changes

2. **If Branch Not Pushed:**
   - Offer to push first using `/push` workflow
   - Use `git push -u origin <branch>` if needed

3. **Analyze Changes for PR Description:**
   - Run `git log main...HEAD` (or `master...HEAD`) to see all commits
   - Run `git diff main...HEAD` to understand full scope of changes
   - Review commit messages for summary points
   - Identify which `.prompts/` files guided the implementation

4. **Draft PR Title and Body:**

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

5. **Create PR Using GitHub CLI:**
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

6. **Post-Creation:**
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
- If `gh` not installed: Provide installation instructions
- If not authenticated: Run `gh auth login`
- If branch not pushed: Offer to push first
- If PR already exists: Show existing PR URL
