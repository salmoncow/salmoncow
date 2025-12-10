# Web Components

This directory contains reusable UI components built as native Web Components (Custom Elements).

**Architecture Strategy**: Phase 1 - Vanilla Web Components
See: [../../.prompts/meta/architectural-evolution-strategy.md](../../.prompts/meta/architectural-evolution-strategy.md)

---

## Why Web Components?

- **Zero dependencies**: Native browser API, no framework required
- **Reusable**: Single source of truth for UI elements
- **Encapsulated**: Styles and behavior contained within component
- **Framework-agnostic**: Works with vanilla JS, and can be used in React/Vue later
- **Migration-ready**: Easy path to Lit (95% AI-assisted) or React (80% AI-assisted)

---

## Available Components

### LoadingSpinner

**File**: `LoadingSpinner.js`
**Purpose**: Animated loading indicator with customizable message and size

**Usage**:
```html
<!-- Default (medium size) -->
<loading-spinner></loading-spinner>

<!-- With custom message -->
<loading-spinner message="Loading your data..."></loading-spinner>

<!-- Different sizes -->
<loading-spinner size="small"></loading-spinner>
<loading-spinner size="medium"></loading-spinner>
<loading-spinner size="large"></loading-spinner>

<!-- Full-page overlay (use with .loading-overlay class) -->
<div class="loading-overlay">
    <loading-spinner message="Loading..." size="large"></loading-spinner>
</div>
```

**Attributes**:
- `message` (optional): Loading text to display (default: "Loading...")
- `size` (optional): "small" | "medium" | "large" (default: "medium")

**Used In**:
- `src/index.html` - Auth initialization loading overlay

---

### UserAvatar

**File**: `UserAvatar.js`
**Purpose**: User profile picture with automatic fallback to default avatar

**Usage**:
```html
<!-- With user photo -->
<user-avatar photo="https://example.com/photo.jpg" alt="John Doe"></user-avatar>

<!-- Different sizes -->
<user-avatar photo="${user.photoURL}" alt="${user.displayName}" size="small"></user-avatar>
<user-avatar photo="${user.photoURL}" alt="${user.displayName}" size="medium"></user-avatar>
<user-avatar photo="${user.photoURL}" alt="${user.displayName}" size="large"></user-avatar>
<user-avatar photo="${user.photoURL}" alt="${user.displayName}" size="xlarge"></user-avatar>

<!-- Automatic fallback (if photo missing or fails) -->
<user-avatar alt="User"></user-avatar>
```

**Attributes**:
- `photo` (optional): Image URL (falls back to default avatar if missing or fails to load)
- `alt` (optional): Alt text for accessibility (default: "User Avatar")
- `size` (optional): "small" (24px) | "medium" (32px) | "large" (48px) | "xlarge" (64px) (default: "medium")

**Used In**:
- `src/modules/navigation.js` - Navigation bar and dropdown user profile
- (Add usage locations as component is reused)

---

### StatusBadge

**File**: `StatusBadge.js`
**Purpose**: Status message display with icons for user feedback (success, error, warning, info, loading)

**Usage**:
```html
<!-- Success message -->
<status-badge type="success" message="Changes saved!"></status-badge>

<!-- Error message -->
<status-badge type="error" message="Failed to save changes"></status-badge>

<!-- Warning message -->
<status-badge type="warning" message="This action cannot be undone"></status-badge>

<!-- Info message -->
<status-badge type="info" message="New update available"></status-badge>

<!-- Loading message -->
<status-badge type="loading" message="Saving changes..."></status-badge>

<!-- Dismissible badge (with close button) -->
<status-badge type="success" message="Saved!" dismissible="true"></status-badge>
```

**Attributes**:
- `type` (optional): "success" | "error" | "warning" | "info" | "loading" (default: "info")
- `message` (required): Status message text
- `dismissible` (optional): "true" | "false" - Show close button (default: "false")

**Methods**:
- `dismiss()` - Programmatically dismiss the badge

**Events**:
- `dismiss` - Fired when badge is dismissed (bubbles, composed)

**Used In**:
- `src/main.js` - Sign-in and sign-out status feedback
- (Add usage locations as component is reused)

---

## Component Patterns

### Creating New Components

Follow this pattern when creating new Web Components:

