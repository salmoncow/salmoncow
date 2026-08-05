/**
 * HTML escaping and URL sanitization helpers.
 *
 * Single source of truth for both. Previously `escapeHtml` was implemented
 * twice with different behavior — AdminPortal escaped quotes, UserPortal
 * (via the `div.textContent` trick) did not. That difference is a security
 * property, not a style choice: values interpolated into HTML *attributes*
 * must escape quotes or an attacker can close the attribute and add their own.
 */

/**
 * Escape a value for interpolation into HTML text or a quoted attribute.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Resolve a user-supplied image URL to something safe to assign to `img.src`.
 *
 * Only absolute https: URLs and same-origin relative paths are allowed, so a
 * stored `javascript:`, `data:`, or `vbscript:` value can never reach the DOM.
 * Returns null when the value is unusable; callers fall back to their default.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
export function safeImageUrl(value) {
    if (value == null || value === '') return null;

    const raw = String(value).trim();
    if (raw === '') return null;

    // Falls back to a placeholder origin outside the browser so this stays
    // unit-testable; only relative paths resolve against it, and those are
    // same-origin by definition.
    const origin = typeof window !== 'undefined' && window.location
        ? window.location.origin
        : 'http://localhost';

    let url;
    try {
        url = new URL(raw, origin);
    } catch {
        return null;
    }

    if (url.protocol !== 'https:' && url.origin !== origin) {
        return null;
    }

    return url.href;
}
