import { defineConfig } from 'vitest/config';

// Vitest config for root-level tests (currently: rules tests).
// Function tests run out of functions/ via its own vitest config.
export default defineConfig({
    test: {
        include: ['tests/rules/**/*.test.ts'],
        testTimeout: 15_000, // emulator round-trips can be slow on cold start
        hookTimeout: 30_000,
        pool: 'forks',       // rules-unit-testing spawns its own fetch; isolate per-file
    },
});
