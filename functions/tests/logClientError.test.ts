import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { logClientErrorInput } from '../src/lib/validate.js';

/**
 * logClientError is a thin, stateless callable: validate, then write one
 * structured Cloud Logging entry. There is no Firestore state to assert
 * against, so the meaningful coverage is the input contract — which is also
 * the cost control, since every field cap bounds what a caller can force into
 * a billed log entry.
 *
 * The App Check posture is asserted at the source level, mirroring
 * setUserRole.test.ts: firebase-functions-test's `wrap` does not actually
 * enforce App Check, so a behavioural test would assert nothing.
 */

describe('logClientErrorInput validation', () => {
    const valid = {
        message: 'boom',
        stack: 'Error: boom\n  at x',
        source: 'window.onerror',
        severity: 'error' as const,
        route: '#/profile',
        at: '2026-08-08T00:00:00.000Z',
        context: { file: 'main.js', line: 42 },
    };

    it('accepts a well-formed report', () => {
        expect(logClientErrorInput.safeParse(valid).success).toBe(true);
    });

    it('accepts a minimal report (message, source, severity only)', () => {
        const res = logClientErrorInput.safeParse({
            message: 'x',
            source: 'app',
            severity: 'warning',
        });
        expect(res.success).toBe(true);
    });

    it('rejects unknown keys rather than forwarding them to the log', () => {
        const res = logClientErrorInput.safeParse({ ...valid, email: 'a@b.com' });
        expect(res.success).toBe(false);
    });

    it('rejects an empty message', () => {
        expect(logClientErrorInput.safeParse({ ...valid, message: '' }).success).toBe(false);
    });

    it.each([
        ['message', 'message', 1001],
        ['stack', 'stack', 4001],
        ['source', 'source', 101],
        ['route', 'route', 201],
    ])('caps %s length', (_label, field, len) => {
        const res = logClientErrorInput.safeParse({ ...valid, [field]: 'x'.repeat(len) });
        expect(res.success).toBe(false);
    });

    it('rejects an invalid severity', () => {
        expect(logClientErrorInput.safeParse({ ...valid, severity: 'fatal' }).success).toBe(false);
    });

    it('rejects nested objects in context, which could smuggle a large payload', () => {
        const res = logClientErrorInput.safeParse({
            ...valid,
            context: { nested: { a: 1 } },
        });
        expect(res.success).toBe(false);
    });

    it('caps the number of context keys', () => {
        const context = Object.fromEntries(
            Array.from({ length: 21 }, (_, i) => [`k${i}`, 'v']),
        );
        expect(logClientErrorInput.safeParse({ ...valid, context }).success).toBe(false);
    });

    it('caps context value length', () => {
        const res = logClientErrorInput.safeParse({
            ...valid,
            context: { big: 'x'.repeat(501) },
        });
        expect(res.success).toBe(false);
    });

    it('allows null stack and route', () => {
        const res = logClientErrorInput.safeParse({ ...valid, stack: null, route: null });
        expect(res.success).toBe(true);
    });
});

describe('logClientError source-level posture guards', () => {
    const source = readFileSync(
        resolve(__dirname, '../src/logClientError.ts'),
        'utf8',
    );

    it('enforces App Check by default', () => {
        expect(source).toMatch(/enforceAppCheck:\s*true/);
    });

    it('relaxes App Check only under FUNCTIONS_EMULATOR, in positive form', () => {
        // Positive form: the default is true and only the emulator env var
        // flips it off. A negative-form check would fail open in production if
        // the variable were ever unset unexpectedly.
        expect(source).toMatch(/if\s*\(process\.env\.FUNCTIONS_EMULATOR\)/);
        expect(source).toMatch(/opts\.enforceAppCheck\s*=\s*false/);
    });

    it('bounds autoscaling so a flood cannot become a billing surprise', () => {
        expect(source).toMatch(/maxInstances:\s*\d+/);
    });

    it('does not echo the caller payload back in the error response', () => {
        // The payload is untrusted and potentially large; only issue paths and
        // codes are returned.
        expect(source).not.toMatch(/HttpsError\([^)]*request\.data/);
    });

    it('logs no profile field other than uid', () => {
        for (const field of ['email', 'displayName', 'photoURL']) {
            expect(source).not.toContain(field);
        }
    });

    it('never puts a `message` key in the structured payload', () => {
        // firebase-functions/logger treats `message` as the entry's own log
        // text and overwrites it with a trace of its own — observed against the
        // emulator, where the client's message was silently replaced by the
        // logger's internal stack. Reintroducing that key would lose the single
        // most important field without any test failing, so pin it here.
        expect(source).not.toMatch(/^\s*message:/m);
        expect(source).toMatch(/clientMessage:\s*report\.message/);
    });
});
