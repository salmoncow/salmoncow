# Firebase Deployment & CI/CD Implementation

**Status**: Firebase-Specific
**Last Updated**: 2025-12-08
**GitHub Actions**: actions/checkout@v5, actions/setup-node@v6
**Node.js**: 24 LTS "Krypton" (Active until April 2028)
**Authentication**: Service Account (CI tokens deprecated)
**Core Principles**: See [../../core/deployment/deployment-principles.md](../../core/deployment/deployment-principles.md)

> **Note**: `actions/setup-node@v6` requires GitHub Actions runner v2.327.1+.

## Overview

Firebase-specific CI/CD implementation using GitHub Actions, Firebase Hosting, Cloud Functions, and Firestore deployment.

For universal CI/CD principles (deployment strategies, pipeline stages, best practices), see the [Core Deployment Principles](../../core/deployment/deployment-principles.md) guide.

---

## Firebase CI/CD Pipeline Architecture

When implementing deployment strategies for this Firebase application, follow these patterns for automated, secure, and reliable deployments. **For free tier optimization**, see [firebase-finops.md](./firebase-finops.md).

> 💰 **Cost-Optimized CI/CD**: Prioritize Firebase Hosting free tier deployment, optimize GitHub Actions runtime, and use free monitoring services.

### GitHub Actions Workflow Configuration

#### 1. Main CI/CD Pipeline
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '24'
  FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}

jobs:
  # Code Quality and Testing
  test:
    name: Test & Quality Checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint code
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Run security audit
        run: npm audit --audit-level high

      - name: Dependency vulnerability scan
        run: npm run security:scan

  # Firebase Security Rules Testing
  security-rules:
    name: Security Rules Testing
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Start Firebase emulators
        run: firebase emulators:start --only firestore,auth &

      - name: Wait for emulators
        run: sleep 10

      - name: Test Firestore security rules
        run: npm run test:rules

      - name: Test authentication rules
        run: npm run test:auth-rules

  # Integration Testing
  integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: [test]

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Start Firebase emulators
        run: firebase emulators:start --only firestore,auth,functions &

      - name: Wait for emulators
        run: sleep 15

      - name: Run integration tests
        run: npm run test:integration

  # E2E Testing
  e2e:
    name: End-to-End Tests
    runs-on: ubuntu-latest
    needs: [test]

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run start &

      - name: Wait for application
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload E2E test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-test-results
          path: test-results/

  # Build Application
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [test, security-rules]

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: |
            .next/
            out/
          retention-days: 1

  # Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build, integration, e2e]
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-files

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Create service account credentials
        run: |
          echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > $HOME/gcp-key.json
          echo "GOOGLE_APPLICATION_CREDENTIALS=$HOME/gcp-key.json" >> $GITHUB_ENV

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Deploy to Firebase (Staging)
        run: |
          firebase use staging
          firebase deploy --only hosting,firestore:rules,storage

      - name: Deploy Cloud Functions (Staging)
        run: firebase deploy --only functions

      - name: Cleanup credentials
        if: always()
        run: rm -f $HOME/gcp-key.json

      - name: Run smoke tests against staging
        run: npm run test:smoke -- --baseUrl=https://staging-app.web.app

  # Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-files

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Create service account credentials
        run: |
          echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > $HOME/gcp-key.json
          echo "GOOGLE_APPLICATION_CREDENTIALS=$HOME/gcp-key.json" >> $GITHUB_ENV

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Deploy to Firebase (Production)
        run: |
          firebase use production
          firebase deploy --only hosting,firestore:rules,storage

      - name: Deploy Cloud Functions (Production)
        run: firebase deploy --only functions

      - name: Cleanup credentials
        if: always()
        run: rm -f $HOME/gcp-key.json

      - name: Run smoke tests against production
        run: npm run test:smoke -- --baseUrl=https://app.web.app

      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'Production deployment successful! 🚀'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### 2. Feature Branch Workflow
