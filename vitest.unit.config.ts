import { defineConfig } from 'vitest/config';

// Unit-test config for pure-JS modules (no emulator, no jsdom).
// Kept separate from vitest.config.ts (rules suite) so the two lanes
// stay independent and rules tests don't pick up unit files.
export default defineConfig({
    test: {
        include: ['tests/unit/**/*.test.js'],
        environment: 'node',
        testTimeout: 5_000,
        coverage: {
            provider: 'v8',
            // Report on all of src/, not just files a test happens to import.
            // Without this the number flatters itself: untested modules are
            // simply absent instead of counted as 0%.
            all: true,
            include: ['src/**/*.js'],
            exclude: [
                // Type-only and generated surfaces have nothing to execute.
                'src/**/*.d.ts',
                'src/types/**',
                // main.js is bootstrap wiring exercised in a browser, not by
                // the node unit lane; counting it only adds noise.
                'src/main.js',
            ],
            reporter: ['text-summary', 'text', 'html', 'json-summary'],
            reportsDirectory: './coverage/unit',
            // Deliberately no thresholds yet. The constitution asks for ≥80%
            // overall and 100% on auth paths, but src/ is nowhere near that;
            // failing the build on day one would just mean disabling it.
            // Measure first, then ratchet.
        },
    },
});
