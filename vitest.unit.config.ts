import { defineConfig } from 'vitest/config';

// Unit-test config for pure-JS modules (no emulator, no jsdom).
// Kept separate from vitest.config.ts (rules suite) so the two lanes
// stay independent and rules tests don't pick up unit files.
export default defineConfig({
    test: {
        include: ['tests/unit/**/*.test.js'],
        environment: 'node',
        testTimeout: 5_000,
    },
});
