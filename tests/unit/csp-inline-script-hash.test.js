import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The Content-Security-Policy in firebase.json must carry a hash for every
 * inline <script> the build emits.
 *
 * Firebase Hosting serves static files, so a per-request nonce is impossible —
 * a 'sha256-...' source expression is the only way to allow a specific inline
 * script without opening the policy to all of them. That makes the hash a
 * build artifact that silently rots: edit the theme pre-paint script in
 * src/index.html and the deployed CSP blocks it, producing a flash of unstyled
 * content and a console violation that nobody sees until a user complains.
 *
 * This test fails the moment the two drift apart.
 *
 * NOTE: adding 'unsafe-inline' would also make the script run — and would
 * simultaneously re-enable the injected-handler XSS that the escaping work in
 * src/utils/escape-html.js and src/components/UserAvatar.js exists to prevent.
 * Fix the hash, never the policy.
 */

const repoRoot = new URL('../../', import.meta.url);
const distIndex = fileURLToPath(new URL('dist/index.html', repoRoot));
const firebaseJson = fileURLToPath(new URL('firebase.json', repoRoot));

/** Inline <script> blocks only — anything with a src= attribute is external. */
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

function cspValue() {
    const config = JSON.parse(readFileSync(firebaseJson, 'utf8'));
    const header = config.hosting.headers
        .flatMap((entry) => entry.headers)
        .find((h) => h.key === 'Content-Security-Policy');
    return header?.value ?? '';
}

/**
 * App Check depends on reCAPTCHA Enterprise, which talks to https://www.google.com.
 * That origin was present in script-src but missing from connect-src, so the
 * browser blocked reCAPTCHA's fetches, App Check attestation failed with 403,
 * and the SDK self-throttled for 24 hours — taking every App Check-gated
 * callable (logClientError, setUserRole) down with it, silently.
 *
 * The failure produced no user-visible symptom and no server-side error: the
 * callables were simply never reached. These assertions pin the origins that
 * App Check needs so the same silent outage cannot be reintroduced by tidying
 * the policy.
 */
describe('CSP App Check / reCAPTCHA requirements', () => {
    const directives = Object.fromEntries(
        cspValue()
            .split(';')
            .map((d) => d.trim())
            .filter(Boolean)
            .map((d) => {
                const [name, ...sources] = d.split(/\s+/);
                return [name, sources];
            }),
    );

    it.each([
        ['connect-src', 'reCAPTCHA Enterprise fetches its challenge from www.google.com'],
        ['script-src', 'the reCAPTCHA Enterprise script is served from www.google.com'],
        ['frame-src', 'reCAPTCHA renders its challenge in an iframe'],
    ])('%s allows https://www.google.com — %s', (directive) => {
        expect(directives[directive]).toContain('https://www.google.com');
    });

    it('connect-src allows the App Check exchange endpoint', () => {
        expect(directives['connect-src']).toContain('https://firebaseappcheck.googleapis.com');
    });
});

describe('CSP inline-script hashes', () => {
    it('never allows unsafe-inline in script-src', () => {
        // Independent of the build, so it runs even without dist/.
        const scriptSrc = cspValue().split(';').find((d) => d.trim().startsWith('script-src'));
        expect(scriptSrc).toBeDefined();
        expect(scriptSrc).not.toContain("'unsafe-inline'");
    });

    it.runIf(existsSync(distIndex))(
        'has a matching sha256 entry for every inline script in the build',
        () => {
            const html = readFileSync(distIndex, 'utf8');
            const csp = cspValue();

            const hashes = [...html.matchAll(INLINE_SCRIPT)].map(
                ([, body]) => `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`,
            );

            // Guards against the regex silently matching nothing after a
            // future build-tool change, which would make this test vacuous.
            expect(hashes.length).toBeGreaterThan(0);

            for (const hash of hashes) {
                expect(
                    csp,
                    `dist/index.html contains an inline script whose hash is missing from the CSP in firebase.json.\n` +
                        `Add '${hash}' to script-src.`,
                ).toContain(hash);
            }
        },
    );
});
