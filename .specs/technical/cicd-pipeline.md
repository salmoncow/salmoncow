# Technical Specification: CI/CD Pipeline (GitHub Actions)

**Project**: SalmonCow
**Version**: 1.0.0
**Last Updated**: 2026-01-29
**Status**: Implemented (Phase 2)
**Platform**: GitHub Actions

---

## Overview

This specification defines the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the SalmonCow project using GitHub Actions. The pipeline automates testing, building, and deployment to Firebase Hosting.

**Constitutional Reference**: [.specs/constitution.md](.specs/constitution.md) §II.1 - Current Architectural State

**Current State**: Phase 2 (GitHub Actions automation implemented)
**Next Phase**: Phase 3 (Testing integration, advanced CI/CD)

---

## I. Pipeline Architecture

### I.1 Workflow Triggers

**Main Branch** (production deployment):
```yaml
on:
  push:
    branches: [main]
```

**Pull Requests** (preview deployment):
```yaml
on:
  pull_request:
    branches: [main]
```

**Manual Trigger** (on-demand deployment):
```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - preview
          - production
```

### I.2 Pipeline Stages

**Stage 1: Checkout & Setup**
- Checkout code
- Set up Node.js (LTS version)
- Cache dependencies

**Stage 2: Install Dependencies**
- Run `npm ci` (clean install)
- Verify package-lock.json integrity

**Stage 3: Environment Configuration**
- Create `.env` from GitHub secrets
- Validate required environment variables

**Stage 4: Build**
- Run `npm run build`
- Verify build output exists
- Check bundle sizes

**Stage 5: Deploy**
- Deploy to Firebase Hosting
- Generate preview URL (for PRs)
- Deploy to production (for main branch)

**Stage 6: Post-Deploy**
- Comment PR with preview URL (for PRs)
- Notify on deployment success/failure

---

## II. GitHub Actions Configuration

### II.1 Workflow Files

The actual workflow implementations are in:
- `.github/workflows/deploy-production.yml` - Production deployment on push to main
- `.github/workflows/deploy-preview.yml` - Preview deployment on pull requests

> **Note**: See the actual workflow files for current implementation.
> This spec documents the principles and architecture, not the specific YAML which may evolve.

### II.2 Workflow Principles

**Production Deployment**:
- Triggers on push to `main` branch and manual dispatch
- Uses concurrency control (one deployment at a time)
- Pipeline: checkout → setup → install → build → deploy

**Preview Deployment**:
- Triggers on pull requests to `main`
- Auto-expires preview channels after 7 days
- Comments on PR with preview URL

---

## III. GitHub Secrets Configuration

### III.1 Required Secrets

**Repository Settings → Secrets and variables → Actions**

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging sender ID | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Firebase Console → Project Settings → General |
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON | Firebase Console → Project Settings → Service Accounts → Generate new private key |