```yaml
# .github/workflows/feature.yml
name: Feature Branch CI

on:
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened]

jobs:
  # Quick validation for feature branches
  validate:
    name: Quick Validation
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        with:
          fetch-depth: 0 # Fetch full history for better analysis

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint changed files only
        run: |
          npx lint-staged

      - name: Type check
        run: npm run type-check

      - name: Test affected files
        run: npm run test:affected

      - name: Check bundle size impact
        run: npm run analyze:bundle

  # Preview deployment for feature branches
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [validate]
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}

      - name: Deploy to Firebase Preview
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
          expires: 7d

      - name: Comment preview URL
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🔗 **Preview deployment ready!**

              Preview URL: https://preview-project--pr-${{ github.event.number }}-hash.web.app

              This preview will expire in 7 days.`
            })
```

#### 3. Preview Channel Lifecycle Management

**Firebase Auto-Expiration (Recommended)**

Firebase Hosting automatically expires and removes preview channels after their configured duration. For most applications, relying on this native behavior is the simplest and most reliable approach:

```yaml
# .github/workflows/deploy-preview.yml
- name: Deploy to Firebase Preview Channel
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    expires: 7d  # Firebase automatically removes after 7 days
```

**When to Use Manual Cleanup:**

Manual cleanup is only necessary when:
1. You need to remove channels **before** their expiration time
2. You're implementing custom blue-green deployment flows that create many temporary channels
3. You have specific compliance requirements for immediate resource deletion

**When to Avoid Manual Cleanup:**

❌ **Do NOT create scheduled cleanup workflows** when:
- Preview channels already have expiration configured
- You're within hosting platform's resource limits
- Channels expire automatically within acceptable timeframes

This follows platform simplification principles by trusting native platform behavior rather than adding custom automation.

**Manual Cleanup Example (Only if needed):**

```bash
# Inline cleanup as part of deployment promotion
if [ "$PROMOTE" = "true" ]; then
  # Cleanup old preview channels after successful promotion
  firebase hosting:channel:list --json | \
    jq -r '.[] | select(.expireTime < now) | .name' | \
    xargs -I {} firebase hosting:channel:delete {}
fi
```

**❌ Anti-Pattern: Scheduled Cleanup Workflows**

```yaml
# ❌ AVOID: Unnecessary scheduled cleanup
# .github/workflows/cleanup-previews.yml
name: Cleanup Preview Channels
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly cleanup
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - run: firebase hosting:channel:list
      # Firebase already handles this automatically!
```

**Why this is problematic:**
- Adds operational complexity (scheduled job management)
- Creates unnecessary failure points
- Duplicates hosting platform's native auto-expiration
- Wastes CI/CD minutes
- Violates platform simplification principles

**✅ Better Approach:**

Configure expiration when creating preview channels and trust the platform's auto-cleanup:
```yaml
expires: 7d  # Platform automatically handles cleanup
```

### Environment Management

#### 1. Multi-Environment Firebase Configuration
```typescript
// lib/config/firebase.ts
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

interface EnvironmentConfig {
  firebase: FirebaseConfig;
  apiBaseUrl: string;
  enableAnalytics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  features: {
    enableExperimentalFeatures: boolean;
    enableBetaFeatures: boolean;
  };
}

