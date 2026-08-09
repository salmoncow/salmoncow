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
import { escapeHtml } from '../utils/escape-html.js';
import './LoadingSpinner.css';

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
            large: { spinner: '56', fontSize: '1.125rem' },
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
                        stroke="currentColor"
                        stroke-opacity="0.15"
                        stroke-width="4"
                    />
                    <circle
                        class="loading-spinner-path"
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="var(--brand-primary, #D66E4F)"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-dasharray="31.4 31.4"
                        transform="rotate(-90 25 25)"
                    />
                </svg>
                <div class="loading-spinner-message" style="font-size: ${dimensions.fontSize}">
                    ${escapeHtml(message)}
                </div>
            </div>
        `;
    }
}

// Register the custom element
customElements.define('loading-spinner', LoadingSpinner);
