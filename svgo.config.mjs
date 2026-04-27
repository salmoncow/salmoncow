// Conservative SVGO config — tuned for `src/assets/images/branding/logo.svg`.
//
// Authoritative source artwork lives at `*.source.svg` siblings. We optimize
// into the un-suffixed `*.svg` files (which the app references). Re-run with
// `npm run optimize:logo` whenever a `*.source.svg` is updated.
//
// Choices, recorded so future-you knows what's safe to flip:
// - floatPrecision: 3 — sub-millimeter precision on a meter-wide print, lossless
//   for any web/display rendering. Lower (1–2) saves more bytes; higher (4+)
//   buys nothing visible.
// - mergePaths: false — keep individual <path> elements addressable for editing
//   in vector tools and color-picking.
// - convertColors: false — preserve the original color formats so brand-color
//   spot-checks against `src/assets/images/branding/README.md` stay textual.
export default {
    multipass: true,
    floatPrecision: 3,
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    mergePaths: false,
                    convertColors: false,
                },
            },
        },
    ],
};