const configs: Record<string, EnvironmentConfig> = {
  development: {
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    },
    apiBaseUrl: 'http://localhost:3000/api',
    enableAnalytics: false,
    logLevel: 'debug',
    features: {
      enableExperimentalFeatures: true,
      enableBetaFeatures: true,
    },
  },
  staging: {
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: `staging-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: `staging-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
      storageBucket: `staging-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    },
    apiBaseUrl: 'https://staging-api.example.com',
    enableAnalytics: false,
    logLevel: 'info',
    features: {
      enableExperimentalFeatures: true,
      enableBetaFeatures: false,
    },
  },
  production: {
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },
    apiBaseUrl: 'https://api.example.com',
    enableAnalytics: true,
    logLevel: 'warn',
    features: {
      enableExperimentalFeatures: false,
      enableBetaFeatures: false,
    },
  },
};

export function getConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development';
  const config = configs[env];

  if (!config) {
    throw new Error(`Configuration not found for environment: ${env}`);
  }

  return config;
}
```

#### 2. Firebase Projects Configuration
```json
// .firebaserc
{
  "projects": {
    "default": "my-app-dev",
    "development": "my-app-dev",
    "staging": "my-app-staging",
    "production": "my-app-prod"
  },
  "targets": {
    "my-app-prod": {
      "hosting": {
        "app": ["my-app-prod"],
        "admin": ["my-app-admin-prod"]
      }
    },
    "my-app-staging": {
      "hosting": {
        "app": ["my-app-staging"],
        "admin": ["my-app-admin-staging"]
      }
    }
  },
  "etags": {}
}
```

### Deployment Strategies

#### 1. Blue-Green Deployment with Firebase Hosting
```bash
#!/bin/bash
# scripts/deploy-blue-green.sh

set -e

PROJECT_ID=$1
CHANNEL=$2
PROMOTE=${3:-false}

echo "🚀 Starting Blue-Green deployment..."

# Deploy to preview channel first
echo "📦 Deploying to preview channel: $CHANNEL"
firebase use $PROJECT_ID
firebase hosting:channel:deploy $CHANNEL --expires 30d

# Run smoke tests against preview
echo "🧪 Running smoke tests..."
npm run test:smoke -- --baseUrl="https://$PROJECT_ID--$CHANNEL-hash.web.app"

if [ "$PROMOTE" = "true" ]; then
  echo "✅ Smoke tests passed. Promoting to live..."
  firebase hosting:channel:deploy live --source $CHANNEL

  echo "🎉 Deployment completed successfully!"

  # Cleanup old preview channels
  echo "🧹 Cleaning up old preview channels..."
  firebase hosting:channel:list --json | jq -r '.[] | select(.expireTime < now) | .name' | xargs -I {} firebase hosting:channel:delete {}
else
  echo "⏸️ Preview deployed. Manual promotion required."
  echo "Preview URL: https://$PROJECT_ID--$CHANNEL-hash.web.app"
fi
```

#### 2. Canary Deployment Strategy
```typescript
// lib/deployment/canary.ts
export class CanaryDeployment {
  private project: string;
  private canaryPercentage: number;

  constructor(project: string, canaryPercentage = 10) {
    this.project = project;
    this.canaryPercentage = canaryPercentage;
  }

  async deployCanary(version: string): Promise<void> {
    console.log(`🚀 Deploying canary version ${version} with ${this.canaryPercentage}% traffic`);

    // Deploy to canary channel
    await this.deployToChannel(`canary-${version}`);

    // Configure traffic splitting
    await this.configureTrafficSplit(version, this.canaryPercentage);

    // Monitor canary metrics
    await this.monitorCanaryMetrics(version);
  }

  private async deployToChannel(channel: string): Promise<void> {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      const process = spawn('firebase', [
        'hosting:channel:deploy',
        channel,
        '--expires',
        '7d',
      ]);

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Deployment failed with code ${code}`));
        }
      });
    });
  }

  private async configureTrafficSplit(version: string, percentage: number): Promise<void> {
    // Use Firebase Admin SDK to configure traffic splitting
    const admin = await import('firebase-admin');

    // This is a simplified example - actual implementation would use
    // Firebase Hosting API to configure traffic splits
    console.log(`Configuring ${percentage}% traffic to canary version ${version}`);
  }

  private async monitorCanaryMetrics(version: string): Promise<void> {
    const startTime = Date.now();
    const maxMonitorTime = 30 * 60 * 1000; // 30 minutes

    while (Date.now() - startTime < maxMonitorTime) {
      const metrics = await this.getCanaryMetrics(version);

      if (this.shouldRollback(metrics)) {
        console.log('❌ Canary metrics indicate issues. Rolling back...');
        await this.rollbackCanary(version);
        throw new Error('Canary deployment rolled back due to poor metrics');
      }

      if (this.shouldPromote(metrics)) {
        console.log('✅ Canary metrics look good. Promoting to full traffic...');
        await this.promoteCanary(version);
        return;
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes
    }

    console.log('⏰ Canary monitoring timeout. Manual intervention required.');
  }

  private async getCanaryMetrics(version: string): Promise<CanaryMetrics> {
    // Integrate with monitoring service to get real metrics
    return {
      errorRate: Math.random() * 0.05, // 0-5% error rate
      responseTime: 200 + Math.random() * 100, // 200-300ms
      userSatisfaction: 0.95 + Math.random() * 0.05, // 95-100%
    };
  }

  private shouldRollback(metrics: CanaryMetrics): boolean {
    return metrics.errorRate > 0.02 || // > 2% error rate
           metrics.responseTime > 500 || // > 500ms response time
           metrics.userSatisfaction < 0.9; // < 90% satisfaction
  }

  private shouldPromote(metrics: CanaryMetrics): boolean {
    return metrics.errorRate < 0.01 && // < 1% error rate
           metrics.responseTime < 300 && // < 300ms response time
           metrics.userSatisfaction > 0.95; // > 95% satisfaction
  }

  private async rollbackCanary(version: string): Promise<void> {
    // Rollback to previous stable version
    console.log(`Rolling back canary version ${version}`);
    // Implementation would revert traffic to stable version
  }

  private async promoteCanary(version: string): Promise<void> {
    // Promote canary to receive 100% traffic
    console.log(`Promoting canary version ${version} to full traffic`);
    // Implementation would update traffic allocation
  }
}

