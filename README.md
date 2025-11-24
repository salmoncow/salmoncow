# Firebase Base Website

A simple, modern web application that demonstrates Firebase authentication with Google sign-in. The app features a clean, responsive interface with a gradient background and smooth animations. Deployed on Firebase Hosting with free tier optimization.

## Features

- Google Authentication via Firebase Auth
- Responsive design with modern CSS
- Real-time authentication state management
- Clean, minimal user interface
- Firebase configuration validation
- Graceful profile picture fallback (default avatar for missing/failed photos)
- Asset pipeline for reusable resources
- Firebase Hosting with optimized caching and security headers
- Preview channel deployments for testing

## Tech Stack

- Vanilla HTML/CSS/JavaScript (ES6 modules)
- Firebase SDK (Authentication)
- Firebase Hosting (Static site hosting with CDN)
- Google OAuth integration
- Modular architecture for scalability

## Development & Deployment

This project supports both **local development** and **remote hosting** on Firebase.

### Prerequisites
- Node.js (for package management and build process)
- Firebase CLI (`npm install -g firebase-tools`)
- Modern web browser

---

## Local Development

Use local development for testing changes before deploying.

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build and start local development server:**
   ```bash
   npm run dev
   ```
   This will build the project and start the server at `http://localhost:3000`

3. **Alternative - Manual build and serve:**
   ```bash
   npm run build
   npx http-server public -p 3000
   ```

### Local Development Scripts

- `npm run dev` - Build project and start development server at `http://localhost:3000`
- `npm run build` - Full build (runs asset pipeline + environment injection)
- `npm run build:assets` - Copy static assets from `src/assets/` to `public/assets/`
- `npm run build:env` - Inject environment variables and copy JS modules to `public/js/`
- `npm run clean` - Remove built files (`public/js/` and `public/assets/`)

---

## Remote Hosting (Firebase)

Deploy your application to Firebase Hosting for production use.

### Firebase Configuration

The project is configured for Firebase Hosting with:
- **Project ID**: `base-website-dee90` (configured in `.firebaserc`)
- **Hosting Config**: `firebase.json` (caching, security headers, routing)
- **Public URL**: `https://base-website-dee90.web.app`

### Deployment Prerequisites

1. **Firebase CLI Login:**
   ```bash
   firebase login
   ```

2. **Verify Project Connection:**
   ```bash
   firebase projects:list
   firebase use base-website-dee90
   ```

### Deployment Scripts

**Production Deployment:**
```bash
npm run deploy
```
Builds the project and deploys to production (`https://base-website-dee90.web.app`)

**Preview Channel Deployment (Testing):**
```bash
npm run deploy:preview
```
Deploys to a temporary preview URL (expires in 7 days) for testing before production.

**Open Live Site:**
```bash
npm run firebase:open
```
Opens your deployed site in the browser.

### Deployment Workflow

1. **Test Locally:**
   ```bash
   npm run dev
   # Test at http://localhost:3000
   ```

2. **Deploy to Preview (Optional):**
   ```bash
   npm run deploy:preview
   # Test at preview URL before production
   ```

3. **Deploy to Production:**
   ```bash
   npm run deploy
   # Live at https://base-website-dee90.web.app
   ```

### Firebase Hosting Features

- **Global CDN**: Fast load times worldwide
- **Free SSL**: Automatic HTTPS certificates
- **Optimized Caching**:
  - Static assets (JS/CSS/images): 1 year cache
  - HTML files: 1 hour cache with revalidation
- **Security Headers**: XSS protection, clickjacking prevention
- **SPA Routing**: All routes serve `index.html` for single-page app behavior
- **Preview Channels**: Test deployments before going live (auto-expire after 7 days)

### Firebase Free Tier Limits

- **Storage**: 10 GB
- **Bandwidth**: 360 MB/day (~11 GB/month)
- **Build Time**: Handled locally (no server-side builds)
- **Custom Domains**: 1 domain per project

## Firebase Configuration

### Authentication Setup
The app uses Firebase Authentication with Google sign-in. Configuration is stored in:
- **Source**: `src/js/firebase-config.js` (template with placeholders)
- **Environment**: `.env` (actual Firebase config values)
- **Runtime**: Environment variables injected during build via `scripts/inject-env.js`

### Hosting Setup
Firebase Hosting configuration:
- **Project**: `.firebaserc` (Firebase project ID)
- **Hosting Rules**: `firebase.json` (deployment config, caching, security headers)
- **Public Directory**: `public/` (built files deployed to Firebase)

