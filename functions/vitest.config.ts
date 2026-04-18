import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        testTimeout: 20_000,
        hookTimeout: 30_000,
        pool: 'forks',
        poolOptions: {
            forks: {
                // Force serial execution so tests don't race on the same
                // emulator-backed Firestore state.
                singleFork: true,
            },
        },
    },
});