```javascript
/**
 * ComponentName Web Component
 *
 * Brief description of what this component does.
 *
 * Usage:
 *   <component-name attribute="value"></component-name>
 *
 * Attributes:
 *   - attribute1: Description
 *   - attribute2: Description
 */
export class ComponentName extends HTMLElement {
    static get observedAttributes() {
        return ['attribute1', 'attribute2'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const attr1 = this.getAttribute('attribute1') || 'default';
        const attr2 = this.getAttribute('attribute2') || 'default';

        this.innerHTML = `
            <div class="component-container">
                <!-- Component markup -->
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        // Add styles only once to document head
        if (document.getElementById('component-name-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'component-name-styles';
        style.textContent = `
            /* Component styles */
        `;

        document.head.appendChild(style);
    }
}

// Register the custom element
customElements.define('component-name', ComponentName);
```

### Naming Conventions

- **Class name**: PascalCase (e.g., `LoadingSpinner`)
- **File name**: PascalCase (e.g., `LoadingSpinner.js`)
- **Element tag**: kebab-case (e.g., `<loading-spinner>`)
- **CSS classes**: kebab-case with component prefix (e.g., `.loading-spinner-container`)

### Best Practices

1. **Single Responsibility**: Each component does one thing well
2. **Attributes for Configuration**: Use HTML attributes for component props
3. **Style Encapsulation**: Add styles to document head (check for duplicates)
4. **Fallback Values**: Always provide defaults for optional attributes
5. **Accessibility**: Include ARIA labels where appropriate
6. **Documentation**: Document usage, attributes, and where component is used

---

## Importing Components

### In JavaScript Modules

```javascript
// Import to register the component
import './components/LoadingSpinner.js';

// Now you can use it
const spinner = document.createElement('loading-spinner');
spinner.setAttribute('message', 'Please wait...');
document.body.appendChild(spinner);
```

### In HTML

```html
<!-- Import in script module -->
<script type="module" src="/main.js"></script>

<!-- Use anywhere after import -->
<loading-spinner message="Loading..."></loading-spinner>
```

---

## Component Lifecycle

### Browser Lifecycle Hooks

```javascript
class MyComponent extends HTMLElement {
    // Called when attributes change
    static get observedAttributes() {
        return ['attr1', 'attr2'];
    }

    // Called when element is added to DOM
    connectedCallback() {
        this.render();
    }

    // Called when element is removed from DOM
    disconnectedCallback() {
        // Cleanup: remove event listeners, timers, etc.
    }

    // Called when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    // Called when element is moved in DOM
    adoptedCallback() {
        // Rarely needed
    }
}
```

---

## Future Evolution

### Phase 2: Migration to Lit (When Triggers Met)

When we have 10+ components or need better DX, migrating to Lit will be straightforward:

**Before (Vanilla)**:
```javascript
export class LoadingSpinner extends HTMLElement {
    static get observedAttributes() {
        return ['message', 'size'];
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const message = this.getAttribute('message') || 'Loading...';
        this.innerHTML = `<div>${message}</div>`;
    }
}
```

**After (Lit)**:
```javascript
import { LitElement, html } from 'lit';

export class LoadingSpinner extends LitElement {
    static properties = {
        message: { type: String },
        size: { type: String }
    };

    render() {
        return html`<div>${this.message || 'Loading...'}</div>`;
    }
}
```

**Migration Quality**: 95% AI-assisted (mechanical transformation)
**HTML Usage**: Unchanged (`<loading-spinner>` still works)

---

## Component Count Tracking

Track component count to evaluate architectural evolution triggers:

**Current Count**: 3 components
- LoadingSpinner
- UserAvatar
- StatusBadge

**Phase 2 Trigger**: 10+ components (30% progress: 3/10)
**Next Review**: See [../../.prompts/meta/architectural-decision-log.md](../../.prompts/meta/architectural-decision-log.md)

**When to Migrate to Lit** (Phase 2):
- Need 7 more components (10 total) OR
- Manual reactivity becomes painful OR
- Verbose syntax slows development

**Current Assessment**: Stay Phase 1 (Vanilla Web Components)
- Component count: 3/10 ✅
- No pain points yet ✅
- DX acceptable ✅

---

## Adding New Components

When adding a new component:

1. Create `ComponentName.js` in this directory
2. Follow the component pattern above
3. Import in `main.js` or relevant module
4. Document usage in this README
5. Update component count above
6. Check if Phase 2 triggers met (10+ components)