interface CanaryMetrics {
  errorRate: number;
  responseTime: number;
  userSatisfaction: number;
}
```

### Security and Secrets Management

> **Last Updated:** 2025-12-08 | **Firebase SDK:** v12+ | **GitHub Actions:** actions/checkout@v5

#### 1. GitHub Secrets Configuration

**Modern Approach (Service Account Authentication):**

Firebase has deprecated `firebase login:ci` tokens. Use **service account authentication** instead:

```bash
# Step 1: Create service account in Google Cloud Console
# - Go to https://console.cloud.google.com
# - Navigate to IAM & Admin > Service Accounts
# - Create service account with "Firebase Hosting Admin" role
# - Download JSON key

# Step 2: Add service account JSON as GitHub secret
gh secret set FIREBASE_SERVICE_ACCOUNT --body "$(cat service-account-key.json)"

# Step 3: Add Firebase configuration secrets
gh secret set FIREBASE_PROJECT_ID --body "my-app-prod"
gh secret set NEXT_PUBLIC_FIREBASE_API_KEY --body "your-api-key"
gh secret set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --body "my-app.firebaseapp.com"
gh secret set NEXT_PUBLIC_FIREBASE_SENDER_ID --body "123456789"
gh secret set NEXT_PUBLIC_FIREBASE_APP_ID --body "1:123456789:web:abcdef"
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."

# Environment-specific secrets
gh secret set STAGING_FIREBASE_PROJECT_ID --body "my-app-staging"
gh secret set PROD_FIREBASE_PROJECT_ID --body "my-app-prod"

# IMPORTANT: Delete the service account JSON file after adding to GitHub
rm service-account-key.json
```

**⚠️ Deprecated Approach (Do Not Use):**
```bash
# ❌ DEPRECATED - Will be removed in future Firebase CLI versions
# firebase login:ci
# gh secret set FIREBASE_TOKEN --body "$(firebase login:ci)"
```

#### 2. Secure Environment Variable Management
```typescript
// lib/config/env-validator.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // Server-side only
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1).optional(),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1).optional(),

  // Optional monitoring
  SENTRY_DSN: z.string().url().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
}

