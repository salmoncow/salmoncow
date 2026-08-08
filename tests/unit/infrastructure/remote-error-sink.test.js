/**
 * Unit tests for the remote error sink.
 *
 * The behaviours worth pinning are the failure modes, not the happy path: this
 * code runs while the app is already broken, so it must never recurse, never
 * throw, and never block.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const callableMock = vi.fn();

vi.mock('../../../src/infrastructure/functions.js', () => ({
    callable: (...args) => callableMock(...args),
}));

vi.mock('../../../src/infrastructure/emulator.js', () => ({
    isEmulatorMode: () => false,
}));

const { createRemoteErrorSink } = await import(
    '../../../src/infrastructure/remote-error-sink.js'
);

const baseReport = {
    message: 'boom',
    stack: 'Error: boom',
    source: 'window.onerror',
    severity: 'error',
    route: '#/profile',
    at: '2026-08-08T00:00:00.000Z',
    context: { file: 'main.js', line: 42 },
};

beforeEach(() => {
    callableMock.mockReset();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('createRemoteErrorSink', () => {
    it('sends a payload matching the server schema', () => {
        const send = vi.fn(() => Promise.resolve({ data: { received: true } }));
        callableMock.mockReturnValue(send);

        createRemoteErrorSink({})(baseReport);

        expect(send).toHaveBeenCalledTimes(1);
        const payload = send.mock.calls[0][0];
        expect(payload).toEqual({
            message: 'boom',
            stack: 'Error: boom',
            source: 'window.onerror',
            severity: 'error',
            route: '#/profile',
            at: '2026-08-08T00:00:00.000Z',
            context: { file: 'main.js', line: 42 },
        });
    });

    it('truncates oversized fields client-side so the report still lands', () => {
        const send = vi.fn(() => Promise.resolve({}));
        callableMock.mockReturnValue(send);

        createRemoteErrorSink({})({
            ...baseReport,
            message: 'x'.repeat(5000),
            stack: 'y'.repeat(9000),
        });

        const payload = send.mock.calls[0][0];
        expect(payload.message).toHaveLength(1000);
        expect(payload.stack).toHaveLength(4000);
    });

    it('stringifies non-primitive context values', () => {
        const send = vi.fn(() => Promise.resolve({}));
        callableMock.mockReturnValue(send);

        createRemoteErrorSink({})({ ...baseReport, context: { obj: { a: 1 } } });

        expect(typeof send.mock.calls[0][0].context.obj).toBe('string');
    });

    it('caps context keys', () => {
        const send = vi.fn(() => Promise.resolve({}));
        callableMock.mockReturnValue(send);

        const context = Object.fromEntries(
            Array.from({ length: 50 }, (_, i) => [`k${i}`, 'v']),
        );
        createRemoteErrorSink({})({ ...baseReport, context });

        expect(Object.keys(send.mock.calls[0][0].context).length).toBeLessThanOrEqual(20);
    });

    it('swallows a rejected send so it cannot feed back through unhandledrejection', async () => {
        // This is the recursion guard. An unhandled rejection here would be
        // caught by the reporter's own handler and reported again, forever.
        const send = vi.fn(() => Promise.reject(new Error('network down')));
        callableMock.mockReturnValue(send);

        const unhandled = vi.fn();
        process.on('unhandledRejection', unhandled);

        expect(() => createRemoteErrorSink({})(baseReport)).not.toThrow();
        await new Promise((r) => setTimeout(r, 20));

        process.off('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('swallows a synchronous throw from the callable', () => {
        callableMock.mockReturnValue(() => {
            throw new Error('sync boom');
        });
        expect(() => createRemoteErrorSink({})(baseReport)).not.toThrow();
    });

    it('returns a no-op sink when Functions is unavailable', () => {
        callableMock.mockImplementation(() => {
            throw new Error('functions unavailable');
        });
        const sink = createRemoteErrorSink({});
        expect(() => sink(baseReport)).not.toThrow();
    });

    it('does not block: the sink returns before the send settles', () => {
        let settle;
        callableMock.mockReturnValue(() => new Promise((r) => { settle = r; }));

        const before = Date.now();
        createRemoteErrorSink({})(baseReport);
        expect(Date.now() - before).toBeLessThan(50);
        settle?.({});
    });
});
