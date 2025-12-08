# Development Guide

## Prerequisites

- Node.js (for package management and build process)
- Firebase CLI (`npm install -g firebase-tools`)
- Modern web browser

## Local Development

### Setup

```bash
npm install
npm run dev
```

This builds the project and starts the server at http://localhost:3000

### Build Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Build and start development server |
| `npm run build` | Full build (assets + environment injection) |
| `npm run build:assets` | Copy static assets from `src/assets/` to `public/assets/` |
| `npm run build:env` | Inject environment variables and copy JS to `public/js/` |
| `npm run clean` | Remove built files |

## Build Process

The project uses a two-stage build:

1. **Asset Pipeline** (`build:assets`) - Copies static resources from `src/assets/` to `public/assets/`
2. **Environment Injection** (`build:env`) - Processes JavaScript with Firebase config injection

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
├── public/                     # Deployed directory
│   ├── index.html
│   ├── js/                     # Built JavaScript
│   └── assets/                 # Built static assets
│
├── src/                        # Source files
│   ├── js/
│   │   ├── modules/
│   │   │   ├── auth.js         # Authentication
│   │   │   ├── navigation.js   # Navigation bar
│   │   │   └── ui.js           # UI utilities
│   │   ├── firebase-config.js  # Firebase config template
│   │   └── main.js             # Entry point
│   └── assets/
│       ├── images/branding/    # Logo and brand assets
│       ├── images/placeholders/
│       └── styles/             # CSS files
│
├── scripts/
│   ├── build-assets.js         # Asset pipeline
│   └── inject-env.js           # Environment injection
│
├── .prompts/                   # Development guidance
├── firebase.json               # Hosting configuration
├── .firebaserc                 # Firebase project ID
├── .env                        # Environment variables (not committed)
└── .env.example                # Environment template
```

## Firebase Configuration

### Environment Variables

Firebase config is stored in `.env` and injected at build time:
- **Source template**: `src/js/firebase-config.js`
- **Injection script**: `scripts/inject-env.js`

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
