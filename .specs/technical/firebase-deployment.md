# Technical Specification: Firebase Deployment

**Project**: SalmonCow
**Version**: 1.0.0
**Last Updated**: 2025-12-11
**Firebase CLI Version**: Latest
**Status**: Active

---

## Overview

This specification defines the Firebase Hosting deployment process for the SalmonCow project. It covers both manual deployment (Phase 1) and automated deployment via GitHub Actions (Phase 2+).

**Constitutional Reference**: [.specs/constitution.md](.specs/constitution.md) §IV.1 - Approved Technology Stack (Firebase)

---

## I. Firebase Project Configuration

### I.1 Project Setup

**Firebase Project**: (Your project ID)
**Hosting Site**: (Your site name).web.app

**Initial Setup** (one-time):
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize Firebase in project
firebase init hosting
# Select:
# - Use existing project
# - Public directory: dist
# - Configure as SPA: Yes
# - Set up GitHub Actions: No (manual for Phase 1)
```

### I.2 Firebase Configuration File

**File**: `/home/td000/salmoncow/firebase.json`

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Content-Type",
            "value": "text/javascript; charset=utf-8"
          }
        ]
      }
    ]
  }
}
```

**Key Configuration**:
1. **public: "dist"**: Vite build output directory
2. **SPA rewrites**: All routes serve index.html (client-side routing)
3. **Cache headers**:
   - Hashed assets (*.js, *.css with hash): 1 year cache (immutable)
   - index.html: No cache (always fresh)
4. **Ignore**: Prevent deploying firebase.json, dotfiles, node_modules

---

## II. Deployment Process

### II.1 Manual Deployment (Phase 1 - Current)

**Full deployment workflow**:
```bash
# 1. Ensure latest code
git pull origin main

# 2. Install dependencies (if needed)
npm install

# 3. Build production bundle
npm run build
# Output: dist/ directory

# 4. Preview build locally (optional)
npm run preview
# Test at http://localhost:3000

# 5. Deploy to Firebase Hosting
firebase deploy --only hosting
# Deploys dist/ to Firebase

# 6. Verify deployment
# Open: https://your-app.web.app
```

**Quick deployment** (after first build):
```bash
npm run deploy
# Runs: npm run build && firebase deploy --only hosting
```

**Deployment output**:
```
=== Deploying to 'your-project-id'...

i  deploying hosting
i  hosting[your-project-id]: beginning deploy...
i  hosting[your-project-id]: found 15 files in dist
✔  hosting[your-project-id]: file upload complete
i  hosting[your-project-id]: finalizing version...
✔  hosting[your-project-id]: version finalized
i  hosting[your-project-id]: releasing new version...
✔  hosting[your-project-id]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-app.web.app
```

### II.2 Preview Channel Deployment

**Create preview channel**:
```bash
# Deploy to preview channel
firebase hosting:channel:deploy preview --expires 7d

# Output includes preview URL:
# Channel URL: https://your-project-id--preview-abc123.web.app
```

**Use cases**:
- Test changes before production
- Share with stakeholders for review
- QA testing

**Auto-expiration**:
- Default: 7 days
- Customize: `--expires 14d` or `--expires 24h`
- Firebase automatically cleans up expired channels

### II.3 Automated Deployment (Phase 2 - Planned)

**Via GitHub Actions** (see [.specs/technical/cicd-pipeline.md](.specs/technical/cicd-pipeline.md)):

**Production** (on push to main):
- Automatic deployment to live channel
- No manual intervention required

**Preview** (on pull request):
- Automatic deployment to preview channel
- PR comment with preview URL
- Auto-expires after 7 days

---

## III. Hosting Features

### III.1 Custom Domains (Future)

**When needed**: Production launch with custom domain

**Setup process**:
```bash
# 1. Add custom domain in Firebase Console
# Hosting → Add custom domain → Enter domain

# 2. Add DNS records (provided by Firebase)
# - Type A: Points to Firebase IPs
# - Or CNAME: Points to Firebase hostname

# 3. Wait for verification (up to 24 hours)

# 4. SSL certificate auto-provisioned
```

**Domain options**:
- Custom domain: www.yourapp.com
- Subdomain: app.yourcompany.com
- Apex domain: yourapp.com (requires A records)

### III.2 Redirect Rules

**Add to firebase.json** (if needed):
```json
{
  "hosting": {
    "redirects": [
      {
        "source": "/old-path",
        "destination": "/new-path",
        "type": 301
      },
      {
        "source": "/blog/:post*",
        "destination": "https://blog.example.com/:post",
        "type": 302
      }
    ]
  }
}
```

### III.3 Hosting Metrics

**View in Firebase Console**:
- Hosting → Usage tab
- Metrics available:
  - Total requests
  - Bandwidth usage
  - Most requested paths
  - Geographic distribution

**Free tier limits** (from constitution §VI.1):
- Storage: 10GB
- Transfer: 360MB/day
- Monitoring: Track weekly, alert at 70% (252MB/day)

---

## IV. Deployment Workflow Integration

### IV.1 Pre-Deployment Checklist