// Use at app startup
export const env = validateEnv();
```

### Database Migration and Backup

#### 1. Firestore Migration System
```typescript
// lib/migrations/migrator.ts
export interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export class FirestoreMigrator {
  private db: admin.firestore.Firestore;
  private migrations: Migration[] = [];

  constructor(db: admin.firestore.Firestore) {
    this.db = db;
  }

  addMigration(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async getCurrentVersion(): Promise<number> {
    const versionDoc = await this.db.collection('_migrations').doc('version').get();
    return versionDoc.exists ? versionDoc.data()?.version || 0 : 0;
  }

  async migrate(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);

    console.log(`Current version: ${currentVersion}`);
    console.log(`Pending migrations: ${pendingMigrations.length}`);

    for (const migration of pendingMigrations) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);

      try {
        await migration.up();
        await this.updateVersion(migration.version);
        console.log(`✅ Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }

  private async updateVersion(version: number): Promise<void> {
    await this.db.collection('_migrations').doc('version').set({
      version,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

// Example migration
export const addUserRoleMigration: Migration = {
  version: 1,
  name: 'Add role field to users',
  up: async () => {
    const db = admin.firestore();
    const usersRef = db.collection('users');
    const batch = db.batch();

    const snapshot = await usersRef.get();

    snapshot.docs.forEach(doc => {
      if (!doc.data().role) {
        batch.update(doc.ref, { role: 'user' });
      }
    });

    await batch.commit();
  },
  down: async () => {
    const db = admin.firestore();
    const usersRef = db.collection('users');
    const batch = db.batch();

    const snapshot = await usersRef.get();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { role: admin.firestore.FieldValue.delete() });
    });

    await batch.commit();
  },
};
```

#### 2. Automated Backup Strategy
```yaml
# .github/workflows/backup.yml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    name: Backup Firestore
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Setup Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.FIREBASE_PROJECT_ID }}

      - name: Export Firestore data
        run: |
          DATE=$(date +%Y%m%d_%H%M%S)
          BUCKET_NAME="${{ secrets.BACKUP_BUCKET_NAME }}"

          gcloud firestore export gs://$BUCKET_NAME/firestore-backups/$DATE \
            --collection-ids=users,posts,comments

          echo "Backup completed: gs://$BUCKET_NAME/firestore-backups/$DATE"

      - name: Cleanup old backups
        run: |
          BUCKET_NAME="${{ secrets.BACKUP_BUCKET_NAME }}"
          CUTOFF_DATE=$(date -d '30 days ago' +%Y%m%d)

          gsutil ls gs://$BUCKET_NAME/firestore-backups/ | while read backup; do
            BACKUP_DATE=$(echo $backup | grep -o '[0-9]\{8\}' | head -1)
            if [[ $BACKUP_DATE < $CUTOFF_DATE ]]; then
              echo "Deleting old backup: $backup"
              gsutil -m rm -r $backup
            fi
          done
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass (unit, integration, e2e)
- [ ] Security rules tested and validated
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Backup strategy verified
- [ ] Performance benchmarks met
- [ ] Security audit completed

### Deployment Process
- [ ] Blue-green or canary deployment strategy selected
- [ ] Preview deployment tested
- [ ] Smoke tests pass on staging
- [ ] Production deployment executed
- [ ] Health checks pass
- [ ] Monitoring and alerting verified

### Post-Deployment
- [ ] Application health verified
- [ ] User acceptance testing completed
- [ ] Performance monitoring active
- [ ] Error tracking functional
- [ ] Documentation updated
- [ ] Team notified of deployment

## Development Commands

```bash
# Environment management
npm run env:validate
npm run env:switch staging
npm run env:switch production

# Build and deployment
npm run build:staging
npm run build:production
npm run deploy:preview
npm run deploy:staging
npm run deploy:production

# Migration and backup
npm run migrate:up
npm run migrate:down
npm run backup:create
npm run backup:restore

# Testing deployment
npm run test:smoke
npm run test:deployment
npm run test:rollback
```