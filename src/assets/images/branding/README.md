# Branding Assets

## logo.svg

Primary application logo used in the navigation bar and homepage hero.

**Path**: `/assets/images/branding/logo.svg`

### Source vs. deployed

- `logo.source.svg` — authoritative artwork. The only original, full-precision copy. Edit or replace this file.
- `logo.svg` — SVGO-optimized output of `logo.source.svg`. This is what the app references and what ships to users. Do **not** hand-edit.

After updating `logo.source.svg`, regenerate the optimized version:

```bash
npm run optimize:logo
```

Optimization settings live in `svgo.config.mjs` at the repo root and are tuned to be lossless for any rendering use (web, print, future re-export). See the comments in that file for which knobs are safe to tune.

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | #D66E4F | Navigation background, buttons |
| Secondary | #0F2536 | Text, hover states |
| Accent | #B7BCBC | Borders, secondary text |
| Light | #F9FAF8 | Backgrounds |

CSS variables are defined in `/src/assets/styles/navigation.css`.
