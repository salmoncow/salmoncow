# GitHub Actions Setup Guide

This guide explains how to configure GitHub Actions for automated Firebase Hosting deployments.

## Overview

This project uses GitHub Actions for continuous deployment with four workflows:

1. **Production Deployment** (`deploy-production.yml`) - Deploys hosting to production on push to `main`
2. **Preview Deployments** (`deploy-preview.yml`) - Creates preview channels for pull requests
3. **Backend Deployment** (`deploy-backend.yml`) - Deploys Firestore rules, indexes, and Cloud Functions (manual `workflow_dispatch` only as of initial rollout)
4. **Cleanup Previews** (`cleanup-previews.yml`) - Manages expired preview channels (optional, manual/scheduled)

## Prerequisites

- Firebase project created and configured (`salmoncow`)
- GitHub repository with admin access
- Google Cloud Console access (for creating service account)
- Required Google Cloud APIs enabled on the project (see Step 0)

### Step 0: Enable Required Google Cloud APIs

Firebase and Cloud Functions rely on several Google Cloud APIs. Most are auto-enabled by `firebase-tools` on first deploy, but **`cloudbilling.googleapis.com` must be enabled manually** — `firebase-tools` uses it to verify Blaze billing for 2nd-gen Cloud Functions and will fail the deploy with a 403 ("Cloud Billing API has not been used in project ... before or it is disabled") if it is off.

```bash
PROJECT=salmoncow
gcloud services enable cloudbilling.googleapis.com --project=$PROJECT

# Verify
gcloud services list --enabled --project=$PROJECT \
  --filter="config.name:cloudbilling" --format="value(config.name)"
# Expect: cloudbilling.googleapis.com
```

APIs auto-enabled by `firebase-tools` during deploys (no manual action needed):
- `cloudfunctions.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`
- `run.googleapis.com`, `eventarc.googleapis.com`, `pubsub.googleapis.com`, `storage.googleapis.com`
- `firestore.googleapis.com`, `firebaseextensions.googleapis.com`

> **Note:** the deploy service account needs `serviceusage.services.use` to *call* these APIs, but enabling them requires project-admin rights. API enablement is a one-time project prerequisite, not a per-deploy action.

## Setup Instructions

> 📌 **Important:** Firebase has deprecated `firebase login:ci` tokens in favor of service account authentication. This guide uses the modern, recommended approach with Google Cloud service accounts for better security and IAM integration.

### Step 1: Create Firebase Service Account

