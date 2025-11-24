---
description: Clean up local branch after PR is merged
---

Clean up the current feature branch after its pull request has been merged to main.

Follow these requirements from `core/development/git-best-practices.md`:

## Purpose

After a pull request is merged to main, the feature branch is no longer needed. This command safely cleans up by:
- Switching back to main branch
- Pulling latest changes (including your merged PR)
- Deleting the local feature branch
- Optionally deleting the remote branch

From `git-best-practices.md` (lines 596-599):
```bash
# 8. Clean up local branch
git checkout main
git pull origin main
git branch -d feat/google-oauth-integration
```

## Pre-flight Checks

1. **Verify Not on Main/Master:**
   - Check current branch: `git branch --show-current`
   - If on main/master: Error "Already on main. Specify branch to clean up."
   - Store current branch name for deletion later

2. **Check Branch Merge Status:**
   - Verify branch is merged to main: `git branch --merged main`
   - If not merged: WARN user with options to proceed or abort
   - This prevents accidental loss of unmerged work

3. **Check for Unpushed Commits:**
   - Check if local commits exist that aren't on remote: `git log @{u}..HEAD`
   - If unpushed commits exist: WARN user about potential data loss
   - Require explicit confirmation to proceed

4. **Verify Main Branch Exists:**
   - Check for `main` or `master`
   - Use: `git rev-parse --verify main` or `git rev-parse --verify master`

## Cleanup Workflow

**Step 1: Store Current Branch Name**
```bash
# Remember which branch we're cleaning up
current_branch=$(git branch --show-current)

# Verify it's not main/master
if [[ "$current_branch" == "main" ]] || [[ "$current_branch" == "master" ]]; then
  echo "❌ Already on main. Cannot clean up main branch."
  exit 1
fi
```

**Step 2: Verify Branch is Merged (Safety Check)**
```bash
# Check if branch is merged to main
git branch --merged main | grep -q "^[* ] $current_branch$"

if [ $? -ne 0 ]; then
  echo "⚠️ WARNING: Branch '$current_branch' is NOT merged to main"
  echo ""
  echo "This branch may contain unmerged work!"
  echo ""
  echo "Options:"
  echo "1. Check if PR is merged on GitHub"
  echo "2. Force delete anyway (will lose commits): --force"
  echo "3. Cancel and investigate"

  # Require --force flag to proceed with unmerged branch
  exit 1
fi
```

**Step 3: Check for Unpushed Commits**
```bash
# Check if there are unpushed commits
unpushed=$(git log @{u}..HEAD --oneline)

if [ -n "$unpushed" ]; then
  echo "⚠️ WARNING: Branch has unpushed commits"
  echo ""
  echo "Unpushed commits:"
  echo "$unpushed"
  echo ""
  echo "These commits will be LOST if you delete this branch!"
  echo ""
  echo "Recommendation: Cancel and push first, or check if PR is merged"

  # Ask for confirmation
  # Require explicit --force flag or user confirmation
fi
```

**Step 4: Switch to Main**
```bash
# Switch to main branch
git checkout main

# Verify switch was successful
current=$(git branch --show-current)
if [[ "$current" != "main" ]] && [[ "$current" != "master" ]]; then
  echo "❌ Failed to switch to main branch"
  exit 1
fi
```

**Step 5: Pull Latest Changes**
```bash
# Pull latest from main (includes your merged PR)
git pull origin main

# This ensures local main is up-to-date
```

**Step 6: Delete Local Branch**
```bash
# Delete local branch (safe delete with -d)
git branch -d $current_branch

# -d flag ensures branch is merged
# Will fail if branch has unmerged commits (safety feature)
```

**Step 7: Optional Remote Branch Deletion**
```bash
# Ask user if they want to delete remote branch
echo ""
echo "Local branch deleted: $current_branch"
echo ""
echo "Delete remote branch too?"
echo "Remote branch: origin/$current_branch"
echo ""
echo "Note: GitHub often auto-deletes remote branches after PR merge"
echo ""
# If user confirms:
git push origin --delete $current_branch
```

## Success Output

```
✅ Branch cleanup completed!

Summary:
  Cleaned up: feat/user-dashboard
  Switched to: main
  Main branch: up-to-date (pulled latest)
  Local branch: deleted
  Remote branch: deleted (or skipped)

You are now on main with latest changes, including your merged PR.

Next steps:
1. Create new feature branch: /git-branch <type>/<name>
2. Or continue with other work
```

## Error Handling & Safety

### Already on Main
```
❌ Cannot clean up: already on main branch

You are currently on: main

This command cleans up feature branches after PR merge.
To delete a different branch manually:
  git branch -d <branch-name>

To switch to a feature branch first:
  git checkout <feature-branch>
  Then run: /git-cleanup
```

### Branch Not Merged
```
⚠️ WARNING: Branch not merged to main!

Current branch: feat/user-dashboard
Merged to main: NO

This branch may contain unmerged work that will be LOST!

Before deleting:
1. Check if PR exists and is merged on GitHub
2. If PR merged but git doesn't detect it:
   - Pull main: git checkout main && git pull origin main
   - Try again: /git-cleanup
3. If you're SURE you want to delete anyway:
   - Use force delete: git branch -D feat/user-dashboard

Aborting cleanup for safety.
```

