/**
 * Module declarations for the Firebase SDK loaded from the gstatic CDN.
 *
 * The app imports Firebase by absolute URL and `vite.config.js` marks those
 * URLs external, so the SDK is never bundled — the browser fetches it from
 * gstatic at runtime. TypeScript cannot resolve an http(s) specifier, so every
 * Firebase import was an unresolved module (TS2307).
 *
 * These are **untyped** declarations: they tell TypeScript the modules exist,
 * and their exports are `any`. That silences the unresolved-module errors
 * without pulling in a types package.
 *
 * Why not install `firebase` for real types? Because it currently cannot be
 * installed alongside the test tooling:
 *
 *   @firebase/rules-unit-testing@4.x declares a peer dependency on
 *   firebase@^11, while the runtime here is pinned to 10.13.2. Adding
 *   firebase@10.13.2 makes `npm ci` fail with ERESOLVE.
 *
 * That skew — test tooling on v11, runtime on v10 — is a real finding, and it
 * is the concrete reason to do the SDK upgrade. Once the runtime moves to a
 * version whose peers line up, replace each declaration body below with
 * `export * from 'firebase/<entry>';` and the app gains genuine Firebase types
 * (which, while briefly in place, already caught a miscast query-constraint
 * array in listPaginated).
 *
 * The version in these specifiers must match the URLs used in `src/`; a
 * mismatch resurfaces as TS2307 rather than failing silently.
 */

declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-functions.js';
declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-check.js';
declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-performance.js';
