/**
 * Type declarations for the Firebase SDK loaded from the gstatic CDN.
 *
 * The app imports Firebase by absolute URL and `vite.config.js` marks those
 * URLs external, so the SDK is never bundled — the browser fetches it from
 * gstatic at runtime. TypeScript cannot resolve an `https:` specifier, so
 * without these declarations every Firebase import is an unresolved module and
 * every Firebase value degrades to an error type.
 *
 * Each URL maps onto the matching entry point of the `firebase` package,
 * installed as a **devDependency for types only** — nothing about the shipped
 * bundle changes.
 *
 * These were previously untyped (`declare module '...'`, exports as `any`),
 * because `@firebase/rules-unit-testing@4.x` peered `firebase@^11` while the
 * runtime was pinned to 10.13.2, so the package could not be installed at all
 * without breaking `npm ci`. Aligning both on v12 is what made real types
 * possible.
 *
 * Only these six URLs should appear anywhere in `src/` — they all live in
 * `src/infrastructure/firebase-sdk.js`, which is the single place the version
 * is written. `tests/unit/firebase-sdk-version.test.js` asserts that the URLs
 * here, the URLs there, and the `firebase` devDependency all agree; a mismatch
 * would mean type-checking against a different SDK than ships.
 */

declare module 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js' {
    export * from 'firebase/app';
}

declare module 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js' {
    export * from 'firebase/auth';
}

declare module 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js' {
    export * from 'firebase/firestore';
}

declare module 'https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js' {
    export * from 'firebase/functions';
}

declare module 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app-check.js' {
    export * from 'firebase/app-check';
}

declare module 'https://www.gstatic.com/firebasejs/12.17.1/firebase-performance.js' {
    export * from 'firebase/performance';
}
