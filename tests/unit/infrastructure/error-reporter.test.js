/**
 * Unit tests for the error reporter.
 *
 * Runs in a plain-node environment; window is stubbed with vi.stubGlobal,
 * following the precedent in tests/unit/modules/theme.test.js — no jsdom.
 *
 * The guarantees under test are the ones that matter when the app is already
 * broken: the reporter must not throw, must not flood, and must not be taken
 * down by a bad sink.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    addSink,
    installGlobalHandlers,
    reportError,
    __resetForTests,
} from '../../../src/infrastructure/error-reporter.js';

function makeWindow() {
    const listeners = new Map();
    return {
        location: { hash: '#/profile' },
        addEventListener: vi.fn((type, fn) => {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(fn);
        }),
        _fire(type, event) {
            for (const fn of listeners.get(type) || []) fn(event);
        },
        _listenerTypes: () => [...listeners.keys()],
    };
}

let win;

beforeEach(() => {
    __resetForTests();
    win = makeWindow();
    vi.stubGlobal('window', win);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('reportError', () => {
    it('passes a normalized report to sinks', () => {
        const sink = vi.fn();
        addSink(sink);

        reportError(new Error('boom'), { source: 'bootstrap', context: { step: 'init' } });

        expect(sink).toHaveBeenCalledTimes(1);
        const report = sink.mock.calls[0][0];
        expect(report.message).toBe('boom');
        expect(report.source).toBe('bootstrap');
        expect(report.severity).toBe('error');
        expect(report.route).toBe('#/profile');
        expect(report.context).toEqual({ step: 'init' });
        expect(report.stack).toBeTruthy();
        expect(typeof report.at).toBe('string');
    });

    it.each([
        ['a string', 'plain failure', 'plain failure'],
        ['a plain object', { code: 'x' }, '{"code":"x"}'],
    ])('normalizes %s', (_label, thrown, expected) => {
        const sink = vi.fn();
        addSink(sink);
        reportError(thrown);
        expect(sink.mock.calls[0][0].message).toBe(expected);
    });

    it('handles null without throwing', () => {
        const sink = vi.fn();
        addSink(sink);
        expect(() => reportError(null)).not.toThrow();
        expect(sink).toHaveBeenCalledTimes(1);
    });

    it('dedupes identical errors so a repeating failure reports once', () => {
        const sink = vi.fn();
        addSink(sink);
        const err = new Error('same');
        for (let i = 0; i < 10; i += 1) reportError(err, { source: 'loop' });
        expect(sink).toHaveBeenCalledTimes(1);
    });

    it('still reports distinct errors', () => {
        const sink = vi.fn();
        addSink(sink);
        reportError(new Error('one'));
        reportError(new Error('two'));
        expect(sink).toHaveBeenCalledTimes(2);
    });

    it('caps reports per session so a throwing render loop cannot flood', () => {
        const sink = vi.fn();
        addSink(sink);
        for (let i = 0; i < 200; i += 1) reportError(new Error(`distinct-${i}`));
        expect(sink.mock.calls.length).toBeLessThanOrEqual(25);
    });

    it('keeps working when a sink throws', () => {
        const bad = vi.fn(() => {
            throw new Error('sink exploded');
        });
        const good = vi.fn();
        addSink(bad);
        addSink(good);

        expect(() => reportError(new Error('x'))).not.toThrow();
        expect(good).toHaveBeenCalledTimes(1);
    });

    it('records nothing beyond message, stack, source, severity, route, at, context', () => {
        // Guards constitution §III.2 data minimization: no email/displayName/photoURL
        // should ever ride along in a report.
        const sink = vi.fn();
        addSink(sink);
        reportError(new Error('x'));
        expect(Object.keys(sink.mock.calls[0][0]).sort()).toEqual(
            ['at', 'context', 'message', 'route', 'severity', 'source', 'stack'].sort(),
        );
    });
});

describe('installGlobalHandlers', () => {
    it('registers error and unhandledrejection listeners', () => {
        installGlobalHandlers();
        expect(win._listenerTypes().sort()).toEqual(['error', 'unhandledrejection']);
    });

    it('is idempotent', () => {
        installGlobalHandlers();
        installGlobalHandlers();
        expect(win.addEventListener).toHaveBeenCalledTimes(2);
    });

    it('reports uncaught errors with source location', () => {
        const sink = vi.fn();
        addSink(sink);
        installGlobalHandlers();

        win._fire('error', {
            error: new Error('uncaught'),
            filename: 'main.js',
            lineno: 42,
            colno: 7,
        });

        const report = sink.mock.calls[0][0];
        expect(report.source).toBe('window.onerror');
        expect(report.context).toEqual({ file: 'main.js', line: 42, col: 7 });
    });

    it('ignores resource-load error events that carry no error or message', () => {
        const sink = vi.fn();
        addSink(sink);
        installGlobalHandlers();

        win._fire('error', { error: null, message: '' });

        expect(sink).not.toHaveBeenCalled();
    });

    it('reports unhandled promise rejections', () => {
        const sink = vi.fn();
        addSink(sink);
        installGlobalHandlers();

        win._fire('unhandledrejection', { reason: new Error('rejected') });

        expect(sink.mock.calls[0][0].source).toBe('unhandledrejection');
        expect(sink.mock.calls[0][0].message).toBe('rejected');
    });
});
