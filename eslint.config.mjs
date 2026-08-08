import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * ESLint flat config.
 *
 * Before this, the project had no static analysis of any kind on ~4,600 lines
 * of browser JavaScript — no linter, no formatter, nothing enforcing the
 * conventions the code already followed by hand.
 *
 * Three environments, because they genuinely differ:
 *   - src/                       browser globals, ES modules, no Node
 *   - functions/, scripts/, tests/  Node globals, TypeScript
 *   - *.config.*                 Node globals
 *
 * `eslint-config-prettier` is applied last so ESLint never argues with
 * Prettier about formatting. ESLint is here for correctness; Prettier owns
 * style.
 */
export default [
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'functions/lib/**',
            'functions/node_modules/**',
            '.emulator-data/**',
        ],
    },

    js.configs.recommended,

    // Browser application code.
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: globals.browser,
        },
        rules: {
            'no-unused-vars': [
                'error',
                {
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                    // Catch bindings are deliberately unused in several places
                    // where the failure itself is the signal (see the error
                    // reporter and the escape-html URL parser).
                    caughtErrors: 'none',
                },
            ],
            // console is the error reporter's fallback sink, and the only
            // observability that works before Firebase initializes.
            'no-console': 'off',
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-var': 'error',
            'prefer-const': 'error',
        },
    },

    // The abstract repository declares an interface: every method throws, so
    // its parameters exist to document the contract, not to be read. Renaming
    // them to _uid / _profile would make the contract harder to read for no
    // benefit.
    {
        files: ['src/repositories/user-profile-repository.js'],
        rules: {
            'no-unused-vars': ['error', { args: 'none' }],
        },
    },

    // TypeScript: Cloud Functions, scripts, and emulator-backed tests.
    // Parsed by typescript-eslint; type correctness itself is owned by tsc.
    ...tseslint.configs.recommended.map((cfg) => ({
        ...cfg,
        files: ['functions/**/*.ts', 'scripts/**/*.ts', 'tests/**/*.ts'],
    })),
    {
        files: ['functions/**/*.ts', 'scripts/**/*.ts', 'tests/**/*.ts'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', caughtErrors: 'none' },
            ],
            'no-console': 'off',
            eqeqeq: ['error', 'always', { null: 'ignore' }],
        },
    },

    // JS tests run in the plain-node vitest environment.
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node, ...globals.browser },
        },
        rules: {
            'no-console': 'off',
        },
    },

    // Build/config files at the repo root.
    {
        files: ['*.config.js', '*.config.mjs', '*.config.ts'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: globals.node,
        },
    },

    prettier,
];
