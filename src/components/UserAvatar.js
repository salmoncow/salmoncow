/**
 * UserAvatar Web Component
 *
 * Reusable user avatar component with automatic fallback to default avatar.
 * Handles image loading errors gracefully.
 *
 * Usage:
 *   <user-avatar photo="https://example.com/photo.jpg" alt="John Doe"></user-avatar>
 *   <user-avatar photo="${user.photoURL}" alt="${user.displayName}" size="large"></user-avatar>
 *
 * Attributes:
 *   - photo: Image URL (falls back to default avatar if missing or fails to load)
 *   - alt: Alt text for accessibility (default: "User Avatar")
 *   - size: "small" | "medium" | "large" | "xlarge" (default: "medium")
 *
 * Architecture Note:
 *   Part of Phase 1 Web Components architecture.
 *   Follows asset reusability principles - single source for avatar fallback.
 */

// Imported (not referenced by string) so Vite includes it in the build
// output. A string-literal path would be caught by the SPA rewrite and
// served as index.html, breaking the fallback.
import defaultAvatarUrl from '../assets/images/placeholders/default-avatar.svg';

export class UserAvatar extends HTMLElement {
    static get observedAttributes() {
        return ['photo', 'alt', 'size'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Avoid unnecessary re-renders when a parent re-applies the same
        // attributes (common when auth state fires multiple times). Each
        // re-render destroys + recreates the <img>, forcing a fresh fetch
        // and a brief flash of alt text.
        if (oldValue === newValue) return;
        this.render();
    }

    render() {
        const photo = this.getAttribute('photo') || this.getDefaultAvatar();
        const alt = this.getAttribute('alt') || 'User Avatar';
        const size = this.getAttribute('size') || 'medium';

        // Size variants (matches design system)
        const sizeMap = {
            small: '24',
            medium: '32',
            large: '48',
            xlarge: '64'
        };

        const dimension = sizeMap[size] || sizeMap.medium;

        // referrerpolicy=no-referrer helps Google's profile-photo CDN serve
        // a cacheable response; sending a Referer header can trigger stricter
        // caching behavior and intermittent failures.
        this.innerHTML = `
            <img
                class="user-avatar"
                src="${photo}"
                alt="${alt}"
                width="${dimension}"
                height="${dimension}"
                data-size="${size}"
                referrerpolicy="no-referrer"
                loading="eager"
                decoding="async"
            />
        `;

        // Add error handler for fallback
        const img = this.querySelector('img');
        img.addEventListener('error', () => {
            if (img.src !== this.getDefaultAvatar()) {
                img.src = this.getDefaultAvatar();
            }
        });

        this.addStyles();
    }

    getDefaultAvatar() {
        return defaultAvatarUrl;
    }

    addStyles() {
        // Check if styles already added to document
        if (document.getElementById('user-avatar-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'user-avatar-styles';
        style.textContent = `
            .user-avatar {
                border-radius: 50%;
                object-fit: cover;
                display: inline-block;
                background-color: var(--surface-muted);
                border: 1px solid var(--surface-border);
            }

            .user-avatar[data-size="small"] {
                width: 24px;
                height: 24px;
            }

            .user-avatar[data-size="medium"] {
                width: 32px;
                height: 32px;
            }

            .user-avatar[data-size="large"] {
                width: 48px;
                height: 48px;
            }

            .user-avatar[data-size="xlarge"] {
                width: 64px;
                height: 64px;
            }
        `;

        document.head.appendChild(style);
    }
}

// Register the custom element
customElements.define('user-avatar', UserAvatar);
