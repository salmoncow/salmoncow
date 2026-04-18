# Owner Bootstrap Runbook

**One-time procedure** to grant the first `owner` custom claim on a Firebase
Auth user. After this runs, all future role changes go through the
`setUserRole` callable inside the Salmoncow Admin Portal.

You should only run this once, as part of initial project setup, or if you
ever need to re-bootstrap after losing owner access.

---

## Prerequisites

1. The target user has **signed in to Salmoncow at least once** via Google.
   (The `onUserCreate` trigger must have fired for their uid — otherwise
   there's no Auth record to attach a claim to, and no `users/{uid}` doc.)
2. Firebase CLI authenticated: `firebase login` and `firebase use salmoncow`.
3. You have IAM permission on the Firebase project to create service-account
   keys (Project Owner / IAM Admin).
4. Node 20+ and `npm` available (matches repo `engines`).

---

## Get the target UID

Find the Firebase Auth UID of the account you want to promote:

```bash
# Via Firebase CLI (prints a JSON blob; copy the uid field)
firebase auth:export users.json --project salmoncow
cat users.json | grep -B1 your-email@example.com
rm users.json   # clean up — this file contains PII for all users
```

Or: Firebase Console → Authentication → Users → click your row → copy UID.

---

## Download a service-account key

Admin SDK needs elevated credentials. We use a temporary service-account key
and delete it immediately after.

1. Open [Google Cloud Console → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=salmoncow).
2. Find `firebase-adminsdk-...@salmoncow.iam.gserviceaccount.com` (the default
   Firebase admin SDK service account). Don't create a new one — reuse this.
3. Click it → **Keys** tab → **Add Key** → **Create new key** → **JSON**.
4. Save the downloaded file to `.secrets/sa-key.json` (the repo's `.secrets/`
   directory is gitignored — verify with `git check-ignore .secrets/`).
   Alternatively, put it anywhere outside the repo.

⚠️ **Never commit this key.** If `git status` ever shows it, stop and run
`git rm --cached` before committing anything.

---

## Run the script

```bash
FIREBASE_SA_KEY=".secrets/sa-key.json" \
TARGET_UID="your-firebase-auth-uid" \
npm run bootstrap:owner
```

Preview first (recommended) with `DRY_RUN=1`:

```bash
DRY_RUN=1 \
FIREBASE_SA_KEY=".secrets/sa-key.json" \
TARGET_UID="your-firebase-auth-uid" \
npm run bootstrap:owner
```

Expected success output:

```
─── bootstrap-owner ─────────────────────────────────────
project   : salmoncow
target uid: <your uid>
sa email  : firebase-adminsdk-...@salmoncow.iam.gserviceaccount.com
dry run   : NO (will write)
─────────────────────────────────────────────────────────
current claim role: user
✓ set custom claim role=owner
✓ updated users/{uid} mirror to role=owner
─────────────────────────────────────────────────────────
done. The user must sign out and back in (or wait up to ~1h)
for the new token to reflect the owner claim.
Next: delete the service-account key file from disk.
```

---

## Verify

1. **Claim set** — in the shell used by Firebase Admin SDK or via `firebase auth:export`:
   ```bash
   firebase auth:export users.json --project salmoncow
   grep -A1 '"localId": "<uid>"' users.json
   rm users.json
   ```
   Look for `"customAttributes":"{\"role\":\"owner\"}"`.

2. **Mirror doc updated** — Firebase Console → Firestore → `users/<uid>` →
   confirm `role: "owner"` and `roleChangedAt` set.

3. **Token refresh** — sign out of the Salmoncow app and sign back in.
   The Admin Portal nav link should now appear on your next load.

---

## Clean up the service-account key

As soon as the script exits successfully, delete the key:

```bash
rm .secrets/sa-key.json
```

Service-account keys that linger on disk are a common leak vector. If the
file is gone, it can't be stolen.

---

## Key rotation (if the key is ever exposed)

If you suspect the service-account key was leaked (committed by accident,
left on a shared machine, copy-pasted somewhere):

1. **Disable and delete the key immediately**:
   Cloud Console → IAM → Service Accounts → `firebase-adminsdk-…` → Keys →
   click the leaked key's three-dot menu → **Delete**.
2. **Audit** recent activity in Cloud Audit Logs for the service account.
3. **Re-create** a new key per the steps above only if you still need to
   run another bootstrap; otherwise don't.
4. **Check the `audit/` Firestore collection** in Salmoncow for any
   unexpected role-change entries during the exposure window.

Service-account compromise is more severe than a leaked user password —
treat it like a SEV2 incident.

---

## When would I run this again?

Only if:
- You lose access to your `owner` account entirely (no other owner exists).
- You need to promote a second account to `owner` and the existing owner is
  unavailable. (Normal case: the existing owner uses the Admin Portal's role
  dropdown instead.)

Day-to-day role management always goes through the Admin Portal, never
through this script.
