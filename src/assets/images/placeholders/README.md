# Placeholder Images

This directory contains fallback images used throughout the application when primary assets fail to load or are unavailable.

## Available Placeholders

### default-avatar.svg
- **Purpose**: Fallback for user profile pictures when Google profile photo is unavailable or fails to load
- **Used by**: UIModule (src/js/modules/ui.js)
- **Dimensions**: 24x24 viewBox, scales to any size
- **Colors**: Neutral gray (#f3f4f6, #9ca3af, #6b7280)
- **Use cases**:
  - User has no Google profile photo
  - Profile photo URL returns 404/429 error
  - Network failure loading remote image
  - User profile lists, comment sections, author cards

## Usage Guidelines

1. **Reference via path**: Use `/assets/images/placeholders/default-avatar.svg` (copied during build)
2. **Do not embed**: Never copy this SVG into component code
3. **Maintain consistency**: Use this placeholder for all user avatar fallbacks
4. **Update documentation**: Document new usage locations above

## Build Process

Assets in `src/assets/` are copied to `public/assets/` during the build process by the `build:assets` npm script.

## Modifying Placeholders

When updating placeholder assets:
1. Maintain semantic meaning (don't change purpose)
2. Keep neutral colors for broad applicability
3. Ensure accessibility (sufficient contrast ratios)
4. Test across all usage locations
5. Update this README with changes

## Future Placeholders

Consider adding:
- `default-thumbnail.svg` - For article/video thumbnails
- `image-not-found.svg` - Generic image error state
- `video-not-found.svg` - Video error state