**Before deploying to production**:
- [ ] All changes committed to git
- [ ] Pull latest from main branch
- [ ] Dependencies up to date (`npm install`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Preview works locally (`npm run preview`)
- [ ] No secrets in code (check .env not committed)
- [ ] Environment variables configured correctly
- [ ] Test critical user flows locally

### IV.2 Post-Deployment Verification

**After deployment**:
- [ ] Visit production URL: https://your-app.web.app
- [ ] Test critical user flows:
  - Homepage loads
  - Authentication works
  - Navigation functional
  - No console errors
- [ ] Check Firebase Console for errors
- [ ] Verify hosting metrics (bandwidth usage)
- [ ] Monitor for 10-15 minutes for errors

**Rollback if**:
- Critical functionality broken
- Console errors affect >5% of users
- Performance degradation >50%
- Security issue discovered

### IV.3 Rollback Process

**Option 1: Firebase Console** (fastest):
```
1. Go to Firebase Console → Hosting
2. Click "Release history"
3. Find previous working version
4. Click "..." menu → "Rollback"
5. Confirm rollback
```

**Rollback time**: ~1 minute (instant CDN update)

**Option 2: Git Revert** (for audit trail):
```bash
# 1. Revert problematic commit
git revert <commit-hash>
git push origin main

# 2. Redeploy
npm run deploy
```

---

## V. Environment Configuration

### V.1 Environment Variables

**Never commit** `.env` file (contains Firebase config)

**.env** (local development, gitignored):
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**.env.example** (committed to repo):
```bash
# Firebase Configuration
# Get these from Firebase Console: Project Settings → General
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**GitHub Actions** (Phase 2):
- Variables stored in GitHub Secrets
- Injected during build process
- See [.specs/technical/cicd-pipeline.md](.specs/technical/cicd-pipeline.md) §III

---

## VI. Troubleshooting

### VI.1 Common Issues

**Issue**: `firebase deploy` fails with "Permission denied"
**Solution**:
```bash
# Re-authenticate
firebase logout
firebase login
```

**Issue**: Deployment succeeds but site shows old version
**Solution**:
```bash
# Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
# Or check Cache-Control headers in firebase.json
# Or clear browser cache
```

**Issue**: 404 on routes (e.g., /about, /profile)
**Solution**:
```json
// Ensure SPA rewrite in firebase.json:
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Issue**: Assets not loading (404 for JS/CSS)
**Solution**:
```bash
# Verify dist/ directory contains assets
ls -la dist/assets/

# Rebuild if empty
npm run build

# Check public directory in firebase.json
# Should be: "public": "dist"
```

**Issue**: Deployment exceeds free tier
**Solution**:
```bash
# Check current usage:
# Firebase Console → Hosting → Usage

# Optimize:
# 1. Enable caching headers (already in firebase.json)
# 2. Minimize bundle size (see build-system.md)
# 3. Use CDN for large assets (Firebase SDK already on CDN)
```

### VI.2 Debugging Deployments

**Check deployment status**:
```bash
# List recent deployments
firebase hosting:channel:list

# View deployment history
# Firebase Console → Hosting → Release history
```

**Check deployment logs**:
```bash
# View Firebase logs
firebase deploy --only hosting --debug
```

**Test before deploying**:
```bash
# Build locally
npm run build

# Serve dist/ directory locally
firebase serve --only hosting
# Test at http://localhost:5000
```

---

## VII. Security Considerations

### VII.1 Content Security Policy (Future Phase 2+)

**Add CSP header** (when needed):
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://www.gstatic.com; style-src 'self' 'unsafe-inline'"
          }
        ]
      }
    ]
  }
}
```

### VII.2 Security Headers (Production)

**Recommended headers** (add to firebase.json):
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ]
  }
}
```

---

## VIII. Monitoring & Analytics

### VIII.1 Firebase Performance Monitoring (Phase 2+)

**Setup** (when advancing to Monitoring Phase 2):
```bash
# Install Firebase Performance SDK
npm install firebase/performance

# Initialize in app
import { getPerformance } from 'firebase/performance';
const perf = getPerformance();
```

**Metrics tracked**:
- Page load time
- Network requests
- Custom traces

### VIII.2 Firebase Analytics (Phase 2+)

**Setup**:
```bash
npm install firebase/analytics

# Initialize
import { getAnalytics } from 'firebase/analytics';
const analytics = getAnalytics();
```

**Auto-tracked events**:
- Page views
- First visit
- User engagement

---

## IX. Maintenance

### IX.1 Regular Maintenance

**Weekly**:
- [ ] Check Firebase Console for errors
- [ ] Review bandwidth usage (stay under 360MB/day)
- [ ] Verify site is live and responsive

**Monthly**:
- [ ] Review deployment history
- [ ] Check for Firebase CLI updates
- [ ] Test rollback process (in preview channel)

**Quarterly** (with architectural review):
- [ ] Update Firebase CLI: `npm install -g firebase-tools@latest`
- [ ] Review security headers
- [ ] Audit custom domain (if configured)
- [ ] Review hosting metrics trends

### IX.2 Firebase CLI Updates

**Check for updates**:
```bash
firebase --version
# Check latest: https://github.com/firebase/firebase-tools/releases
```

**Update**:
```bash
npm install -g firebase-tools@latest
```

---

## X. References

**Constitutional Constraints**:
- [.specs/constitution.md](.specs/constitution.md) §IV.1 - Approved technology stack
- [.specs/constitution.md](.specs/constitution.md) §VI.1 - Firebase free tier limits
- [.specs/constitution.md](.specs/constitution.md) §VI.2 - Cost optimization requirements

**Related Specifications**:
- [.specs/technical/build-system.md](.specs/technical/build-system.md) - Vite build configuration
- [.specs/technical/cicd-pipeline.md](.specs/technical/cicd-pipeline.md) - GitHub Actions automation

**Foundational Patterns**:
- [.prompts/platforms/firebase/firebase-best-practices.md](.prompts/platforms/firebase/firebase-best-practices.md) - Firebase SDK patterns
- [.prompts/platforms/firebase/firebase-finops.md](.prompts/platforms/firebase/firebase-finops.md) - Free tier optimization

**External Documentation**:
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firebase Hosting with GitHub Actions](https://firebase.google.com/docs/hosting/github-integration)

---

**Version History**:
- 1.0.0 (2025-12-11): Initial Firebase deployment specification (migrated from firebase-deployment.md)
