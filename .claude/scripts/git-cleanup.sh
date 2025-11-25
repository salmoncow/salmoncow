#!/bin/bash

# git-cleanup.sh
# Cleans up feature branch after PR is merged
# Includes GitHub PR check with auto-fix for stale local main

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Store current branch name
current_branch=$(git branch --show-current)

# Verify not on main/master
if [[ "$current_branch" == "main" ]] || [[ "$current_branch" == "master" ]]; then
  echo -e "${RED}❌ Cannot clean up: already on main branch${NC}"
  echo ""
  echo "You are currently on: $current_branch"
  echo ""
  echo "This command cleans up feature branches after PR merge."
  echo "To delete a different branch manually:"
  echo "  git branch -d <branch-name>"
  exit 1
fi

echo -e "${BLUE}Cleaning up branch: ${current_branch}${NC}"
echo ""

# Step 2: Check if branch is merged to main (locally)
echo "Checking merge status..."
if git branch --merged main | grep -q "^[* ] $current_branch$"; then
  echo -e "${GREEN}✓ Branch is merged to main${NC}"
else
  # Step 2b: Not merged locally - check GitHub for merged PR
  echo -e "${YELLOW}⚠️ Branch NOT merged to main locally${NC}"
  echo ""
  echo "Checking GitHub for merged PR..."

  # Check if gh CLI is available
  if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) not found${NC}"
    echo ""
    echo "Cannot check GitHub PR status without gh CLI."
    echo "Install: https://cli.github.com/"
    echo ""
    echo "Manual steps:"
    echo "1. Check if PR is merged on GitHub"
    echo "2. Update main: git checkout main && git pull origin main"
    echo "3. Retry: /git-cleanup"
    exit 1
  fi

  # Query GitHub for merged PR
  pr_info=$(gh pr list --head "$current_branch" --state merged --json number,mergedAt,url 2>/dev/null || echo "[]")

  if [ -n "$pr_info" ] && [ "$pr_info" != "[]" ]; then
    # PR is merged on GitHub!
    pr_number=$(echo "$pr_info" | jq -r '.[0].number')
    pr_url=$(echo "$pr_info" | jq -r '.[0].url')
    pr_merged_at=$(echo "$pr_info" | jq -r '.[0].mergedAt')

    echo -e "${GREEN}✅ Found merged PR on GitHub!${NC}"
    echo ""
    echo "   PR: #$pr_number"
    echo "   URL: $pr_url"
    echo "   Merged: $pr_merged_at"
    echo ""
    echo -e "${BLUE}📚 What happened:${NC}"
    echo "   - Your PR was merged on GitHub"
    echo "   - Local 'main' branch doesn't have the merge yet"
    echo "   - Git only checks LOCAL merge status by default"
    echo ""
    echo -e "${BLUE}💡 Solution: Update local main with merged changes${NC}"
    echo ""
    read -p "Would you like me to update main and retry? (y/n): " response

    if [[ "$response" =~ ^[Yy]$ ]]; then
      echo ""
      echo "Updating local main branch..."

      # Switch to main and pull
      git checkout main
      if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to switch to main${NC}"
        exit 1
      fi

      git pull origin main
      if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️ Failed to pull main, but continuing...${NC}"
      fi

      # Switch back to feature branch
      git checkout "$current_branch"

      # Retry merge check
      if git branch --merged main | grep -q "^[* ] $current_branch$"; then
        echo -e "${GREEN}✅ Branch now detected as merged locally!${NC}"
        echo ""
      else
        echo -e "${YELLOW}⚠️ Branch still not detected as merged after updating main${NC}"
        echo "   This is unusual. The PR may have been squash-merged."
        echo ""
        echo "Options:"
        echo "1. Switch to main and verify merge manually"
        echo "2. Force delete: git checkout main && git branch -D $current_branch"
        exit 1
      fi
    else
      echo ""
      echo "Cleanup cancelled. To update main manually:"
      echo "  git checkout main && git pull origin main"
      echo "  Then retry: /git-cleanup"
      exit 0
    fi
  else
    # No merged PR found on GitHub
    echo ""
    echo -e "${RED}No merged PR found on GitHub for branch: $current_branch${NC}"
    echo ""
    echo "This branch may contain unmerged work!"
    echo ""
    echo "Options:"
    echo "1. Check if PR exists: gh pr list --head $current_branch"
    echo "2. Create PR: /gh-pr"
    echo "3. Force delete anyway (will lose commits): git branch -D $current_branch"
    echo "4. Cancel and investigate"
    echo ""
    echo "Aborting cleanup for safety."
    exit 1
  fi
fi

# Step 3: Check for unpushed commits
echo "Checking for unpushed commits..."
unpushed=$(git log @{u}..HEAD --oneline 2>/dev/null || echo "")

if [ -n "$unpushed" ]; then
  echo -e "${YELLOW}⚠️ WARNING: Branch has unpushed commits${NC}"
  echo ""
  echo "Unpushed commits:"
  echo "$unpushed"
  echo ""
  echo "These commits will be LOST if you delete this branch!"
  echo ""
  echo "Recommendation: Cancel and push first, or check if PR is merged"
  echo ""
  read -p "Continue anyway? (y/n): " response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
  fi
else
  echo -e "${GREEN}✓ All commits are pushed${NC}"
fi

# Step 4: Switch to main
echo ""
echo "Switching to main..."
git checkout main
echo -e "${GREEN}✓ Now on main${NC}"

# Step 5: Pull latest changes (may already be up-to-date from Step 2b)
echo ""
echo "Pulling latest changes..."
git pull origin main 2>&1 | grep -v "Already up to date" || echo -e "${GREEN}✓ Main is up-to-date${NC}"

# Step 6: Delete local branch
echo ""
echo "Deleting local branch..."
git branch -d "$current_branch"
echo -e "${GREEN}✓ Deleted branch $current_branch${NC}"

# Step 7: Optional remote branch deletion
echo ""
echo "Delete remote branch origin/$current_branch?"
echo "Note: GitHub often auto-deletes remote branches after PR merge"
echo ""
read -p "Delete remote branch? (y/n): " response

if [[ "$response" =~ ^[Yy]$ ]]; then
  if git push origin --delete "$current_branch" 2>&1; then
    echo -e "${GREEN}✓ Remote branch deleted${NC}"
  else
    echo -e "${YELLOW}⚠️ Remote branch deletion failed (may already be deleted)${NC}"
  fi
else
  echo "Skipped remote branch deletion"
fi

# Success!
echo ""
echo -e "${GREEN}✅ Branch cleanup completed!${NC}"
echo ""
echo "Summary:"
echo "  Cleaned up: $current_branch"
echo "  Switched to: main"
echo "  Main branch: up-to-date"
echo "  Local branch: deleted"
echo ""
echo "You are now on main with latest changes."
echo ""
echo "Next steps:"
echo "1. Create new feature branch: /git-branch <type>/<name>"
echo "2. Or continue with other work"
