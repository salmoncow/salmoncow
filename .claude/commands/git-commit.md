---
description: Create a git commit for recent changes following project best practices
---

Create a git commit for the recent changes in this project.

Follow these requirements from `core/development/git-best-practices.md`:

1. **Review Changes First:**
   - Run `git status` to see all untracked/modified files
   - Run `git diff` to see staged and unstaged changes
   - Run `git log --oneline -5` to see recent commit style

2. **Analyze Changes:**
   - Identify the nature of changes (new feature, enhancement, fix, refactor, docs, etc.)
   - Ensure no sensitive files (.env, credentials, secrets) are being committed
   - Verify changes align with documented patterns from .prompts/

3. **Draft Commit Message:**
   - Write concise subject (50 chars max) describing WHY, not just WHAT
   - Follow conventional commits format if applicable (feat:, fix:, docs:, refactor:, etc.)
   - Include detailed body if needed (wrap at 72 chars)
   - Add mandatory footer:
     ```
     🤖 Generated with [Claude Code](https://claude.com/claude-code)

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```

4. **Stage and Commit:**
   - Stage relevant files with `git add`
   - Create commit using heredoc format for proper formatting
   - Run `git status` after commit to verify

5. **Document Guidance Citations:**
   - If changes were guided by specific prompts, mention in commit message
   - Example: "Following core/architecture/modular-architecture-principles.md"

**IMPORTANT:**
- Do NOT push to remote unless explicitly requested
- Do NOT use `--no-verify` flag unless explicitly requested
- If pre-commit hooks modify files, amend the commit only if safe
- Check authorship before amending: `git log -1 --format='%an %ae'`
