/**
 * Firebase App Check bootstrap.
 *
 * - In emulator mode: skipped. The local Functions emulator doesn't mock the
 *   App Check token exchange (that hits real Firebase infra), and debug
 *   tokens would need to be registered in the real console. Instead, the
 *   setUserRole callable relaxes its enforceAppCheck guard when running
 *   under FUNCTIONS_EMULATOR (see functions/src/setUserRole.ts).
 * - In prod: initializes reCAPTCHA Enterprise using the site key from env.
 *
 * Spec §VII, §XI.4 (App Check enforcement on setUserRole)
 */
import {
    initializeAppCheck,
    ReCaptchaEnterpriseProvider,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-check.js';
import { isEmulatorMode } from './emulator.js';

let appCheckInstance = null;

export function initAppCheck(firebaseApp) {
    if (appCheckInstance) return appCheckInstance;

    if (isEmulatorMode()) {
        console.info('[app-check] skipped in emulator mode (server-side enforcement also relaxed)');
        return null;
    }

    const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
    if (!siteKey) {
        console.warn(
            '[app-check] VITE_RECAPTCHA_ENTERPRISE_SITE_KEY is not set; ' +
            'protected callables (setUserRole) will be rejected in production.',
        );
        return null;
    }

    appCheckInstance = initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
    });
    console.info('[app-check] initialized with reCAPTCHA Enterprise');
    return appCheckInstance;
}