### Unpushed Commits
```
⚠️ WARNING: Branch has unpushed commits!

Unpushed commits (will be LOST):
  abc1234 feat: add user dashboard UI
  def5678 fix: resolve merge conflict
  ghi9012 refactor: clean up code

These commits have NOT been pushed to remote!

Options:
1. Push first: /git-push
2. Check if PR is merged (commits may be on PR branch)
3. If you're CERTAIN you want to lose these commits:
   - Use --force flag: /git-cleanup --force

Aborting cleanup for safety.
```

### Remote Branch Deletion Failed
```
✅ Local branch deleted successfully

⚠️ Remote branch deletion failed

Remote branch: origin/feat/user-dashboard
Error: Permission denied or branch doesn't exist

Possible reasons:
1. Branch already deleted by GitHub after PR merge (this is normal!)
2. No permission to delete remote branches
3. Branch name mismatch

Local cleanup complete. You can manually check GitHub if needed.
```

## Command Flags (Optional Enhancement)

```bash
# Standard cleanup (safe)
/git-cleanup

# Force cleanup even if not merged (DANGEROUS)
/git-cleanup --force

# Skip remote deletion (keep remote branch)
/git-cleanup --local-only

# Delete remote without prompting
/git-cleanup --delete-remote
```

## Decision Logic Flow

```
Input: /git-cleanup

├─ Is current branch main/master?
│  ├─ Yes → Error: "Already on main, specify branch to delete"
│  └─ No → Store branch name, continue
│
├─ Is branch merged to main?
│  ├─ No → WARN: "Branch not merged! Use --force to delete anyway"
│  │       └─ Has --force flag?
│  │          ├─ No → Abort (safe default)
│  │          └─ Yes → Continue with forced deletion
│  └─ Yes → Continue
│
├─ Are there unpushed commits?
│  ├─ Yes → WARN: "Unpushed commits will be lost!"
│  │       └─ Require confirmation
│  └─ No → Continue
│
├─ Switch to main
│  ├─ Fails → Error: "Cannot switch to main"
│  └─ Success → Continue
│
├─ Pull latest from main
│  ├─ Fails → Warn but continue (cleanup still useful)
│  └─ Success → Continue
│
├─ Delete local branch
│  ├─ Fails → Error: "Cannot delete branch (use -D to force)"
│  └─ Success → Continue
│
└─ Delete remote branch?
   ├─ User declines → Skip, finish
   ├─ User confirms → Attempt deletion
   │  ├─ Fails → Warn (may be normal if auto-deleted)
   │  └─ Success → Confirm
   └─ Finish cleanup
```

## When to Use This Command

**Use `/git-cleanup` when:**
- ✅ Your PR has been merged to main
- ✅ You've verified merge on GitHub
- ✅ Ready to switch back to main for new work
- ✅ Want to clean up local workspace

**Don't use when:**
- ❌ PR is still open/under review
- ❌ PR was closed without merging (use --force carefully)
- ❌ Need to keep branch for reference
- ❌ Working on multiple related PRs from same branch

## GitHub Auto-Deletion

**Note:** GitHub automatically deletes remote branches after PR merge (if configured).

When this happens:
- Remote branch is already gone
- Only local branch needs cleanup
- Remote deletion will "fail" (harmlessly)
- This is normal and expected behavior

## Safety Features

- **Blocks on main/master** - Can't accidentally delete main
- **Checks merge status** - Prevents losing unmerged work
- **Warns on unpushed commits** - Prevents data loss
- **Uses -d not -D** - Safe deletion that requires merge
- **Asks before remote deletion** - User controls remote cleanup
- **Clear error messages** - Helps understand what's wrong

## Examples

**Successful Cleanup:**
```bash
$ /git-cleanup

Cleaning up branch: feat/user-dashboard

Checking merge status...
✓ Branch is merged to main

Checking for unpushed commits...
✓ All commits are pushed

Switching to main...
✓ Now on main

Pulling latest changes...
✓ Main is up-to-date

Deleting local branch...
✓ Deleted branch feat/user-dashboard

Delete remote branch origin/feat/user-dashboard? (y/n): y
✓ Remote branch deleted (or already deleted by GitHub)

✅ Cleanup complete!

You are now on main with latest changes.
Ready to create a new branch: /git-branch <type>/<name>
```

**Cleanup with Warnings:**
```bash
$ /git-cleanup

Cleaning up branch: feat/experimental-feature

Checking merge status...
⚠️ WARNING: Branch NOT merged to main!

Your branch 'feat/experimental-feature' is not merged into main.
Deleting this branch will LOSE all commits!

Options:
1. Cancel and check if PR is merged on GitHub
2. Cancel and merge/rebase manually
3. Force delete anyway (use: git branch -D feat/experimental-feature)

Aborting cleanup for safety.
```

## Guidance References

This command implements patterns from:
- `core/development/git-best-practices.md` (lines 596-599) - Branch cleanup after PR merge
- `core/development/git-best-practices.md` (lines 554-600) - Complete feature branch workflow

**Pattern Applied:**
- Clean up branches after PR merge
- Always start fresh from latest main
- Prevent workspace clutter from old branches
- Safe defaults with explicit confirmation for dangerous operations
