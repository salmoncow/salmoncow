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
 *   See: .prompts/core/development/asset-reusability.md
 */
export class UserAvatar extends HTMLElement {
    static get observedAttributes() {
        return ['photo', 'alt', 'size'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
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

        this.innerHTML = `
            <img
                class="user-avatar"
                src="${photo}"
                alt="${alt}"
                width="${dimension}"
                height="${dimension}"
                data-size="${size}"
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
        return '/assets/images/placeholders/default-avatar.svg';
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
                background-color: #f3f4f6;
                border: 1px solid #e5e7eb;
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
