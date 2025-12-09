# Development Guide

## Prerequisites

- Node.js 24.x or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Modern web browser

## Local Development

### Setup

```bash
npm install
npm run dev
```

This starts the Vite development server with Hot Module Replacement (HMR) at http://localhost:3000

### Build Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build with Vite |
| `npm run preview` | Preview production build locally |
| `npm run clean` | Remove build output (`dist/`) |
| `npm run deploy` | Build and deploy to production |
| `npm run deploy:preview` | Build and deploy to preview channel |

## Build Process

The project uses **Vite** for modern development tooling:

### Development Mode (`npm run dev`)
- Instant server start with native ES modules
- Hot Module Replacement (HMR) for instant updates
- Fast refresh without losing application state
- On-demand compilation for fast iteration

### Production Build (`npm run build`)
- Automatic code splitting and tree-shaking
- Asset optimization and hashing
- Minification with Terser
- Source maps for debugging
- Output to `dist/` directory

### Environment Variables
- Vite natively loads `.env` files from project root
- Variables prefixed with `VITE_` are exposed to client code
- Access via `import.meta.env.VITE_*` in source files
- No build-time template injection needed

## Deployment

### Firebase Hosting

**Production**: https://salmoncow.web.app

```bash
# Deploy to production
npm run deploy

# Deploy to preview channel (expires in 7 days)
npm run deploy:preview

# Open live site
npm run firebase:open
```

### Firebase CLI Setup

```bash
firebase login
firebase use salmoncow
```

### Hosting Features

- Global CDN with automatic HTTPS
- Static assets cached for 1 year
- HTML cached for 1 hour with revalidation
- Security headers (XSS protection, clickjacking prevention)
- SPA routing (all routes serve `index.html`)

## Project Structure

```
├── dist/                       # Build output (gitignored)
│   ├── index.html
│   └── assets/                 # Optimized assets with hashes
│       ├── js/                 # Minified JavaScript bundles
│       ├── styles/             # Optimized CSS
│       └── images/             # Optimized images
│
├── src/                        # Source files (Vite root)
│   ├── index.html              # HTML entry point
│   ├── main.js                 # JavaScript entry point
│   ├── firebase-config.js      # Firebase configuration
│   ├── modules/
│   │   ├── auth.js             # Authentication
│   │   ├── navigation.js       # Navigation bar
│   │   └── ui.js               # UI utilities
│   ├── styles/
│   │   ├── main.css            # Base styles
│   │   └── navigation.css      # Navigation styles
│   └── assets/
│       └── images/             # Source images
│           ├── branding/       # Logo and brand assets
│           └── placeholders/   # Default avatars, etc.
│
├── public/                     # Static assets (copied as-is)
│   └── assets/
│       └── images/
│           └── placeholders/   # Public static images
│
├── .prompts/                   # Development guidance
├── vite.config.js              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── firebase.json               # Hosting configuration
├── .firebaserc                 # Firebase project ID
├── .env                        # Environment variables (not committed)
└── .env.example                # Environment template
```

## Firebase Configuration

### Environment Variables

Firebase config is loaded from `.env` via Vite's native environment variable support:
- **Configuration file**: `src/firebase-config.js`
- **Access pattern**: `import.meta.env.VITE_*`
- **Loading**: Automatic at build time and dev server startup

### Required Firebase Console Settings

1. **Authentication**: Enable Google sign-in provider
2. **Authorized Domains**: Automatically configured for `*.web.app`
3. **Support Email**: Required for Google OAuth

## Architecture

The application uses modular JavaScript architecture:

- **`auth.js`** - Firebase Authentication integration
- **`navigation.js`** - Navigation bar and user dropdown
- **`ui.js`** - DOM manipulation and UI state
- **`main.js`** - Application orchestrator

New features can be added as modules without modifying existing code.
