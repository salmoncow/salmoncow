import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { escapeHtml, safeImageUrl } from '../../../src/utils/escape-html.js';

describe('escapeHtml', () => {
    it('escapes the five HTML-significant characters', () => {
        expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
    });

    it('escapes quotes, so a value cannot break out of an HTML attribute', () => {
        // The previous UserPortal implementation (div.textContent) left quotes
        // intact, which is exactly what makes attribute injection possible.
        const payload = 'x" onerror="alert(1)';
        expect(escapeHtml(payload)).not.toContain('"');
    });

    it('escapes ampersands first so entities are not double-decoded', () => {
        expect(escapeHtml('&lt;')).toBe('&amp;lt;');
    });

    it('returns an empty string for null and undefined', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });

    it('stringifies non-string input', () => {
        expect(escapeHtml(42)).toBe('42');
    });
});

describe('safeImageUrl', () => {
    it('accepts absolute https URLs', () => {
        const url = 'https://lh3.googleusercontent.com/a/photo.jpg';
        expect(safeImageUrl(url)).toBe(url);
    });

    it('accepts same-origin relative paths (the bundled default avatar)', () => {
        expect(safeImageUrl('/assets/images/default-avatar.svg')).toBe(
            'http://localhost/assets/images/default-avatar.svg',
        );
    });

    it.each([
        ['javascript:alert(1)'],
        ['JaVaScRiPt:alert(1)'],
        ['vbscript:msgbox(1)'],
        ['data:text/html,<script>alert(1)</script>'],
        ['data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='],
    ])('rejects the dangerous scheme %s', (payload) => {
        expect(safeImageUrl(payload)).toBeNull();
    });

    it('rejects plain http on a foreign origin', () => {
        expect(safeImageUrl('http://evil.example.com/x.png')).toBeNull();
    });

    it('returns null for empty, blank, and nullish input', () => {
        expect(safeImageUrl('')).toBeNull();
        expect(safeImageUrl('   ')).toBeNull();
        expect(safeImageUrl(null)).toBeNull();
        expect(safeImageUrl(undefined)).toBeNull();
    });
});

/**
 * Source-level regression guards.
 *
 * The stored-XSS bug these fixes close was not a missing escape call — callers
 * escaped correctly. It was that <user-avatar> read the already-decoded
 * attribute back out via getAttribute() and re-interpolated it into innerHTML,
 * undoing the caller's work. A behavioural test in jsdom would catch it, but
 * the unit lane runs in node; asserting on the source keeps the guard cheap and
 * makes the invariant explicit. Mirrors the App Check guards in
 * functions/tests/setUserRole.test.ts.
 */
describe('UserAvatar source invariants', () => {
    const source = readFileSync(
        fileURLToPath(new URL('../../../src/components/UserAvatar.js', import.meta.url)),
        'utf8',
    );

    it('never assigns to innerHTML', () => {
        expect(source).not.toMatch(/\.innerHTML\s*=/);
    });

    it('routes the photo attribute through safeImageUrl', () => {
        expect(source).toMatch(/safeImageUrl\(this\.getAttribute\('photo'\)\)/);
    });

    it('assigns alt via a DOM property rather than string interpolation', () => {
        expect(source).toMatch(/img\.alt\s*=/);
    });
});