Firebase now uses **service account authentication** instead of CI tokens. This provides:
- ✅ Better security with scoped IAM permissions
- ✅ No token expiration issues
- ✅ Integration with Google Cloud IAM
- ✅ Future-proof (won't be deprecated)

Follow these steps:

#### 1.1 Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project (`salmoncow`)
3. Navigate to **IAM & Admin** → **Service Accounts**

#### 1.2 Create Service Account

1. Click **"+ CREATE SERVICE ACCOUNT"**
2. Fill in the details:
   - **Service account name**: `github-actions-deploy` (or your preference)
   - **Service account ID**: Auto-generated (e.g., `github-actions-deploy@salmoncow.iam.gserviceaccount.com`)
   - **Description**: "Service account for GitHub Actions Firebase deployments"
3. Click **"CREATE AND CONTINUE"**

#### 1.3 Grant Permissions

**For hosting-only deploys (`deploy-production.yml` / `deploy-preview.yml`):**
- **Firebase Hosting Admin** (`roles/firebasehosting.admin`) - deploy to Firebase Hosting
- **API Keys Viewer** (`roles/serviceusage.apiKeysViewer`) - access Firebase config
- **Service Account User** (`roles/iam.serviceAccountUser`) - act as other service accounts

**Additional roles required by `deploy-backend.yml`** (Firestore + Cloud Functions):
- **Firebase Rules Admin** (`roles/firebaserules.admin`) - deploy `firestore.rules`
- **Cloud Datastore Index Admin** (`roles/datastore.indexAdmin`) - deploy `firestore.indexes.json`
- **Cloud Functions Developer** (`roles/cloudfunctions.developer`) - deploy functions
- **Cloud Run Developer** (`roles/run.developer`) - update 2nd-gen function Cloud Run services
- **Artifact Registry Writer** (`roles/artifactregistry.writer`) on repo `us-central1/gcf-artifacts` - push function images (scope this at the repo level, not project-wide)
- **Storage Object Admin** (`roles/storage.objectAdmin`) on the three Cloud Functions source/upload buckets (scope this at the bucket level, not project-wide):
  - `gs://gcf-sources-<project-number>-us-central1`
  - `gs://gcf-v2-sources-<project-number>-us-central1`
  - `gs://gcf-v2-uploads-<project-number>.us-central1.cloudfunctions.appspot.com`

**Apply the additional backend roles via gcloud:**

```bash
PROJECT=salmoncow
SA=github-actions-deploy@${PROJECT}.iam.gserviceaccount.com
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
REGION=us-central1

# Project-level
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA --role=roles/firebaserules.admin    --condition=None
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA --role=roles/datastore.indexAdmin   --condition=None
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA --role=roles/cloudfunctions.developer --condition=None
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA --role=roles/run.developer          --condition=None

# Repo-scoped Artifact Registry
gcloud artifacts repositories add-iam-policy-binding gcf-artifacts \
  --location=$REGION --project=$PROJECT \
  --member=serviceAccount:$SA --role=roles/artifactregistry.writer

# Bucket-scoped Storage (3 buckets)
for BUCKET in \
  gcf-sources-${PROJECT_NUMBER}-${REGION} \
  gcf-v2-sources-${PROJECT_NUMBER}-${REGION} \
  gcf-v2-uploads-${PROJECT_NUMBER}.${REGION}.cloudfunctions.appspot.com ; do
  gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
    --member=serviceAccount:$SA --role=roles/storage.objectAdmin
done
```

> **Known limitation — callable function `run.invoker` grant:** `roles/run.developer` (chosen over `roles/run.admin` for least-privilege) does **not** include `run.setIamPolicy`. `firebase-tools` cannot auto-grant `allUsers → roles/run.invoker` on new callable 2nd-gen functions. After the first deploy of any **new** callable, run this once as a maintainer:
> ```bash
> gcloud run services add-iam-policy-binding <service-name> \
>   --region=us-central1 --member=allUsers --role=roles/run.invoker
> ```
> Existing callables (`setuserrole`) already have this binding; this only applies when a new callable function is added.

Click **"CONTINUE"** then **"DONE"** for the hosting roles in the console; apply backend roles via the gcloud block above.

#### 1.4 Create and Download Key

1. Find your new service account in the list
2. Click the **three dots** (⋮) → **Manage keys**
3. Click **"ADD KEY"** → **"Create new key"**
4. Select **JSON** format
5. Click **"CREATE"**
6. The JSON file will download automatically

**⚠️ Important Security Notes:**
- This JSON file contains sensitive credentials
- Store it securely and never commit it to version control
- You'll use this entire JSON content as a GitHub secret
- Delete the downloaded file after adding it to GitHub secrets

### Step 2: Configure GitHub Repository Secrets and Variables

Navigate to your GitHub repository settings:
1. Go to **Settings** → **Secrets and variables** → **Actions**

#### Required Secrets

**Firebase Service Account:**

Click **New repository secret** and add:
```
Name: FIREBASE_SERVICE_ACCOUNT
Value: <entire contents of the JSON file you downloaded>
```

**How to add the JSON:**
1. Open the downloaded JSON file in a text editor
2. Copy the **entire contents** (it should start with `{` and end with `}`)
3. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT` secret
4. The JSON should look similar to:
   ```json
   {
     "type": "service_account",
     "project_id": "salmoncow",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "github-actions-deploy@salmoncow.iam.gserviceaccount.com",
     ...
   }
   ```

**Firebase Configuration Secrets (6 secrets):**

Click **New repository secret** for each of these values from your Firebase project settings (Project Settings → General → Your apps):

```
Name: VITE_FIREBASE_API_KEY
Value: <your-firebase-api-key>

Name: VITE_FIREBASE_AUTH_DOMAIN
Value: <your-project-id>.firebaseapp.com

Name: VITE_FIREBASE_STORAGE_BUCKET
Value: <your-project-id>.firebasestorage.app

Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: <your-messaging-sender-id>

Name: VITE_FIREBASE_APP_ID
Value: <your-app-id>

Name: VITE_FIREBASE_MEASUREMENT_ID
Value: <your-measurement-id>
```

**Note:** These Firebase config values are safe to expose client-side (they're public in your deployed app), but storing them as secrets keeps them out of public workflows and makes environment management easier.

#### Required Variables

**Firebase Project ID:**

Click the **Variables** tab, then **New repository variable**:
```
Name: VITE_FIREBASE_PROJECT_ID
Value: salmoncow
```

**Why use a variable instead of a secret?**
- Project ID is non-sensitive and visible in URLs and public configuration
- Variables are easier to view and update without re-entering the value
- Workflows can use variables in output messages and URLs
- Follows GitHub's best practice: secrets for sensitive data, variables for configuration

### Step 3: Verify Workflow Configuration

The workflows are pre-configured and ready to use. Verify the configuration:

1. Check `.github/workflows/deploy-production.yml`
2. Check `.github/workflows/deploy-preview.yml`
3. Check `.github/workflows/cleanup-previews.yml`

No modifications should be needed if you're using the default Firebase project.

### Step 4: Test the Workflows

#### Test Preview Deployment

1. Create a feature branch:
   ```bash
   git checkout -b test/github-actions-setup
   ```

2. Make a small change and commit:
   ```bash
   echo "<!-- Testing GitHub Actions -->" >> src/index.html
   git add src/index.html
   git commit -m "test: verify GitHub Actions preview deployment"
   ```

3. Push and create a pull request:
   ```bash
   git push -u origin test/github-actions-setup
   gh pr create --title "Test: GitHub Actions Setup" --body "Testing preview deployment workflow"
   ```

4. Check the PR for:
   - ✅ Workflow run in the "Checks" tab
   - ✅ Preview URL comment on the PR
   - ✅ Preview site loads correctly

#### Test Production Deployment

1. Merge the test PR to `main`:
   ```bash
   gh pr merge --squash
   ```

2. Switch to main and pull:
   ```bash
   git checkout main
   git pull
   ```

3. Check the Actions tab:
   - ✅ Production deployment workflow runs
   - ✅ Deployment completes successfully
   - ✅ Production site updated

## Workflow Details

### Production Deployment Workflow

**Trigger:** Push to `main` branch
**Runtime:** ~3-5 minutes
**Steps:**
1. Checkout code
2. Setup Node.js 24 with npm caching
3. Install dependencies
4. Create `.env` from GitHub secrets
5. Build project with Vite (`npm run build`)
6. Deploy to Firebase Hosting

**Output:** Live production site at `https://<project-id>.web.app`

### Preview Deployment Workflow

**Trigger:** Pull request to `main` branch
**Runtime:** ~3-5 minutes
**Steps:**
1. Checkout code
2. Setup Node.js 24 with npm caching
3. Install dependencies
4. Create `.env` from GitHub secrets
5. Build project with Vite (`npm run build`)
6. Deploy to preview channel (`pr-<number>`)
7. Comment on PR with preview URL

**Output:** Preview site at `https://<project-id>--pr-<number>-<hash>.web.app`
**Expiration:** 7 days

### Backend Deployment Workflow

**Trigger:** Manual (`workflow_dispatch`) only, as of initial rollout. A `push: main` path-filtered trigger is staged as a commented block in the workflow and tracked as a follow-up.
**Runtime:** ~40–60 s (no changes) / ~2–4 min (with rebuild)
**Targets input:** comma-separated subset of `firestore,functions` (default: both)
**Steps:**
1. Checkout code
2. Setup Node.js 20 with npm caching for root + `functions/`
3. `npm ci --prefix functions` + `npm run build --prefix functions` (predeploy is also wired in `firebase.json`)
4. Install `firebase-tools@15.15.0` (pinned exact)
5. Write `FIREBASE_SERVICE_ACCOUNT` to `$RUNNER_TEMP` with `chmod 600`
6. `firebase deploy --project salmoncow --only <targets> --force --non-interactive`
7. Remove the service-account key file

**Manual trigger:**
```bash
gh workflow run deploy-backend.yml --ref main -f targets=firestore,functions
```

### Cleanup Preview Workflow

**Trigger:** Manual or weekly schedule (Sundays at midnight UTC)
**Runtime:** ~1-2 minutes
**Purpose:** List and verify preview channel cleanup

**Note:** Firebase automatically removes expired preview channels. This workflow provides visibility and manual trigger capability.

## Free Tier Optimization

These workflows are optimized for GitHub Actions free tier:

**Optimizations Applied:**
- ✅ 10-minute timeout limits
- ✅ npm caching for faster installs
- ✅ `--prefer-offline` flag for npm ci
- ✅ Minimal workflow steps
- ✅ No parallel jobs (sequential only)

**Estimated Usage:**
- Public repository: Unlimited minutes (free)
- Private repository: ~15-30 min/month (well within 2,000 min/month free tier)

## Troubleshooting

### Workflow fails with "Service account authentication failed"

**Solution:**
1. Verify the `FIREBASE_SERVICE_ACCOUNT` secret contains the complete JSON
2. Check that the JSON is valid (starts with `{`, ends with `}`)
3. Ensure the service account has the required permissions (Firebase Hosting Admin)

### Workflow fails with "Permission denied" or "403 Forbidden"

**Solution:**
1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Find your service account
3. Verify it has these roles:
   - Firebase Hosting Admin
   - API Keys Viewer
   - Service Account User
4. For `deploy-backend.yml` failures, verify the additional backend roles from Step 1.3 are also present.

### `deploy-backend.yml` fails with "Cloud Billing API has not been used in project ... before or it is disabled"

**Cause:** `firebase-tools` calls `cloudbilling.googleapis.com` during 2nd-gen Cloud Function preparation to verify Blaze is active. The API is not enabled by default on new projects, even when the project itself is on Blaze.

**Solution:**
```bash
gcloud services enable cloudbilling.googleapis.com --project=salmoncow
# Wait ~30-60 seconds for propagation, then re-run the workflow
```
Full context in the "Step 0: Enable Required Google Cloud APIs" section above.

### Build fails with "Environment variable not found"

**Solution:** Verify all 7 Firebase config secrets are added to GitHub repository settings.

### Preview URL not posted to PR

**Solution:** Check that the workflow has permission to comment on PRs:
1. Go to Settings → Actions → General → Workflow permissions
2. Enable "Read and write permissions"
3. Save changes

### Service account key needs rotation

**Solution:** Service account keys don't expire, but should be rotated periodically for security:
1. Create a new key following Step 1.4
2. Update the `FIREBASE_SERVICE_ACCOUNT` secret with the new JSON
3. Delete the old key from Google Cloud Console (IAM & Admin → Service Accounts → Keys)

### Deployment succeeds but site not updated

**Solution:** Check that:
1. Build completed successfully (check workflow logs)
2. Correct Firebase project ID is used
3. `.env` file was created properly (check "Create environment file" step output)

## Monitoring and Notifications

### GitHub Actions Workflow Status

View workflow runs:
- Repository → Actions tab
- Filter by workflow name or branch

### Firebase Console

View deployments:
- [Firebase Console](https://console.firebase.google.com/project/salmoncow/hosting)
- Hosting → Dashboard
- View release history, preview channels, and usage

### Optional: Deployment Notifications

Add Discord/Slack notifications (see `.prompts/deployment-cicd.md` for patterns).

## Security Best Practices

✅ **Already Implemented:**
- Service account authentication (modern IAM approach)
- Secrets stored in GitHub (never committed to repo)
- `.env` file is gitignored
- Service account has scoped permissions (Hosting Admin only)
- Workflow uses read-only checkout
- Service account key removed from runner after use (cleanup workflow)

⚠️ **Additional Recommendations:**
- Rotate service account keys annually for security
- Enable branch protection on `main` (require PR reviews)
- Require workflow success before merging PRs
- Monitor GitHub Actions usage (Settings → Billing)
- Audit service account permissions periodically
- Consider enabling Cloud Audit Logs for deployment tracking

## Updating Workflows

To modify workflows:

1. Create a feature branch:
   ```bash
   git checkout -b feat/update-workflows
   ```

2. Edit workflow files in `.github/workflows/`

3. Test changes on the feature branch:
   - Push to test preview workflow
   - Merge to main to test production workflow

4. Document changes in this file

## Additional Resources

**Project Documentation:**
- `.prompts/core/deployment/deployment-principles.md` - Comprehensive CI/CD patterns
- `.prompts/platforms/firebase/firebase-best-practices.md` - Firebase-specific guidance
- `.prompts/platforms/firebase/firebase-deployment.md` - Firebase deployment workflows
- `.prompts/platforms/firebase/firebase-finops.md` - Cost optimization strategies

**External Resources:**
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

## Support

For issues or questions:
1. Check workflow logs in Actions tab
2. Review troubleshooting section above
3. Consult project documentation in `.prompts/`
4. Check Firebase Console for deployment status

---

**Last Updated:** 2026-04-20
**Workflow Version:** 1.1.0
**Maintained by:** Project team
