# Technical Specification: Build System (Vite)

**Project**: SalmonCow
**Version**: 1.0.0
**Last Updated**: 2026-01-29
**Vite Version**: 7.x
**Status**: Active

---

## Overview

This specification defines the build system configuration for the SalmonCow project using Vite. It covers development server setup, production build optimization, environment variable management, and Firebase Hosting integration.

**Constitutional Reference**: [.specs/constitution.md](.specs/constitution.md) §IV.1 - Approved Technology Stack

---

## I. Project Configuration

### I.1 Directory Structure

```
salmoncow/
├── src/                      # Vite root (source files)
│   ├── index.html           # HTML entry point
│   ├── main.js              # JavaScript entry point
│   ├── components/          # Web Components
│   ├── services/            # Business logic
│   ├── infrastructure/      # Firebase SDK integration
│   ├── assets/              # Processed assets (images, CSS)
│   └── styles/              # Global styles
├── public/                  # Static assets (copied as-is)
│   └── assets/
│       └── images/          # Favicons, robots.txt
├── dist/                    # Build output (gitignored)
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment variable template
├── vite.config.js           # Vite configuration
└── package.json
```

**Principles**:
- `src/` files are processed, optimized, and bundled by Vite
- `public/` files are copied verbatim to `dist/` (no processing)
- `index.html` is the entry point and must be in `src/` (Vite root)

### I.2 Vite Configuration Principles

**File**: `vite.config.js` (see actual file for current implementation)

**Key Decisions**:
1. **Firebase on CDN**: Large Firebase SDK marked as external, loaded from CDN for better caching
2. **Asset Organization**: Files organized by type (images, styles, js) for different caching policies
3. **Terser Minification**: Better compression than esbuild default (-10-15% bundle size)
4. **CSS Code Splitting**: Enables lazy loading of styles per route/chunk
5. **Path Aliases**: Clean imports without fragile relative paths

---

## II. Environment Variables

### II.1 Configuration

**Environment Variable Prefix**: `VITE_*`

**Security Constraint** (from constitution §III.2):
- Only variables prefixed with `VITE_` are exposed to client code
- Never use `VITE_` prefix for secrets (API keys, tokens)
- Secrets go in Firebase Functions or backend only

**Required Variables**:

**.env** (gitignored, not committed):
```bash
# Firebase Configuration (safe to expose on client)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**.env.example** (committed, template):
```bash
# Firebase Configuration
# Get these values from Firebase Console: Project Settings > General
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### II.2 Usage in Code

```javascript
// ✅ CORRECT: Use import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Built-in variables
const isDev = import.meta.env.DEV;       // true in development
const isProd = import.meta.env.PROD;     // true in production
const mode = import.meta.env.MODE;       // 'development' or 'production'

// ❌ WRONG: Don't use process.env (Node.js pattern, not available)
const apiKey = process.env.VITE_FIREBASE_API_KEY;
```

### II.3 TypeScript Support (Future)

When migrating to TypeScript, add type definitions:

**src/vite-env.d.ts**:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

**Benefit**: IDE autocomplete and type safety for environment variables.

---

## III. Development Workflow

### III.1 Development Server

**Start server**:
```bash
npm run dev
# Starts Vite dev server at http://localhost:3000
# Automatically opens browser
# Enables Hot Module Replacement (HMR)
```

**Features**:
- **Instant HMR**: Changes to JS/CSS reflect immediately (no page refresh)
- **Fast startup**: <1 second server start time
- **Native ES modules**: No bundling during development
- **Source maps**: Inline source maps for debugging

**When to restart dev server**:
- ✅ After changing `vite.config.js`
- ✅ After changing `.env` file
- ✅ After installing new npm packages
- ❌ After changing source files (HMR handles it automatically)

### III.2 Production Preview

**Preview production build locally**:
```bash
npm run build
npm run preview
# Serves production build at http://localhost:3000
```