### Required Firebase Console Settings
1. **Authentication**: Google sign-in provider must be enabled
2. **Authorized Domains**: Automatically configured for `*.web.app` and `*.firebaseapp.com`
3. **Support Email**: Required for Google OAuth (set in Firebase Console)

## Project Structure

```
├── public/                             # Served directory (deployed to Firebase)
│   ├── index.html                      # Main HTML file
│   ├── js/                             # Built JavaScript (generated by build:env)
│   │   ├── modules/
│   │   │   ├── auth.js                 # Authentication module
│   │   │   ├── firebase-config.js      # Firebase configuration (env injected)
│   │   │   └── ui.js                   # UI utilities module
│   │   └── main.js                     # Application entry point
│   └── assets/                         # Built static assets (generated by build:assets)
│       └── images/
│           └── placeholders/
│               └── default-avatar.svg  # Default user avatar fallback
│
├── src/                                # Source files
│   ├── js/                             # JavaScript source
│   │   ├── modules/
│   │   │   ├── auth.js                 # Authentication module (source)
│   │   │   └── ui.js                   # UI utilities module (source)
│   │   ├── firebase-config.js          # Firebase configuration (template)
│   │   └── main.js                     # Application entry point (source)
│   └── assets/                         # Static assets (source)
│       └── images/
│           └── placeholders/
│               ├── default-avatar.svg  # Default user avatar
│               └── README.md           # Asset documentation
│
├── scripts/
│   ├── build-assets.js                 # Asset pipeline script
│   └── inject-env.js                   # Environment injection script
│
├── .prompts/                           # Development guidance
│   ├── asset-reusability.md            # Asset management patterns
│   ├── code-structure.md               # Architecture patterns
│   ├── firebase-best-practices.md      # Firebase patterns
│   ├── deployment-cicd.md              # Deployment strategies
│   └── ... (other guidance files)
│
├── firebase.json                       # Firebase Hosting configuration
├── .firebaserc                         # Firebase project ID
├── .env                                # Environment variables (not committed)
├── .env.example                        # Environment variables template
├── CLAUDE.md                           # Claude Code development guide
├── package.json                        # Dependencies and build scripts
└── README.md                           # Project documentation
```

## Build Process

The project uses a two-stage build process:

### 1. Asset Pipeline (`build:assets`)
Copies static resources from `src/assets/` to `public/assets/`:
- Images (SVG, PNG, JPG)
- Icons and placeholders
- Future: fonts, data files, etc.

**Example**: `src/assets/images/placeholders/default-avatar.svg` → `public/assets/images/placeholders/default-avatar.svg`

### 2. Environment Injection (`build:env`)
Processes JavaScript modules with environment variable injection:
- Copies JS files from `src/js/` to `public/js/`
- Injects Firebase configuration
- Maintains module structure

### Combined Build
Running `npm run build` executes both stages in order:
1. `build:assets` - Ensures all static assets are available
2. `build:env` - Ensures all JavaScript modules are processed

## Architecture

The application uses a **modular architecture** designed for incremental feature development:

### JavaScript Modules
- **`src/js/modules/auth.js`** - Authentication logic and Firebase Auth integration
- **`src/js/modules/ui.js`** - DOM manipulation and UI state management
- **`src/js/modules/firebase.js`** - Firebase configuration and validation
- **`src/js/main.js`** - Application orchestrator that initializes all modules

### Static Assets
- **`src/assets/images/placeholders/`** - Reusable fallback images (avatars, thumbnails, error states)
- Assets are referenced by application code via `/assets/` path
- Documented in individual README files within asset directories

This structure allows easy addition of new features by creating additional modules (e.g., `database.js`, `storage.js`) or assets (icons, illustrations) without modifying existing code.

## Adding New Assets

To add new static assets (images, icons, fonts, etc.):

1. **Create asset in source directory:**
   ```bash
   # Example: Adding a new placeholder
   src/assets/images/placeholders/default-thumbnail.svg
   ```

2. **Document the asset:**
   Update `src/assets/images/placeholders/README.md` with:
   - Asset purpose
   - Where it's used
   - Dimensions/specifications

3. **Reference in code:**
   ```javascript
   // Use the /assets/ path (will be available after build)
   this.thumbnail.src = '/assets/images/placeholders/default-thumbnail.svg';
   ```

4. **Build the project:**
   ```bash
   npm run build:assets
   # or
   npm run build
   ```

The asset will be automatically copied to `public/assets/` and available to your application.

## Authentication Flow

1. User clicks "Sign in with Google"
2. Firebase initiates OAuth flow
3. Upon success, user information is displayed (with profile picture or default avatar)
4. Authentication state persists across sessions