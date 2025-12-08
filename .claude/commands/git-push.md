---
description: Push current branch to remote following project best practices
---

Push current branch to origin.

**Steps:**

1. Check for uncommitted changes (`git status --porcelain`)
   - If dirty, warn and stop - ask user to commit or stash first

2. Get current branch (`git branch --show-current`)
   - If `main` or `master`, warn and ask for confirmation

3. Push to origin:
   - No upstream: `git push -u origin <branch>`
   - Has upstream: `git push`

4. On success, show PR link: `https://github.com/<owner>/<repo>/compare/<branch>`

**Safety:**
- Never force push without explicit user request
- Block push if uncommitted changes exist
- Warn before pushing directly to main/master