**Notes**:
- `GITHUB_TOKEN` is automatically provided by GitHub Actions (no setup needed)
- `FIREBASE_SERVICE_ACCOUNT` is the full JSON content of the service account key
- All `VITE_*` secrets are safe to expose on client (they're public anyway)

### III.2 Secret Setup Process

**Step 1**: Generate Firebase Service Account
```bash
# In Firebase Console:
# 1. Go to Project Settings → Service Accounts
# 2. Click "Generate new private key"
# 3. Download JSON file (keep secure!)
```

**Step 2**: Add Secrets to GitHub
```bash
# In GitHub repository:
# 1. Go to Settings → Secrets and variables → Actions
# 2. Click "New repository secret"
# 3. Add each secret from above table
# 4. For FIREBASE_SERVICE_ACCOUNT: Copy entire JSON content
```

**Step 3**: Verify Secrets
```yaml
# Add to workflow for testing (then remove):
- name: Check secrets (REMOVE AFTER TESTING)
  run: |
    echo "API Key exists: ${{ secrets.VITE_FIREBASE_API_KEY != '' }}"
    echo "Service account exists: ${{ secrets.FIREBASE_SERVICE_ACCOUNT != '' }}"
```

---

## IV. Deployment Process

### IV.1 Production Deployment (from main branch)

**Trigger**: Push to `main` branch

**Process**:
1. Developer merges PR to `main`
2. GitHub Actions triggered automatically
3. Pipeline runs: checkout → setup → install → build → deploy
4. Deployment to Firebase Hosting live channel
5. Production site updated: https://your-app.web.app

**Manual Deployment** (fallback):
```bash
# If CI/CD fails, manual deployment still works
npm run build
firebase deploy --only hosting
```

### IV.2 Preview Deployment (from pull requests)

**Trigger**: Open or update PR to `main`

**Process**:
1. Developer opens PR or pushes to PR branch
2. GitHub Actions triggered automatically
3. Pipeline runs: checkout → setup → install → build → deploy
4. Preview channel created (expires in 7 days)
5. Bot comments on PR with preview URL

**Preview URL Format**:
```
https://your-project-id--pr-<number>-<hash>.web.app
```

**Example**:
```
PR #42: https://salmoncow-app--pr-42-abc123.web.app
```

### IV.3 Manual Deployment (workflow_dispatch)

**Trigger**: Manual workflow run from GitHub Actions UI

**Use cases**:
- Hotfix deployment
- Rollback to previous commit
- Test deployment process

**Process**:
1. Go to Actions tab in GitHub
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Select branch and environment
5. Click "Run workflow" button

---

## V. Performance & Optimization

### V.1 Build Performance Targets

**From constitution** (§III.3):
- Build time: <2 minutes for production
- CI/CD total time: <5 minutes (checkout → deploy)

**Current Benchmarks** (estimated):
- Checkout: ~10 seconds
- Setup Node + cache: ~20 seconds
- Install dependencies: ~30 seconds (with cache)
- Build: ~30 seconds
- Deploy: ~60 seconds
- **Total**: ~2.5 minutes

**Optimization Strategies**:
1. **Dependency caching**: `actions/setup-node@v4` with `cache: 'npm'`
2. **Parallel jobs**: Run lint/test in parallel (future Phase 3)
3. **Incremental builds**: Vite already does this
4. **Skip duplicate runs**: `concurrency` settings

### V.2 Cost Optimization

**GitHub Actions Free Tier**:
- Public repos: Unlimited minutes
- Private repos: 2,000 minutes/month (free tier)

**Firebase Hosting Free Tier**:
- 10GB storage
- 360MB/day transfer
- Unlimited preview channels (auto-expire after 7 days)

**Cost Constraints** (from constitution §VI):
- MUST stay within free tiers
- Monitor usage monthly
- Optimize if approaching limits

---

## VI. Testing Integration (Phase 3+)

**When to implement**: Phase 2 testing triggered (10+ modules OR production launch)

**Test stage to add** (before build):
```yaml
- name: Run unit tests
  run: npm test

- name: Check code coverage
  run: npm run test:coverage

- name: Run linting
  run: npm run lint
```

**Fail fast strategy**:
- Fail on test failures (block deployment)
- Fail on coverage <80% (warning first, block later)
- Fail on critical linting errors

---

## VII. Security Considerations

### VII.1 Secret Management

**Best Practices**:
- ✅ Use GitHub encrypted secrets (never commit secrets)
- ✅ Rotate service account keys annually
- ✅ Use least-privilege service accounts
- ✅ Audit secret access (GitHub logs)
- ❌ Never echo secrets in logs
- ❌ Never store secrets in code or `.env` (in repo)

### VII.2 Dependency Security

**Future enhancements** (Phase 3+):
```yaml
- name: Audit dependencies
  run: npm audit --audit-level=high

- name: Check for vulnerabilities
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
```

### VII.3 Branch Protection

**Configure in GitHub Settings → Branches → main**:
- ✅ Require pull request before merging
- ✅ Require status checks to pass (CI/CD success)
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ❌ Don't allow force pushes
- ❌ Don't allow deletions

---

## VIII. Monitoring & Alerts

### VIII.1 Workflow Monitoring

**GitHub provides built-in monitoring**:
- Actions tab shows all workflow runs
- Email notifications on failure (configurable)
- Status badges for README

**Add status badge to README.md**:
```markdown
![Deploy to Production](https://github.com/username/salmoncow/actions/workflows/deploy-production.yml/badge.svg)
```

### VIII.2 Deployment Metrics (Phase 2+)

**Track quarterly** (with architectural review):
- Deployment frequency (target: 1+/week when Phase 2)
- Deployment success rate (target: >95%)
- Average deployment time (target: <5 min)
- Rollback frequency (target: <5%)

### VIII.3 Alerting (Phase 3+)

**Future integrations**:
- Slack notifications on deployment
- Discord webhooks for team updates
- Email alerts on failures
- Firebase Performance Monitoring integration

---

## IX. Rollback Strategy

### IX.1 Rollback via Git

**Option 1: Revert commit**
```bash
git revert <commit-hash>
git push origin main
# Triggers automatic deployment of previous state
```

**Option 2: Rollback to previous commit**
```bash
git reset --hard <previous-commit-hash>
git push --force origin main
# ⚠️ Requires force push (disable branch protection temporarily)
```

### IX.2 Rollback via Firebase Console

**Manual rollback**:
1. Go to Firebase Console → Hosting
2. View deployment history
3. Click "..." on previous version
4. Click "Rollback"

**Rollback time**: ~1 minute (instant CDN update)

### IX.3 Rollback Decision Criteria

**When to rollback**:
- Critical bug in production
- Performance degradation >50%
- Security vulnerability detected
- User-facing errors >5% of requests

**Rollback process**:
1. Identify issue
2. Decide: hotfix vs. rollback
3. If rollback: Use Firebase Console (fastest)
4. If hotfix: Create PR, merge, auto-deploy
5. Post-mortem: Document in architectural-decision-log.md

---

## X. Implementation Checklist

### Phase 1 → Phase 2 Transition

**Prerequisites**:
- [ ] Daily deployments OR team size ≥2 (trigger met)
- [ ] Firebase service account generated
- [ ] GitHub secrets configured
- [ ] Workflow files created

**Implementation Steps**:
1. [ ] Create `.github/workflows/deploy-production.yml`
2. [ ] Create `.github/workflows/deploy-preview.yml`
3. [ ] Add Firebase service account to GitHub secrets
4. [ ] Add all `VITE_*` variables to GitHub secrets
5. [ ] Test with manual workflow dispatch
6. [ ] Test with preview deployment (create test PR)
7. [ ] Enable branch protection on `main`
8. [ ] Document deployment process in README.md
9. [ ] Update architectural-decision-log.md (Phase 1 → Phase 2)
10. [ ] Update constitution.md (§II.1 Deployment: Phase 2)

**Validation**:
- [ ] Manual workflow dispatch succeeds
- [ ] Preview deployment works for test PR
- [ ] Production deployment works on merge to main
- [ ] Rollback tested via Firebase Console
- [ ] Team trained on new workflow

---

## XI. Future Enhancements

### XI.1 Phase 3: Testing Integration

**When**: Testing Phase 2 triggered (10+ modules OR production launch)

**Additions**:
- Unit test execution in pipeline
- Code coverage reporting
- Linting enforcement
- Test failure blocking

### XI.2 Phase 3+: Advanced CI/CD

**Possible enhancements**:
- Canary deployments (gradual rollout)
- A/B testing integration
- Performance regression testing
- Automated security scanning (Dependabot, Snyk)
- Visual regression testing
- Lighthouse CI for performance metrics

### XI.3 Multi-Environment Setup (Phase 3+)

**When needed**: Staging environment required

**Environments**:
- Development (preview channels)
- Staging (dedicated Firebase project)
- Production (current project)

**Configuration**:
- Separate Firebase projects
- Environment-specific secrets
- Different deployment workflows

---

## XII. Maintenance

### XII.1 Quarterly Review

**Review Items**:
- Update Node.js version (LTS)
- Update GitHub Actions versions (@v4 → @v5)
- Review deployment metrics
- Check for GitHub Actions new features
- Audit secret rotation dates

### XII.2 Dependency Updates

**GitHub Actions**:
- `actions/checkout@v4` → Check for v5
- `actions/setup-node@v4` → Check for updates
- `FirebaseExtended/action-hosting-deploy@v0` → Check for updates

**Update Process**:
1. Check action release notes
2. Update version in workflow files
3. Test with manual workflow dispatch
4. Merge if successful

---

## XIII. References

**Constitutional Constraints**:
- [.specs/constitution.md](.specs/constitution.md) §II.1 - Current architectural state (Deployment Phase 1)
- [.specs/constitution.md](.specs/constitution.md) §II.2 - Evolution triggers
- [.specs/constitution.md](.specs/constitution.md) §III.4 - Code quality standards (git workflow)

**Related Specifications**:
- [.specs/technical/build-system.md](.specs/technical/build-system.md) - Vite build configuration
- [.specs/technical/firebase-deployment.md](.specs/technical/firebase-deployment.md) - Firebase Hosting setup

**Foundational Patterns**:
- CI/CD principles are documented directly in this specification (previously in core prompts, consolidated here)

**External Documentation**:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting with GitHub Actions](https://firebase.google.com/docs/hosting/github-integration)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Version History**:
- 1.0.0 (2025-12-11): Initial CI/CD pipeline specification (migrated from deployment-principles.md, forward-looking for Phase 2)
