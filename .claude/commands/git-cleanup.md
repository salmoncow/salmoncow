---
description: Clean up local branch after PR is merged
---

Clean up the current feature branch after its pull request has been merged to main.

## Execution

Execute the git-cleanup bash script:

```bash
bash .claude/scripts/git-cleanup.sh
```

The script handles:
1. Verifies not on main/master
2. Checks if branch is merged to main locally
3. **If not merged locally:** Checks GitHub for merged PR and offers auto-fix
4. Checks for unpushed commits
5. Switches to main and pulls latest
6. Deletes local branch
7. Optionally deletes remote branch

## Features

### GitHub PR Check with Auto-Fix
When a branch isn't detected as merged locally, the script automatically:
- Queries GitHub for merged PRs using `gh pr list`
- Shows PR details (number, URL, merge time)
- Explains why the issue occurred
- Offers to update local main and retry
- Completes cleanup after fixing

### Safety Features
- **Blocks on main/master** - Can't accidentally delete main
- **Checks merge status locally and on GitHub** - Prevents losing unmerged work
- **Warns on unpushed commits** - Prevents data loss
- **Uses -d not -D** - Safe deletion that requires merge
- **Interactive prompts** - User controls risky operations
- **Clear error messages** - Helps understand what's wrong
- **Educational feedback** - Explains issues and solutions

## When to Use

**Use `/git-cleanup` when:**
- ✅ Your PR has been merged to main
- ✅ Ready to switch back to main for new work
- ✅ Want to clean up local workspace

**Don't use when:**
- ❌ PR is still open/under review
- ❌ Need to keep branch for reference

## Guidance References

Implements patterns from:
- `core/development/git-best-practices.md` (lines 596-599) - Branch cleanup workflow
- Real-world usage - GitHub PR check addresses stale local main issue
