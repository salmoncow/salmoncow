---
description: Sync current branch with latest changes from main
---

Sync the current feature branch with the latest changes from main branch.

Follow these requirements from `core/development/git-best-practices.md`:

## Purpose

When working on a feature branch, the main branch often receives new commits from merged PRs. This command updates your feature branch with those changes to:
- Avoid merge conflicts later
- Keep your branch up-to-date with latest code
- Ensure your changes work with current main

From `git-best-practices.md` (lines 660-663):
```bash
git checkout feat/my-feature
git fetch origin
git rebase origin/main
```

## Pre-flight Checks

1. **Verify Not on Main/Master:**
   - Check current branch: `git branch --show-current`
   - If on main/master: Error "Already on main. Nothing to sync."
   - This command only works on feature branches

2. **Check Working Tree Status:**
   - Run: `git status --porcelain`
   - **BLOCK if uncommitted changes exist**
   - Error: "Cannot sync with uncommitted changes. Commit or stash first."
   - List uncommitted files for user awareness

3. **Verify Remote Exists:**
   - Check: `git remote -v`
   - Verify origin is configured
   - Verify connection to remote

4. **Identify Base Branch:**
   - Check for `main` or `master`
   - Use: `git rev-parse --verify main` or `git rev-parse --verify master`
   - Store base branch name for rebase operation

## Sync Workflow

**Step 1: Fetch Latest from Remote**
```bash
# Fetch all refs from origin
git fetch origin

# Show what was fetched
git log HEAD..origin/main --oneline
# This shows commits that will be integrated
```

**Step 2: Rebase on Origin/Main**
```bash
# Rebase current branch on latest main
git rebase origin/main

# This replays your commits on top of latest main
# Creates linear history
```

**Step 3: Handle Outcome**

**Success Case:**
```
✅ Branch synced successfully!

Commits integrated from main: 5
Your commits preserved: 3

Current status:
- Your branch is up-to-date with latest main
- Your commits are rebased on top
- Ready to continue development

Next steps:
1. Test your changes with new main code
2. Continue development
3. When ready: /git-push (may need --force-with-lease)
```

**Conflict Case:**
```
⚠️ Merge conflicts detected during rebase

Conflicted files:
- src/js/modules/auth.js
- src/js/main.js

Resolution steps:
1. Open conflicted files in editor
2. Resolve conflicts (look for <<<<<<< markers)
3. Stage resolved files: git add <file>
4. Continue rebase: git rebase --continue
5. Repeat until complete

Or abort rebase: git rebase --abort
```

## Rebase vs Merge

**Default: Rebase (Recommended)**
- Creates linear commit history
- Cleaner git log
- Easier to understand project evolution
- Aligns with git-best-practices.md:660-663

**Alternative: Merge (If Needed)**
- Use if rebase causes complex conflicts
- Preserves exact commit history
- Command: `git merge origin/main`
- Less clean but sometimes safer

**This command uses REBASE by default** following project best practices.

## Force Push After Sync

**IMPORTANT:** After syncing with rebase, your branch history has changed. If you previously pushed this branch:

```bash
# Your next push needs --force-with-lease
git push --force-with-lease origin <branch-name>

# Why --force-with-lease?
# - Safer than --force
# - Only force pushes if remote hasn't changed
# - Prevents overwriting others' work
```

**The `/git-push` command will handle this automatically if needed.**

## Error Handling

### Uncommitted Changes
```
❌ Cannot sync branch with uncommitted changes

Uncommitted files:
- src/js/modules/auth.js (modified)
- src/js/utils.js (modified)
- README.md (modified)

Please either:
1. Commit changes: /git-commit
2. Stash changes: git stash
3. Discard changes: git checkout -- <file>

Then retry: /git-sync
```

### Already on Main
```
❌ Cannot sync: already on main branch

You are currently on: main

This command syncs feature branches WITH main.
Since you're already on main, run:
  git pull origin main

Or switch to a feature branch first:
  git checkout <feature-branch>
```

