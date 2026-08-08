/**
 * Remote sink for the error reporter — ships reports to the logClientError
 * callable, which writes them to Cloud Logging.
 *
 * Without this, reports reach only the console of the user who hit the error,
 * so a production failure stays invisible to the maintainer.
 *
 * Two hazards shape this file:
 *
 *   1. **Recursion.** If shipping a report fails and that failure is itself
 *      reported, the reporter calls the sink again and the loop never ends —
 *      worst on a flaky network, which is exactly when it triggers. So sink
 *      failures are swallowed here and never routed back through reportError().
 *
 *   2. **Blocking.** Reporting runs while the app is already unhealthy. Nothing
 *      awaits the call; a hung network request must not stall a render or a
 *      bootstrap path.
 */
import { callable } from './functions.js';
import { isEmulatorMode } from './emulator.js';

/** Mirrors the server-side caps in functions/src/lib/validate.ts. */
const LIMITS = Object.freeze({
    message: 1000,
    stack: 4000,
    source: 100,
    route: 200,
    contextKeys: 20,
    contextValue: 500,
});

function truncate(value, max) {
    if (typeof value !== 'string') return value;
    return value.length > max ? value.slice(0, max) : value;
}

/**
 * Shape a report to satisfy the callable's strict schema.
 *
 * Trimming client-side rather than letting the server reject means a slightly
 * oversized stack still gets logged instead of being dropped as invalid — the
 * report is worth more than its last 200 characters.
 */
function toPayload(report) {
    const context = {};
    let keys = 0;
    for (const [k, v] of Object.entries(report.context || {})) {
        if (keys >= LIMITS.contextKeys) break;
        // The schema permits primitives only; anything else is stringified so a
        // nested object cannot slip past the server's per-value cap.
        const primitive =
            v === null || ['string', 'number', 'boolean'].includes(typeof v) ? v : String(v);
        context[truncate(k, 64)] = truncate(primitive, LIMITS.contextValue);
        keys += 1;
    }

    return {
        message: truncate(report.message, LIMITS.message) || 'unknown error',
        stack: report.stack ? truncate(report.stack, LIMITS.stack) : null,
        source: truncate(report.source, LIMITS.source),
        severity: report.severity === 'warning' ? 'warning' : 'error',
        route: report.route ? truncate(report.route, LIMITS.route) : null,
        at: report.at,
        context,
    };
}

/**
 * Build a sink bound to a Firebase app. Register with
 * `addSink(createRemoteErrorSink(app))`.
 *
 * @param {import('firebase/app').FirebaseApp} firebaseApp
 * @returns {(report: object) => void}
 */
export function createRemoteErrorSink(firebaseApp) {
    let send;
    try {
        send = callable(firebaseApp, 'logClientError');
    } catch {
        // Functions unavailable (e.g. bootstrap failed before this point).
        // A no-op sink keeps the console sink working.
        return () => {};
    }

    return function remoteErrorSink(report) {
        try {
            // Fire and forget. The .catch is mandatory: an unhandled rejection
            // here would be picked up by the reporter's own
            // 'unhandledrejection' handler and fed straight back in.
            void send(toPayload(report)).catch(() => {
                // Swallowed on purpose — see the recursion note at the top.
            });
        } catch {
            // Same reasoning for synchronous throws.
        }
    };
}

/**
 * Whether the remote sink should be attached.
 *
 * Off under the emulator by default: local development produces a lot of
 * deliberate errors, and they are already visible in the console. Set
 * VITE_REMOTE_ERRORS=true to exercise the real path locally against the
 * functions emulator.
 */
export function shouldAttachRemoteSink() {
    if (!isEmulatorMode()) return true;
    return import.meta.env.VITE_REMOTE_ERRORS === 'true';
}
