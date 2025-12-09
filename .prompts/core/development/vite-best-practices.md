# Vite Best Practices

## Universal Patterns for Modern Build Tooling

This guide provides technology-agnostic principles for using Vite as a build tool, based on real-world implementation experience. These patterns ensure optimal development experience, production performance, and maintainability.

## Core Vite Principles

### 1. Leverage Native ES Modules

Vite's speed comes from serving native ES modules during development:

```javascript
// ✅ Good: Use ES module imports
import { AuthModule } from './modules/auth.js';
import './styles/main.css';

// ❌ Avoid: CommonJS in Vite projects
const AuthModule = require('./modules/auth.js');
```

**Why this matters:**
- No bundling needed during development
- Instant Hot Module Replacement (HMR)
- Faster server startup and refresh

### 2. Proper Project Structure

Organize files to align with Vite's conventions:

```
✅ Recommended Structure:
src/                      # Vite root (vite.config.js: root: 'src')
├── index.html           # HTML entry point (must be in root)
├── main.js              # JavaScript entry point
├── modules/             # Application modules
├── styles/              # CSS files
└── assets/              # Source assets (will be processed)

public/                  # Static assets (copied as-is)
└── assets/
    └── images/          # Assets that shouldn't be processed

dist/                    # Build output (gitignored)
```

**Key principle:** Files in `src/` are processed and optimized; files in `public/` are copied verbatim.

### 3. Environment Variable Management

Use Vite's native environment variable system:

```javascript
// ✅ Good: Use import.meta.env
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// ❌ Avoid: Custom template injection
const apiKey = "{{VITE_FIREBASE_API_KEY}}";
```

**Configuration:**
```javascript
// vite.config.js
export default defineConfig({
  root: 'src',           // If index.html is in src/
  envDir: '..',          // Look for .env in project root
  envPrefix: 'VITE_',    // Only expose VITE_* variables
});
```

**Security principle:** Only variables prefixed with `VITE_` are exposed to client code. Never use `VITE_` prefix for secrets.

### 4. External Dependencies (CDN Pattern)

Keep large SDKs on CDN for optimal caching:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      // Mark CDN imports as external
      external: [/^https:\/\/www\.gstatic\.com\/firebasejs\/.*/],
    },
  },
});
```

**When to use external dependencies:**
- ✅ Large SDKs with good CDN distribution (Firebase, Google APIs)
- ✅ Libraries shared across many sites (better caching)
- ❌ Small utilities (bundle overhead is negligible)
- ❌ Custom libraries (no CDN benefit)

### 5. Asset Organization

Configure asset output for optimal caching:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Organize by type for better caching policies
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name.split('.').pop();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/css/i.test(ext)) {
            return 'assets/styles/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
});
```

**Why organize by type:**
- Different caching policies per asset type (images vs HTML)
- Easier CDN configuration
- Cleaner Firebase Hosting rules

### 6. CSS Import Strategy

Import CSS in JavaScript for HMR benefits:

```javascript
// main.js
// ✅ Good: Import CSS in JS for HMR
import './styles/main.css';
import './assets/styles/navigation.css';

// Application code...
```

**Benefits:**
- Instant CSS updates during development (no page refresh)
- Automatic minification and optimization in production
- Tree-shaking of unused CSS (with proper tools)

```html
<!-- index.html -->
<!-- ❌ Avoid: Direct CSS links lose HMR -->
<link rel="stylesheet" href="/styles/main.css">
```

### 7. Build Optimization

Configure for production performance:

```javascript
// vite.config.js
export default defineConfig(({ mode }) => ({
  build: {
    minify: 'terser',              // Better compression than esbuild
    cssCodeSplit: true,            // Split CSS per chunk
    sourcemap: mode === 'production' ? true : 'inline',
    rollupOptions: {
      output: {
        manualChunks: undefined,   // Let Vite decide (or customize)
      },
    },
  },
}));
```

**Performance principles:**
- Use `terser` for production (smaller bundles)
- Enable CSS code splitting for lazy loading
- Generate source maps for production debugging
- Trust Vite's defaults unless you have specific needs

### 8. Development Server Configuration

Optimize for local development experience:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 3000,
    open: true,           // Auto-open browser
    cors: true,           // Enable CORS for API calls
  },
  preview: {
    port: 3000,           // Match dev server port
  },
});
```

### 9. Path Aliases

Use path aliases for cleaner imports:

```javascript
// vite.config.js
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
});
```

```javascript
// Usage in code
// ✅ Good: Clean imports with aliases
import { AuthModule } from '@modules/auth.js';
import logo from '@assets/images/logo.svg';

// ❌ Avoid: Fragile relative paths
import { AuthModule } from '../../../modules/auth.js';
```

## TypeScript Integration

### Gradual Migration Strategy

Start with JavaScript, add TypeScript incrementally:

```json
// tsconfig.json
{
  "compilerOptions": {
    "allowJs": true,        // Allow .js files
    "checkJs": false,       // Don't type-check JS (yet)
    "noEmit": true,         // Vite handles compilation
    "isolatedModules": true // Vite requirement
  }
}
```

**Migration path:**
1. Add `tsconfig.json` and `src/vite-env.d.ts`
2. Keep all `.js` files initially
3. Add `// @ts-check` to individual files for opt-in checking
4. Rename `.js` → `.ts` when ready for full type checking
5. Enable `checkJs: true` when all files are migrated