### Rebase Conflicts
```
⚠️ Rebase stopped due to conflicts

Current status: Rebase in progress
Conflicted files: 2

Steps to resolve:
1. Check conflicts: git status
2. Edit conflicted files (search for <<<<<<< markers)
3. Stage fixed files: git add <file>
4. Continue: git rebase --continue
5. Repeat for remaining conflicts

To abort and return to pre-sync state:
  git rebase --abort
```

### Remote Not Accessible
```
❌ Cannot fetch from remote

Error: Could not connect to origin
Remote URL: git@github.com:user/repo.git

Possible causes:
1. No internet connection
2. SSH keys not configured
3. Remote repository moved/deleted
4. Authentication expired

Check connectivity: git fetch origin --dry-run
```

## Decision Logic Flow

```
Input: /git-sync

├─ Is current branch main/master?
│  ├─ Yes → Error: "Already on main, nothing to sync"
│  └─ No → Continue
│
├─ Check working tree status
│  ├─ Uncommitted changes → BLOCK: "Commit or stash changes first"
│  └─ Clean → Continue
│
├─ Verify remote exists
│  ├─ No remote → Error: "No remote configured"
│  └─ Remote exists → Continue
│
├─ Fetch from origin
│  ├─ Fetch fails → Error: "Cannot connect to remote"
│  └─ Fetch succeeds → Continue
│
├─ Identify base branch (main or master)
│  └─ Found → Continue
│
├─ Rebase on origin/main
│  ├─ Conflicts detected
│  │  ├─ Show conflicted files
│  │  ├─ Provide resolution instructions
│  │  └─ Wait for user to resolve
│  │
│  └─ Success
│     ├─ Show commits integrated
│     ├─ Show branch status
│     └─ Remind about force-push if needed
```

## When to Use This Command

**Use `/git-sync` when:**
- ✅ Working on long-lived feature branch
- ✅ Main branch has new commits you need
- ✅ Want to avoid conflicts later
- ✅ Need to test with latest main code
- ✅ Before pushing to ensure compatibility

**Don't use when:**
- ❌ On main branch (use `git pull` instead)
- ❌ Working tree has uncommitted changes
- ❌ Just created branch (already up-to-date)
- ❌ About to delete branch after PR merge

## Examples

**Successful Sync:**
```bash
$ /git-sync

Fetching from origin...
✓ Fetched latest changes

Rebasing feat/user-dashboard on origin/main...
✓ Rebase successful

📊 Sync Summary:
   Commits from main: 5
   Your commits: 3

✅ Branch is now up-to-date with main!

⚠️ Note: Branch history was rewritten
    Next push requires: git push --force-with-lease
    Or use: /git-push (handles this automatically)
```

**Sync with Conflicts:**
```bash
$ /git-sync

Fetching from origin...
✓ Fetched latest changes

Rebasing feat/user-dashboard on origin/main...
⚠️ Conflicts detected

Conflicted files:
  - src/js/modules/auth.js
  - src/styles/main.css

Next steps:
1. Open files and resolve conflicts (<<<<<<< markers)
2. Stage resolved files: git add src/js/modules/auth.js src/styles/main.css
3. Continue rebase: git rebase --continue
4. Or abort: git rebase --abort

Status: Waiting for conflict resolution...
```

## Safety Features

- **Blocks on uncommitted changes** - Prevents mixing work
- **Blocks on main/master** - Prevents confusion
- **Uses rebase not merge** - Cleaner history (per git-best-practices.md)
- **Clear conflict guidance** - Helps resolve issues
- **Abort instructions** - Easy to undo if needed
- **Force-push reminders** - Prevents mistakes

## Guidance References

This command implements patterns from:
- `core/development/git-best-practices.md` (lines 652-668) - Rebase workflow
- `core/development/git-best-practices.md` (lines 660-663) - Update feature branch command sequence

**Pattern Applied:**
- Keep feature branches up-to-date via rebase
- Create linear commit history for easier review
- Integrate main changes frequently to avoid conflicts
