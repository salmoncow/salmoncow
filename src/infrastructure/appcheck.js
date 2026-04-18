/**
 * Firebase App Check bootstrap.
 *
 * - In emulator mode: skipped. The local emulator doesn't enforce App Check
 *   and local traffic can't produce a valid reCAPTCHA Enterprise token.
 * - In prod: initializes reCAPTCHA Enterprise using the site key from env.
 *
 * Must be called AFTER initializeApp and BEFORE any Firestore/Functions
 * operations that require App Check enforcement (e.g. setUserRole callable).
 *
 * Spec §VI, §X.4 (App Check enforcement on setUserRole)
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
        console.info('[app-check] skipped in emulator mode');
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
