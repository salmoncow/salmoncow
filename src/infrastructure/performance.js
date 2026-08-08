/**
 * Firebase Performance Monitoring.
 *
 * Constitution §III.3 sets p95 targets for page load, TTI, FCP, CLS, and LCP,
 * but nothing measured them — they were unenforceable claims. Performance
 * Monitoring collects those automatically from real sessions (RUM), which is
 * the only way a p95 target means anything.
 *
 * Chosen over Firebase Analytics deliberately. Analytics would give an
 * `exception` event sink, but its SDK loads gtag from
 * https://www.googletagmanager.com — which would mean putting a documented
 * CSP-bypass origin back into script-src, the exact entry removed in af76bae
 * when it was found to be unused. Performance loads from gstatic (already
 * allowed) and reports to *.googleapis.com (already allowed by the existing
 * connect-src wildcard), so it needs no CSP change at all.
 *
 * Skipped under the emulator: local page loads are not representative and would
 * pollute production percentiles.
 */
import { getPerformance } from './firebase-sdk.js';
import { isEmulatorMode } from './emulator.js';
import { reportError } from './error-reporter.js';

let performanceInstance = null;

/**
 * Initialize Performance Monitoring. Safe to call once during bootstrap.
 *
 * Never throws: observability is not worth breaking the app for. A failure
 * here is reported and swallowed.
 *
 * @param {import('firebase/app').FirebaseApp} app
 * @returns {object|null} the Performance instance, or null when skipped
 */
export function initPerformance(app) {
    if (isEmulatorMode()) {
        console.info('[performance] emulator mode — Performance Monitoring skipped');
        return null;
    }

    if (performanceInstance) return performanceInstance;

    try {
        performanceInstance = getPerformance(app);
        return performanceInstance;
    } catch (error) {
        reportError(error, { source: 'performance-init', severity: 'warning' });
        return null;
    }
}
