---
description: Create a new branch following project naming conventions
---

Create a new git branch with the provided name, following project best practices.

Follow these requirements from `core/development/git-best-practices.md`:

## Branch Name Validation

**Expected Format:**
```
<type>/<short-description>
<type>/<description>-#<issue-number>
```

**Valid Branch Types:**
- **Primary:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `hotfix`, `release`
- **Special:** `experiment`, `spike`, `deps`, `perf`, `security`

**Validation Rules:**
1. ✅ **Lowercase only** - No uppercase letters
2. ✅ **Hyphens as separators** - Not underscores or spaces
3. ✅ **Concise descriptions** - 2-5 words, max 50 characters total
4. ✅ **Alphanumeric and hyphens only** - No special characters except hyphens and forward slash
5. ✅ **No trailing slashes** - Must end with description or issue number
6. ✅ **Valid type prefix** - Must start with one of the valid types above

**Issue Number Formatting:**
- Accept variations: `feat/new-feature #42`, `feat/new-feature-#42`, `feat/new-feature-42`
- Normalize to: `feat/new-feature-#42`
- Issue numbers are optional

## Pre-flight Checks

1. **Verify Git Repository:**
   - Ensure current directory is a git repository
   - Check with: `git rev-parse --git-dir`

2. **Check Working Tree Status:**
   - Run: `git status --porcelain`
   - **BLOCK if uncommitted changes exist**
   - Error message: "Cannot create branch with uncommitted changes. Please commit or stash your changes first."
   - List the uncommitted files for user awareness

3. **Verify Main Branch:**
   - Identify main branch: check for `main` or `master`
   - Use: `git rev-parse --verify main` or `git rev-parse --verify master`

4. **Check Branch Doesn't Exist:**
   - Run: `git branch --list <branch-name>`
   - If exists: Error with suggestion to use different name or switch to existing

## Branch Creation Workflow

**Step 1: Parse and Validate Input**
```
Input: User-provided branch name (may include variations of issue numbers)

1. Extract branch name from command arguments
2. Parse issue number if present (formats: " #42", "-#42", "-42", " 42")
3. Normalize to format: <type>/<description>-#<number> (if issue number present)
4. Validate against rules above
5. If invalid: Show specific errors with examples
```

**Step 2: Prepare Branch Creation**
```bash
# 1. Check out main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Confirm current branch and status
git status
```

**Step 3: Create and Switch to Branch**
```bash
# Create and switch to new branch
git checkout -b <validated-branch-name>

# Confirm creation
git branch --show-current
```

## Validation Error Messages

When branch name is invalid, provide clear feedback:

```
❌ Invalid branch name: '<input>'

Errors found:
- [Specific validation error 1]
- [Specific validation error 2]

Branch names must follow: <type>/<description> or <type>/<description>-#<number>

Valid types:
  feat, fix, docs, refactor, test, chore, hotfix, release,
  experiment, spike, deps, perf, security

Rules:
  ✅ Use lowercase letters and numbers only
  ✅ Use hyphens (-) to separate words
  ✅ Keep descriptions concise (2-5 words, max 50 chars)
  ✅ Optional issue number at end: -#123

Examples:
  ✅ feat/add-user-dashboard
  ✅ fix/login-timeout-error
  ✅ docs/update-api-guide
  ✅ feat/google-oauth-integration-#42
  ✅ hotfix/security-vulnerability-#123

Common mistakes:
  ❌ Add-User-Dashboard          → Use lowercase
  ❌ feat/login_timeout_error    → Use hyphens, not underscores
  ❌ feat/new-feature!           → No special characters
  ❌ docs/update                 → Too vague (but allowed by format)
  ❌ my-branch                   → Missing type prefix
```

## Success Output

After successful branch creation:

```
✅ Branch created: <branch-name>

Current branch: <branch-name>
Branched from: main (up to date)

Next steps:
1. Make your changes
2. Commit with: /commit
3. Push with: /push
4. Create PR with: /pr
```

## Issue Number Parsing Logic

**Accepted Input Formats:**
```bash
# All of these should normalize to: feat/new-feature-#42
feat/new-feature #42
feat/new-feature-#42
feat/new-feature-42
feat/new-feature #42
feat/new-feature  42

# Multiple words with issue number
fix/resolve-login-timeout #123
fix/resolve-login-timeout-#123
```

**Parsing Algorithm:**
1. Check if input contains `#` or ends with digits
2. Extract issue number (digits only)
3. Remove any trailing issue number fragments from description
4. Reassemble as: `<type>/<description>-#<number>`
5. Validate the resulting branch name

## Decision Logic Flow

```
Input received
├─ Is git repository?
│  ├─ No → Error: "Not a git repository"
│  └─ Yes → Continue
│
├─ Parse and normalize branch name
│  ├─ Extract issue number if present
│  └─ Format to standard structure
│
├─ Validate branch name format
│  ├─ Invalid → Show validation errors and examples
│  └─ Valid → Continue
│
├─ Check working tree status
│  ├─ Uncommitted changes → BLOCK: "Commit or stash changes first"
│  └─ Clean → Continue
│
├─ Check if branch already exists
│  ├─ Exists → Error: "Branch exists, use different name or: git checkout <name>"
│  └─ Doesn't exist → Continue
│
├─ Switch to main branch
│  └─ Pull latest changes
│
└─ Create and switch to new branch
   └─ Show success message with next steps
```

## Important Notes

- **ALWAYS start from latest main** - Ensures clean branching point
- **BLOCK on dirty working tree** - Prevents mixing work from different contexts
- **Validate before executing** - Catch errors early with clear feedback
- **Educate on conventions** - Show examples when validation fails
- **Parse issue numbers flexibly** - Accept common formats, normalize to standard
- **Never overwrite existing branches** - Prevents accidental data loss

## Examples

**Valid Usage:**
```bash
# Simple feature branch
/branch feat/add-user-dashboard

# Bug fix with issue number (various formats accepted)
/branch fix/login-timeout-error-#58
/branch fix/login-timeout-error #58
/branch fix/login-timeout-error 58

# Documentation update
/branch docs/update-readme

# Hotfix with issue reference
/branch hotfix/security-vulnerability-#123

# Performance improvement
/branch perf/optimize-queries
```

**Will Be Rejected:**
```bash
# Uppercase letters
/branch Feat/NewFeature

# Underscores instead of hyphens
/branch feat/new_feature

# Special characters
/branch feat/new-feature!

# Missing type prefix
/branch my-new-branch

# Invalid type
/branch feature/add-dashboard
```

## Guidance References

This command enforces conventions from:
- `core/development/git-best-practices.md` (lines 103-246) - Branch naming strategy
- `core/development/git-best-practices.md` (lines 554-600) - Feature branch workflow

**Pattern Applied:**
- Consistent branch naming enables clear project history
- Starting from latest main prevents merge conflicts
- Clean working tree ensures focused, atomic work