### Environment Variable Types

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  // ... other env vars
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

**Benefit:** IDE autocomplete and type checking for environment variables.

## Firebase Hosting Integration

### Configuration

```json
// firebase.json
{
  "hosting": {
    "public": "dist",        // Vite output directory
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
    ]
  }
}
```

### Deployment Scripts

```json
// package.json
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

**Principle:** Always build before deploy; never deploy stale dist/ directory.

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy-production.yml
- name: Create environment file
  run: |
    cat > .env << EOF
    VITE_FIREBASE_API_KEY=${{ secrets.VITE_FIREBASE_API_KEY }}
    # ... other variables
    EOF

- name: Build project
  run: npm run build

- name: Deploy to Firebase Hosting
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    channelId: live
```

**Key principle:** Create `.env` from GitHub secrets before build; Vite will load it automatically.

## Common Pitfalls and Solutions

### 1. Environment Variables Not Loading

**Problem:** `import.meta.env.VITE_*` is undefined

**Solutions:**
```javascript
// If vite.config.js sets root: 'src', tell Vite where .env lives
export default defineConfig({
  root: 'src',
  envDir: '..',     // Look for .env in parent directory (project root)
});
```

**Alternative:** Move `.env` to `src/` (but project root is best practice)

### 2. Assets Not Found

**Problem:** Images return 404 in production

**Root cause:** Incorrect import method

```javascript
// ✅ Good: Import for processing
import logo from './assets/images/logo.svg';
// Returns: /assets/images/logo-a3f9d2.svg (with hash)

// ✅ Good: Public directory for static files
<img src="/assets/images/logo.svg">
// Returns: /assets/images/logo.svg (exact path, from public/)

// ❌ Avoid: Relative path to src/assets
<img src="./assets/images/logo.svg">
// 404 in production (path doesn't exist in dist/)
```

**Decision framework:**
- Use `public/` for: Favicons, robots.txt, large static files
- Use `src/assets/` + imports for: Components, styles, processed images

### 3. Dev Server Requires Restart

**When to restart `npm run dev`:**
- ✅ After changing `vite.config.js`
- ✅ After changing `.env` file
- ✅ After installing new npm packages
- ❌ After changing source files (HMR handles it)
- ❌ After changing CSS (HMR handles it)

### 4. Build Fails with "Module not found"

**Problem:** Build fails but dev works

**Common causes:**
```javascript
// Case sensitivity (works on Mac/Windows, fails on Linux CI)
import { AuthModule } from './modules/Auth.js';  // File is auth.js
// Fix: Match exact case

// Missing file extensions
import { AuthModule } from './modules/auth';     // Missing .js
// Fix: Always include .js extension

// Incorrect path alias
import { AuthModule } from '@/modules/auth.js';  // @ not configured
// Fix: Configure alias in vite.config.js or use relative path
```

## Migration from Custom Build Scripts

### Before (Custom Node.js Scripts)

```javascript
// scripts/inject-env.js (77 lines)
// - Manual template replacement
// - Custom file copying
// - No HMR
// - No optimization

// scripts/build-assets.js (66 lines)
// - Manual asset copying
// - No hashing
// - No minification
```

### After (Vite)

```javascript
// vite.config.js (~60 lines)
// - Native env variable support
// - Automatic asset processing
// - HMR out of the box
// - Optimized production builds
// - Code splitting
// - Tree shaking
// - Asset hashing
```

**Benefits realized:**
- Development: 10x faster iteration (HMR vs manual rebuild)
- Production: Smaller bundles (tree-shaking, minification)
- Maintenance: 143 lines of custom code → 0 lines (Vite handles it)

## Performance Monitoring

### Build Time Optimization

```bash
# Measure build time
time npm run build

# Analyze bundle size
npm run build -- --mode production

# Check bundle composition
npx vite-bundle-visualizer
```

**Benchmarks (Salmoncow project):**
- Initial build: ~500ms
- Rebuild (cache hit): ~200ms
- Dev server start: <1s
- HMR update: <100ms

### Bundle Size Targets

```
✅ Good bundle sizes:
- Entry JS: <50KB gzipped
- Entry CSS: <20KB gzipped
- Total initial load: <100KB gzipped

⚠️ Review if exceeding:
- Entry JS: >100KB gzipped
- Entry CSS: >50KB gzipped
- Total initial load: >200KB gzipped
```

## Version Management

### Dependency Updates

```json
// package.json
{
  "devDependencies": {
    "vite": "^7.2.7",         // Keep up to date
    "typescript": "^5.9.3",   // Latest stable
    "terser": "^5.44.1"       // Required for minify: 'terser'
  }
}
```

**Update strategy:**
- Check Vite releases: https://github.com/vitejs/vite/releases
- Test updates in preview channel before production
- Read migration guides for major version bumps

## Additional Resources

**Official Documentation:**
- [Vite Guide](https://vitejs.dev/guide/)
- [Vite Config Reference](https://vitejs.dev/config/)
- [Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

**Related Project Guidance:**
- `.prompts/core/architecture/code-structure.md` - Project organization
- `.prompts/core/deployment/deployment-principles.md` - CI/CD patterns
- `.prompts/platforms/firebase/firebase-deployment.md` - Firebase integration

---

**Last Updated:** 2025-12-08 (based on Salmoncow Vite migration)
**Vite Version:** 7.x
**Maintained by:** Project team