**Use cases**:
- Test production build before deployment
- Verify asset paths and caching work correctly
- Check bundle sizes and performance

---

## IV. Production Build

### IV.1 Build Process

**Build command**:
```bash
npm run build
# 1. Clears dist/ directory
# 2. Loads environment variables from .env
# 3. Bundles and minifies JavaScript (Terser)
# 4. Processes and minifies CSS
# 5. Optimizes and hashes assets
# 6. Outputs to dist/ directory
```

**Build output structure**:
```
dist/
├── index.html                           # Entry HTML (injects hashed assets)
├── assets/
│   ├── js/
│   │   ├── main-a3f9d2e1.js           # Entry JavaScript (hashed)
│   │   └── chunk-vendor-7b8c4f3a.js   # Vendor chunks (hashed)
│   ├── styles/
│   │   └── main-e4a8b9c2.css         # Processed CSS (hashed)
│   └── images/
│       └── logo-5d7f2a1b.svg         # Optimized images (hashed)
└── [files from public/ copied as-is]
```

**Hashing benefits**:
- Cache busting (new deploys get new hashes)
- Long-term caching (unchanged files keep same hash)
- Optimal CDN/browser caching

### IV.2 Bundle Size Targets

**From constitution §III.3 Performance Standards**:

| Asset Type | Target (gzipped) | Warning Threshold | Action Required |
|-----------|------------------|-------------------|-----------------|
| Entry JS | <50KB | >100KB | Code splitting, lazy loading |
| Entry CSS | <20KB | >50KB | CSS splitting, remove unused |
| Total Initial | <100KB | >200KB | Audit dependencies, optimize |

**Check bundle size**:
```bash
npm run build
# Output shows gzipped sizes:
# dist/assets/js/main-a3f9d2.js  42.15 kB │ gzip: 14.23 kB
# dist/assets/styles/main-e4a8.css  8.45 kB │ gzip: 2.87 kB
```

**Analyze bundle composition**:
```bash
npx vite-bundle-visualizer
# Opens interactive visualization of bundle contents
```

### IV.3 Build Optimization

**Current optimizations**:
1. **Terser minification**: Better compression than esbuild (-10-15% bundle size)
2. **CSS code splitting**: Lazy load CSS per route/chunk
3. **Tree shaking**: Removes unused code automatically
4. **Asset hashing**: Enables long-term caching
5. **External dependencies**: Firebase on CDN (not bundled)
6. **Source maps**: Generated for production debugging

**Future optimizations** (when needed):
- Manual chunk splitting for large vendor libraries
- Image optimization (WebP conversion, compression)
- Dynamic imports for code splitting
- Preloading/prefetching critical resources

---

## V. Asset Management

### V.1 Asset Import Patterns

**Processed assets** (in `src/assets/`):
```javascript
// ✅ Import for Vite processing (hashing, optimization)
import logo from '@assets/images/logo.svg';
// Returns: '/assets/images/logo-a3f9d2.svg'

import '@assets/styles/navigation.css';
// Bundled and minified into main CSS
```

**Static assets** (in `public/`):
```html
<!-- ✅ Direct path for static files (no processing) -->
<link rel="icon" href="/favicon.ico">
<img src="/assets/images/og-image.png">
<!-- Returns exact path from public/ -->
```

**Decision framework**:
- Use `src/assets/` + imports for: Component assets, processed images, styles
- Use `public/` for: Favicons, robots.txt, meta images, large static files

### V.2 CSS Import Strategy

**Import CSS in JavaScript** (enables HMR):
```javascript
// main.js
import './styles/main.css';
import '@assets/styles/navigation.css';
```

**Benefits**:
- Instant CSS updates during development (no page refresh)
- Automatic minification in production
- CSS code splitting per chunk
- Tree-shaking of unused CSS (with proper tools)

**❌ Avoid** direct `<link>` tags in HTML (loses HMR):
```html
<!-- Don't do this -->
<link rel="stylesheet" href="/styles/main.css">
```

