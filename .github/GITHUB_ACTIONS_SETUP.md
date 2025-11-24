# GitHub Actions Setup Guide

This guide explains how to configure GitHub Actions for automated Firebase Hosting deployments.

## Overview

This project uses GitHub Actions for continuous deployment with three workflows:

1. **Production Deployment** (`deploy-production.yml`) - Deploys to production on push to `main`
2. **Preview Deployments** (`deploy-preview.yml`) - Creates preview channels for pull requests
3. **Cleanup Previews** (`cleanup-previews.yml`) - Manages expired preview channels (optional, manual/scheduled)

## Prerequisites

- Firebase project created and configured (`base-website-dee90`)
- GitHub repository with admin access
- Google Cloud Console access (for creating service account)

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
2. Select your Firebase project (`base-website-dee90`)
3. Navigate to **IAM & Admin** → **Service Accounts**

#### 1.2 Create Service Account

1. Click **"+ CREATE SERVICE ACCOUNT"**
2. Fill in the details:
   - **Service account name**: `github-actions-deploy` (or your preference)
   - **Service account ID**: Auto-generated (e.g., `github-actions-deploy@base-website-dee90.iam.gserviceaccount.com`)
   - **Description**: "Service account for GitHub Actions Firebase deployments"
3. Click **"CREATE AND CONTINUE"**

#### 1.3 Grant Permissions

Add these roles to the service account:
- **Firebase Hosting Admin** - Required for deploying to Firebase Hosting
- **API Keys Viewer** - Required for accessing Firebase config
- **Service Account User** - Required for acting as the service account

Click **"CONTINUE"** then **"DONE"**

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

### Step 2: Configure GitHub Repository Secrets

Navigate to your GitHub repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

#### Required Secrets

**Firebase Service Account:**
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
     "project_id": "base-website-dee90",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "github-actions-deploy@base-website-dee90.iam.gserviceaccount.com",
     ...
   }
   ```

**Firebase Configuration (7 variables):**

These values are from your Firebase project settings (Project Settings → General → Your apps):

```
Name: VITE_FIREBASE_API_KEY
Value: <your-firebase-api-key>

Name: VITE_FIREBASE_AUTH_DOMAIN
Value: <your-project-id>.firebaseapp.com

Name: VITE_FIREBASE_PROJECT_ID
Value: base-website-dee90

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
   echo "<!-- Testing GitHub Actions -->" >> public/index.html
   git add public/index.html
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
2. Setup Node.js 18 with npm caching
3. Install dependencies
4. Create `.env` from GitHub secrets
5. Build project (`npm run build`)
6. Deploy to Firebase Hosting

**Output:** Live production site at `https://<project-id>.web.app`

### Preview Deployment Workflow

**Trigger:** Pull request to `main` branch
**Runtime:** ~3-5 minutes
**Steps:**
1. Checkout code
2. Setup Node.js 18 with npm caching
3. Install dependencies
4. Create `.env` from GitHub secrets
5. Build project (`npm run build`)
6. Deploy to preview channel (`pr-<number>`)
7. Comment on PR with preview URL

**Output:** Preview site at `https://<project-id>--pr-<number>-<hash>.web.app`
**Expiration:** 7 days

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
- [Firebase Console](https://console.firebase.google.com/project/base-website-dee90/hosting)
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
- `.prompts/deployment-cicd.md` - Comprehensive CI/CD patterns
- `.prompts/firebase-best-practices.md` - Firebase-specific guidance
- `.prompts/finops-free-tier-maximization.md` - Cost optimization strategies

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

**Last Updated:** 2025-11-08
**Workflow Version:** 1.0.0
**Maintained by:** Project team
