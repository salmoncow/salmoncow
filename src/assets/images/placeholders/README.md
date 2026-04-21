# Placeholder Images

Fallback images used throughout the application when primary assets fail to load or are unavailable.

## Available Placeholders

### `default-avatar.svg`
- **Purpose**: Fallback for user profile pictures when a Google profile photo is unavailable or fails to load.
- **Used by**: `src/components/UserAvatar.js` (imported, bundled by Vite).
- **Dimensions**: 24×24 viewBox, scales to any size.
- **Colors**: Neutral gray (#f3f4f6, #9ca3af, #6b7280).
- **Use cases**:
  - User has no Google profile photo
  - Profile photo URL returns 404/429 / network failure
  - User profile lists, comment sections, admin portal user table

## Usage Guidelines

1. **Reference via `import`**, not a string literal. Example:
   ```js
   import defaultAvatarUrl from '../assets/images/placeholders/default-avatar.svg';
   ```
   Vite processes the import — small SVGs (<4 KB) are inlined as data URIs; larger ones are emitted to `dist/assets/` with a content hash.

   ❌ **Do not** reference via string path (e.g. `/assets/images/placeholders/default-avatar.svg`). Such paths bypass Vite's asset pipeline and, in production, are caught by the SPA rewrite (`**` → `/index.html`) and served as HTML — the image silently fails.

2. **Single source**: only reference the placeholder from one web-component implementation (currently `UserAvatar`). Other modules should set the `photo` attribute on `<user-avatar>` and let the component handle the fallback internally.

3. **Keep SVGs small** so Vite can inline them. Anything over ~4 KB becomes a separate network request.

## Modifying Placeholders

When updating placeholder assets:
1. Maintain semantic meaning (don't change purpose)
2. Keep neutral colors for broad applicability
3. Ensure accessibility (sufficient contrast)
4. Test: run `npm run build` and verify `dist/assets/js/index-*.js` contains the SVG as a data URI (inlined) or `dist/assets/*.svg` (emitted)
5. Update this README

## Future Placeholders

Consider adding:
- `default-thumbnail.svg` — for article/video thumbnails
- `image-not-found.svg` — generic image error state
- `video-not-found.svg` — video error state