---

## VI. Firebase Hosting Integration

### VI.1 Firebase Configuration

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
      }
    ]
  }
}
```

**Key decisions**:
1. **public: "dist"**: Vite build output is Firebase Hosting source
2. **SPA rewrites**: All routes rewrite to /index.html (client-side routing)
3. **Asset caching**: Hashed assets cached forever (31536000s = 1 year)
4. **HTML caching**: index.html never cached (always fresh)

### VI.2 Deployment Scripts

**File**: `/home/td000/salmoncow/package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && firebase deploy --only hosting",
    "deploy:preview": "npm run build && firebase hosting:channel:deploy preview"
  }
}
```

**Deployment workflow**:
```bash
# 1. Build production bundle
npm run build

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting

# Or use convenience script
npm run deploy
```

**Principle**: Always build before deploy; never deploy stale `dist/` directory.

**See also**: [.specs/technical/firebase-deployment.md](.specs/technical/firebase-deployment.md) for full deployment process

---

## VII. Common Issues and Solutions

### VII.1 Environment Variables Not Loading

**Problem**: `import.meta.env.VITE_*` returns `undefined`

**Causes**:
1. Variable not prefixed with `VITE_`
2. `.env` file not in correct location
3. Dev server not restarted after `.env` change

**Solutions**:
```javascript
// vite.config.js - Ensure envDir points to .env location
export default defineConfig({
  root: 'src',
  envDir: '..',     // Look for .env in project root (parent of src/)
});
```

**Verification**:
```javascript
// Check available variables
console.log(import.meta.env);
// Should include VITE_* variables and MODE, DEV, PROD
```

### VII.2 Assets Not Found (404)

**Problem**: Images/assets return 404 in production

**Cause**: Incorrect import method

**Solutions**:
```javascript
// ✅ CORRECT: Import from src/assets/ (processed, hashed)
import logo from '@assets/images/logo.svg';
document.querySelector('#logo').src = logo;

// ✅ CORRECT: Reference from public/ (static, not hashed)
<img src="/assets/images/logo.svg">

// ❌ WRONG: Relative path to src/assets/ (breaks in production)
<img src="./assets/images/logo.svg">  // 404 in production!
```

### VII.3 Build Fails with "Module not found"

**Problem**: Build succeeds on local machine, fails in CI/CD

**Common causes**:
```javascript
// 1. Case sensitivity (works on Mac/Windows, fails on Linux)
import { AuthModule } from './modules/Auth.js';  // File is auth.js
// Fix: Match exact filename case

// 2. Missing file extension
import { AuthModule } from './modules/auth';     // Missing .js
// Fix: Always include .js extension

// 3. Incorrect path alias
import { AuthModule } from '@/modules/auth.js';  // @ not configured
// Fix: Use configured alias (@modules) or relative path
```

### VII.4 Large Bundle Size

**Problem**: Bundle exceeds targets (>100KB gzipped)

**Diagnostic steps**:
```bash
# 1. Analyze bundle composition
npx vite-bundle-visualizer

# 2. Check for large dependencies
npm ls --depth=0

