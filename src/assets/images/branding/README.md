# Branding Assets

This directory contains official brand assets for Salmoncow.

## Logo Files

### logo.svg
- **Purpose**: Primary application logo
- **Used by**: NavigationModule (main navigation bar)
- **Format**: SVG (scalable vector)
- **File Size**: 340KB
- **Dimensions**: Scalable vector graphic
- **Brand Colors**:
  - Primary (Salmon): #D66E4F
  - Secondary (Navy): #0F2536
  - Accent (Gray): #B7BCBC
  - Light (Cream): #F9FAF8

## Usage Guidelines

1. **Import via path**: Reference as `/assets/images/branding/logo.svg`
2. **Do not modify**: Logo should not be altered except for sizing
3. **Maintain aspect ratio**: Always preserve original proportions
4. **Accessibility**: Include appropriate alt text ("Salmoncow Logo")

## Color Palette

These colors are extracted from the logo and used for application theming:

### Primary: #D66E4F (Salmon)
- Main brand color
- Used for: Navigation background, primary buttons, brand accents
- RGB: 214, 110, 79
- Perfect complement to the "Salmoncow" name - warm, inviting coral/salmon tone

### Secondary: #0F2536 (Dark Navy)
- Supporting brand color
- Used for: Text, hover states, depth, contrast
- RGB: 15, 37, 54

### Accent: #B7BCBC (Gray)
- Neutral accent color
- Used for: Borders, secondary text, subtle elements
- RGB: 183, 188, 188

### Light: #F9FAF8 (Cream)
- Light background color
- Used for: Subtle backgrounds, highlights, warmth
- RGB: 249, 250, 248

## Updating Colors

When the logo changes, update the CSS custom properties in `/src/assets/styles/navigation.css`:

```css
:root {
    --brand-primary: #407273;
    --brand-secondary: #284351;
    --brand-accent: #F8F2D5;
    --brand-dark: #17374A;
}
```

## Notes

- The logo file is quite detailed (181KB). Consider optimizing with SVGO if load times become an issue.
- The color palette provides a professional, calming teal-blue theme that aligns with aquatic/pastoral branding.
