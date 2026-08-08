/**
 * Type declarations for the Firebase SDK loaded from the gstatic CDN.
 *
 * The app imports Firebase by absolute URL and `vite.config.js` marks those
 * URLs external, so the SDK is never bundled — the browser fetches it from
 * gstatic at runtime. TypeScript cannot resolve an http(s) specifier, so every
 * Firebase import was an unresolved module, every Firebase value degraded to an
 * error type, and the resulting cascade accounted for a large share of the
 * errors that appeared the moment `checkJs` was switched on.
 *
 * These declarations map each CDN URL onto the matching entry point of the
 * `firebase` package, which is installed as a **devDependency for types only**.
 * Nothing here changes what ships: the runtime still loads from the CDN.
 *
 * Installing the package has a second benefit worth keeping. The SDK version
 * was previously pinned only inside URL strings, invisible to `npm audit` and
 * Dependabot. It is now a real dependency entry those tools can see.
 *
 * The version below must match the URLs used in `src/`. Keeping them in step is
 * currently manual; a mismatch shows up as a type error rather than silently,
 * because the declared module specifier simply stops matching the import.
 */

declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js' {
    export * from 'firebase/app';
}

declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js' {
    export * from 'firebase/auth';
}

declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js' {
    export * from 'firebase/firestore';
}

declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-functions.js' {
    export * from 'firebase/functions';
}

declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-check.js' {
    export * from 'firebase/app-check';
}

declare module 'https://www.gstatic.com/firebasejs/10.13.2/firebase-performance.js' {
    export * from 'firebase/performance';
}
