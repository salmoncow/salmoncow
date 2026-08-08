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
        coverage: {
            provider: 'v8',
            all: true,
            include: ['src/**/*.ts'],
            exclude: [
                // Barrel file: re-exports only, nothing to execute.
                'src/index.ts',
            ],
            reporter: ['text-summary', 'text', 'html', 'json-summary'],
            reportsDirectory: './coverage',
            // No thresholds yet — see the note in the root unit config.
        },
    },
});
