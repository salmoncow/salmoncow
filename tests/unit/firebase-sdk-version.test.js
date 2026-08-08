import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The Firebase SDK version exists in three places that must agree:
 *
 *   1. `src/infrastructure/firebase-sdk.js` — the CDN URLs the browser loads.
 *   2. `src/types/firebase-cdn.d.ts`        — the URLs TypeScript maps to types.
 *   3. `package.json` devDependency         — the package supplying those types.
 *
 * A mismatch is silent and nasty in different ways depending on which pair
 * drifts: (1)≠(2) resurfaces as unresolved modules; (2)≠(3) means type-checking
 * against a different SDK than actually ships, so the checker confidently
 * validates against an API the browser does not have.
 *
 * The version was previously hard-coded in seven feature files, where a partial
 * bump would have loaded two SDK versions side by side in one page.
 */

const repoRoot = new URL('../../', import.meta.url);
const read = (p) => readFileSync(fileURLToPath(new URL(p, repoRoot)), 'utf8');

const CDN_URL = /https:\/\/www\.gstatic\.com\/firebasejs\/([0-9]+\.[0-9]+\.[0-9]+)\//g;

function versionsIn(text) {
    return [...text.matchAll(CDN_URL)].map((m) => m[1]);
}

describe('Firebase SDK version consistency', () => {
    const sdkModule = read('src/infrastructure/firebase-sdk.js');
    const declarations = read('src/types/firebase-cdn.d.ts');
    const pkg = JSON.parse(read('package.json'));

    it('pins exactly one version in the SDK module', () => {
        const versions = new Set(versionsIn(sdkModule));
        expect(versions.size).toBe(1);
    });

    it('declares types for that same version', () => {
        const runtime = new Set(versionsIn(sdkModule));
        const declared = new Set(versionsIn(declarations));
        expect(declared).toEqual(runtime);
    });

    it('matches the firebase devDependency exactly', () => {
        // Exact pin, not a range: the types must describe the SDK that ships,
        // and a caret range could silently resolve to a different minor.
        const [runtime] = [...new Set(versionsIn(sdkModule))];
        expect(pkg.devDependencies.firebase).toBe(runtime);
    });

    it('declares a module for every CDN URL the SDK module imports', () => {
        const imported = [
            ...sdkModule.matchAll(/'(https:\/\/www\.gstatic\.com\/firebasejs\/[^']+)'/g),
        ].map((m) => m[1]);
        expect(imported.length).toBeGreaterThan(0);
        for (const url of new Set(imported)) {
            expect(declarations, `missing declare module for ${url}`).toContain(url);
        }
    });
});

describe('Firebase SDK imports stay centralized', () => {
    it('no file outside firebase-sdk.js imports the CDN directly', async () => {
        // Keeping every import behind one module is what makes a version bump a
        // single-file edit instead of a seven-file find-and-replace where
        // missing one file loads two SDK versions at once.
        const { globSync } = await import('node:fs');
        const dir = fileURLToPath(new URL('src', repoRoot));
        const files = globSync('**/*.js', { cwd: dir }).filter(
            (f) => f !== 'infrastructure/firebase-sdk.js',
        );

        const offenders = files.filter((f) =>
            readFileSync(`${dir}/${f}`, 'utf8').includes('gstatic.com/firebasejs'),
        );
        expect(offenders).toEqual([]);
    });
});
