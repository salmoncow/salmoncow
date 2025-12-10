/**
 * LoadingSpinner Web Component
 *
 * Reusable loading indicator that can be used throughout the application.
 *
 * Usage:
 *   <loading-spinner message="Loading..."></loading-spinner>
 *   <loading-spinner size="large"></loading-spinner>
 *
 * Attributes:
 *   - message: Optional loading message (default: "Loading...")
 *   - size: "small" | "medium" | "large" (default: "medium")
 *
 * Architecture Note:
 *   This is the project's first Web Component, following the architectural
 *   evolution strategy (Phase 1: Vanilla Web Components).
 *   See: .prompts/meta/architectural-evolution-strategy.md
 */
export class LoadingSpinner extends HTMLElement {
    static get observedAttributes() {
        return ['message', 'size'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const message = this.getAttribute('message') || 'Loading...';
        const size = this.getAttribute('size') || 'medium';

        // Size variants
        const sizeMap = {
            small: { spinner: '24', fontSize: '0.875rem' },
            medium: { spinner: '40', fontSize: '1rem' },
            large: { spinner: '56', fontSize: '1.125rem' }
        };

        const dimensions = sizeMap[size] || sizeMap.medium;

        this.innerHTML = `
            <div class="loading-spinner-container" data-size="${size}">
                <svg
                    class="loading-spinner-svg"
                    width="${dimensions.spinner}"
                    height="${dimensions.spinner}"
                    viewBox="0 0 50 50"
                    aria-label="Loading"
                >
                    <circle
                        class="loading-spinner-track"
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="#e5e7eb"
                        stroke-width="4"
                    />
                    <circle
                        class="loading-spinner-path"
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="#3b82f6"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-dasharray="31.4 31.4"
                        transform="rotate(-90 25 25)"
                    />
                </svg>
                <div class="loading-spinner-message" style="font-size: ${dimensions.fontSize}">
                    ${message}
                </div>
            </div>
        `;

        // Add animation
        this.addStyles();
    }

    addStyles() {
        // Check if styles already added to document
        if (document.getElementById('loading-spinner-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'loading-spinner-styles';
        style.textContent = `
            .loading-spinner-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                padding: 2rem;
            }

            .loading-spinner-svg {
                animation: loading-spinner-rotate 1.4s linear infinite;
            }

            .loading-spinner-path {
                animation: loading-spinner-dash 1.4s ease-in-out infinite;
                stroke-linecap: round;
            }

            .loading-spinner-message {
                color: #6b7280;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                text-align: center;
            }

            @keyframes loading-spinner-rotate {
                100% {
                    transform: rotate(360deg);
                }
            }

            @keyframes loading-spinner-dash {
                0% {
                    stroke-dasharray: 1, 150;
                    stroke-dashoffset: 0;
                }
                50% {
                    stroke-dasharray: 90, 150;
                    stroke-dashoffset: -35;
                }
                100% {
                    stroke-dasharray: 90, 150;
                    stroke-dashoffset: -124;
                }
            }

            /* Full-page loading overlay variant */
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .loading-overlay .loading-spinner-container {
                padding: 3rem;
            }
        `;

        document.head.appendChild(style);
    }
}

// Register the custom element
customElements.define('loading-spinner', LoadingSpinner);
