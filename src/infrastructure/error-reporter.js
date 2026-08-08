/**
 * Client-side error reporting.
 *
 * The app runs in production with no error visibility: failures landed in
 * console.error inside the user's own browser and were never collected, so an
 * auth or role-resolution failure for a real user was invisible to the
 * maintainer. This module is the single funnel — global handlers plus explicit
 * reportError() calls — so that attaching a remote sink later is a one-file
 * change instead of a hunt through a dozen call sites.
 *
 * Design constraints, in priority order:
 *   1. Never throw. Code that throws while handling an error turns a recoverable
 *      failure into a dead page, and it runs at the exact moment the app is
 *      already unhealthy.
 *   2. Never block. Reporting is fire-and-forget; nothing awaits a sink.
 *   3. Bounded. A render loop that throws every frame must not emit thousands of
 *      reports, so identical errors are deduped and the session is capped.
 *   4. Minimal PII (constitution §III.2). Message, stack, and route only —
 *      never email, displayName, or photoURL. uid is included only when a caller
 *      passes it deliberately.
 */

/** Stop reporting after this many distinct errors in one page session. */
const MAX_REPORTS_PER_SESSION = 25;

/** Sinks receive a normalized report object. Console is always present. */
const sinks = [];

/** Fingerprints already reported this session, for dedupe. */
const seen = new Set();

let reportCount = 0;
let installed = false;

/**
 * Console sink. Always registered — it is the developer-facing view and the
 * only sink guaranteed to work before Firebase has initialized.
 * @param {object} report
 */
function consoleSink(report) {
    const label = `[error-reporter] ${report.source}`;
    if (report.severity === 'warning') {
        console.warn(label, report.message, report.context);
    } else {
        console.error(label, report.message, report.stack || '', report.context);
    }
}

sinks.push(consoleSink);

/**
 * Register an additional sink (e.g. a remote reporter). Sinks must not throw;
 * if one does, it is dropped rather than allowed to break reporting.
 * @param {(report: object) => void} sink
 */
export function addSink(sink) {
    if (typeof sink === 'function') sinks.push(sink);
}

/** Coerce anything throwable into { message, stack }. */
function normalizeError(error) {
    if (error instanceof Error) {
        return { message: error.message || String(error), stack: error.stack || null };
    }
    if (typeof error === 'string') {
        return { message: error, stack: null };
    }
    // ErrorEvent, PromiseRejectionEvent payloads, plain objects, null…
    try {
        return { message: JSON.stringify(error) ?? String(error), stack: null };
    } catch {
        return { message: String(error), stack: null };
    }
}

/**
 * Dedupe key. Deliberately excludes the timestamp so a repeating error is
 * reported once, and includes the stack so distinct call paths stay distinct.
 */
function fingerprint(message, stack, source) {
    return `${source}::${message}::${(stack || '').slice(0, 200)}`;
}

/**
 * Report an error. Safe to call from anywhere, including inside catch blocks
 * in error handlers.
 *
 * @param {unknown} error
 * @param {object} [options]
 * @param {string} [options.source]   Where it came from, e.g. 'bootstrap'
 * @param {'error'|'warning'} [options.severity]
 * @param {object} [options.context]  Extra non-PII detail
 */
export function reportError(error, { source = 'app', severity = 'error', context = {} } = {}) {
    try {
        const { message, stack } = normalizeError(error);

        const key = fingerprint(message, stack, source);
        if (seen.has(key)) return;

        if (reportCount >= MAX_REPORTS_PER_SESSION) return;
        seen.add(key);
        reportCount += 1;

        const report = {
            message,
            stack,
            source,
            severity,
            // location.hash is the app's route; the full URL is same-origin and
            // carries no query secrets (see the privacy rule in CLAUDE.md).
            route: typeof window !== 'undefined' ? window.location?.hash || '/' : null,
            at: new Date().toISOString(),
            context,
        };

        for (const sink of sinks) {
            try {
                sink(report);
            } catch {
                // A broken sink must never break reporting.
            }
        }
    } catch {
        // Absolute last resort: swallow. Never let the reporter throw.
    }
}

/**
 * Install window-level handlers for errors that no try/catch sees:
 * uncaught exceptions and unhandled promise rejections. Idempotent.
 *
 * Call this as early as possible in bootstrap — before Firebase, before any
 * module that can throw — so early failures are captured too.
 */
export function installGlobalHandlers() {
    if (installed || typeof window === 'undefined') return;
    installed = true;

    window.addEventListener('error', (event) => {
        // Resource load failures (img/script 404s) also fire 'error' but have no
        // .error and bubble from the element; they are noise here.
        if (!event.error && !event.message) return;
        reportError(event.error || event.message, {
            source: 'window.onerror',
            context: {
                file: event.filename || null,
                line: event.lineno ?? null,
                col: event.colno ?? null,
            },
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        reportError(event.reason, { source: 'unhandledrejection' });
    });
}

/** Test seam: reset dedupe/cap state between cases. */
export function __resetForTests() {
    seen.clear();
    reportCount = 0;
    installed = false;
    sinks.length = 0;
    sinks.push(consoleSink);
}