# 3. Review build output
npm run build
# Check gzipped sizes in output
```

**Solutions**:
1. **Code splitting**: Use dynamic imports for large features
   ```javascript
   // Instead of: import { LargeFeature } from './large-feature.js';
   const { LargeFeature } = await import('./large-feature.js');
   ```

2. **External dependencies**: Mark large libraries as external (CDN)
   ```javascript
   // vite.config.js
   export default defineConfig({
     build: {
       rollupOptions: {
         external: ['large-library'],
       },
     },
   });
   ```

3. **Remove unused code**: Check for dead code, unused imports

---

## VIII. Performance Benchmarks

### VIII.1 Build Performance

**Current benchmarks** (as of 2025-12-11):
- **Initial build**: ~500ms
- **Rebuild (cache hit)**: ~200ms
- **Dev server start**: <1 second
- **HMR update**: <100ms

**Thresholds**:
- ⚠️ Warning: Build time >5 seconds
- 🚨 Critical: Build time >15 seconds

**Optimization if slow**:
- Enable Vite's dependency pre-bundling cache
- Exclude large files from source control
- Use `--mode production` only for final deploy

### VIII.2 Bundle Performance

**Current bundle sizes** (target):
- Entry JS: ~40-50KB gzipped
- Entry CSS: ~5-10KB gzipped
- Total initial load: ~50-60KB gzipped

**From constitution** (§III.3):
- Page load: <3s (p95)
- TTI: <5s (p95)
- FCP: <1.5s (p95)

**Monitor with**:
- Chrome DevTools (Network tab, Lighthouse)
- Firebase Performance Monitoring (when Phase 2)
- WebPageTest for real-world testing

---

## IX. Future Enhancements

### IX.1 TypeScript Migration (Phase 2+)

**When to migrate**: 10+ modules, team size ≥2, or production launch

**Migration strategy**:
1. Add `tsconfig.json` and `src/vite-env.d.ts`
2. Keep all `.js` files initially (`allowJs: true`)
3. Add `// @ts-check` to files for opt-in type checking
4. Rename `.js` → `.ts` file-by-file when ready
5. Enable `checkJs: true` when fully migrated

**Vite configuration changes**:
```javascript
// vite.config.ts (rename from .js)
import { defineConfig } from 'vite';
export default defineConfig({
  // No special config needed - Vite handles TS natively
});
```

### IX.2 Advanced Optimizations (Phase 3+)

**When needed**: Bundle size >200KB or performance issues

**Possible optimizations**:
- Image optimization (WebP conversion, compression)
- Manual chunk splitting for vendor libraries
- Preloading/prefetching critical resources
- Service worker for offline support
- CDN distribution for assets

---

## X. Maintenance

### X.1 Dependency Updates

**Check for updates**: Quarterly (with architectural review)

**Current versions** (as of 2025-12-11):
```json
{
  "devDependencies": {
    "vite": "^7.2.7",         // Check: https://github.com/vitejs/vite/releases
    "terser": "^5.44.1"       // Required for minify: 'terser'
  }
}
```

**Update process**:
```bash
# 1. Check for updates
npm outdated

# 2. Update Vite (minor versions safe)
npm update vite

# 3. Test in preview channel
npm run deploy:preview

# 4. If successful, deploy to production
npm run deploy
```

**Breaking change protocol**:
- Major version updates (7.x → 8.x): Read migration guide first
- Test in local preview before deploying
- Deploy to preview channel before production

### X.2 Review Schedule

**Quarterly** (with constitutional review):
- Check Vite version for updates
- Review bundle size trends
- Check for new Vite features/optimizations
- Update this spec if configuration changes

**Annual**:
- Deep audit of build performance
- Evaluate if Vite still optimal choice
- Consider advanced optimizations if needed

---

## XI. References

**Constitutional Constraints**:
- [.specs/constitution.md](.specs/constitution.md) §III.3 - Performance standards
- [.specs/constitution.md](.specs/constitution.md) §IV.1 - Approved technology stack

**Related Specifications**:
- [.specs/technical/firebase-deployment.md](.specs/technical/firebase-deployment.md) - Deployment process
- [.specs/technical/cicd-pipeline.md](.specs/technical/cicd-pipeline.md) - GitHub Actions integration

**Foundational Patterns**:
- [.prompts/core/architecture/code-structure.md](.prompts/core/architecture/code-structure.md) - Project organization
- [.prompts/core/development/asset-reusability.md](.prompts/core/development/asset-reusability.md) - Asset management

**External Documentation**:
- [Vite Guide](https://vitejs.dev/guide/)
- [Vite Config Reference](https://vitejs.dev/config/)
- [Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Version History**:
- 1.0.0 (2025-12-11): Initial build system specification (migrated from vite-best-practices.md)
