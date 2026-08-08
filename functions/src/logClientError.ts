import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { logClientErrorInput } from './lib/validate.js';

// Production posture: App Check enforced.
// Local-emulator posture: App Check relaxed, because the emulator doesn't mock
// the App Check token-exchange endpoint. Written in positive form — the default
// is `true` and only FUNCTIONS_EMULATOR (never set in production) relaxes it —
// so a missing env var fails closed. Same pattern as setUserRole.
const opts = {
    enforceAppCheck: true,
    // Client errors are low-volume by nature. Bounding instances keeps a burst
    // queueing and shedding rather than autoscaling into unbounded spend.
    maxInstances: 3,
};
if (process.env.FUNCTIONS_EMULATOR) {
    opts.enforceAppCheck = false;
}

/**
 * logClientError — sink for browser-side errors, writing to Cloud Logging.
 *
 * The client funnels errors through src/infrastructure/error-reporter.js; this
 * is the remote half.
 *
 * Access model: gated by App Check, so callers must be a genuine instance of
 * this app. Sign-in is not part of the gate, because reports are accepted from
 * the pre-authentication phase of the session — that is where several of the
 * most useful reports originate. When the caller is signed in, uid is recorded.
 *
 * Abuse and cost controls are layered: App Check, the hard per-field caps in
 * logClientErrorInput, a bounded maxInstances, and client-side dedupe and
 * per-session capping in the reporter. Cloud Logging bills on ingestion volume,
 * so the input caps are a cost control as much as a validation rule.
 *
 * Writes are structured so Cloud Logging can query and alert on them:
 *   jsonPayload.clientError = true
 */
export const logClientError = onCall(opts, async (request) => {
    const parsed = logClientErrorInput.safeParse(request.data);
    if (!parsed.success) {
        // Do not echo the caller's payload back — it is untrusted and could be
        // large. The validation issues alone identify the problem.
        throw new HttpsError('invalid-argument', 'Invalid error report', {
            issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), code: i.code })),
        });
    }

    const report = parsed.data;

    // NOTE: do not put a `message` key in the structured payload.
    // firebase-functions/logger treats `message` as the entry's own log text
    // and overwrites it with a trace of its own — verified against the
    // emulator, where the client's message was silently replaced by the
    // logger's internal stack. The client message goes in `clientMessage`, and
    // the first argument carries a searchable summary.
    logger.error(`client-error: ${report.message}`, {
        clientError: true,
        clientMessage: report.message,
        clientStack: report.stack ?? null,
        source: report.source,
        clientSeverity: report.severity,
        route: report.route ?? null,
        reportedAt: report.at ?? null,
        context: report.context ?? {},
        // Present only when the caller happened to be signed in. Never any
        // other profile field — §III.2 data minimization.
        uid: request.auth?.uid ?? null,
    });

    // Returning a body at all is a courtesy; the client never blocks on it.
    return { received: true };
});
