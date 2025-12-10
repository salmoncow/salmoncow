/**
 * StatusBadge Web Component
 *
 * Reusable status message component for displaying feedback to users.
 * Supports different types (success, error, warning, info, loading) with
 * appropriate styling and icons.
 *
 * Usage:
 *   <status-badge type="success" message="Changes saved!"></status-badge>
 *   <status-badge type="error" message="Failed to save"></status-badge>
 *   <status-badge type="loading" message="Saving..."></status-badge>
 *
 * Attributes:
 *   - type: "success" | "error" | "warning" | "info" | "loading" (default: "info")
 *   - message: Status message text (required)
 *   - dismissible: "true" | "false" - Show close button (default: "false")
 *
 * Methods:
 *   - dismiss() - Programmatically dismiss the badge
 *
 * Events:
 *   - dismiss - Fired when badge is dismissed
 *
 * Architecture Note:
 *   Part of Phase 1 Web Components architecture.
 *   Can replace UIModule.showStatus() for better reusability.
 */
export class StatusBadge extends HTMLElement {
    static get observedAttributes() {
        return ['type', 'message', 'dismissible'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const type = this.getAttribute('type') || 'info';
        const message = this.getAttribute('message') || '';
        const dismissible = this.getAttribute('dismissible') === 'true';

        const icon = this.getIcon(type);
        const typeClass = `status-badge-${type}`;

        this.innerHTML = `
            <div class="status-badge ${typeClass}" role="alert">
                <div class="status-badge-icon">${icon}</div>
                <div class="status-badge-message">${message}</div>
                ${dismissible ? '<button class="status-badge-close" aria-label="Dismiss">&times;</button>' : ''}
            </div>
        `;

        // Add dismiss handler
        if (dismissible) {
            const closeBtn = this.querySelector('.status-badge-close');
            closeBtn.addEventListener('click', () => this.dismiss());
        }

        this.addStyles();
    }

    getIcon(type) {
        const icons = {
            success: `
                <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
            `,
            error: `
                <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
            `,
            warning: `
                <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
            `,
            info: `
                <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
            `,
            loading: `
                <svg viewBox="0 0 20 20" fill="currentColor" class="status-spinner">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.25"/>
                    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M10 2a8 8 0 018 8"/>
                </svg>
            `
        };

        return icons[type] || icons.info;
    }

    dismiss() {
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('dismiss', {
            bubbles: true,
            composed: true
        }));

        // Fade out and remove
        this.style.opacity = '0';
        this.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            this.remove();
        }, 300);
    }

    addStyles() {
        // Check if styles already added to document
        if (document.getElementById('status-badge-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'status-badge-styles';
        style.textContent = `
            .status-badge {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 0.875rem;
                line-height: 1.25rem;
                border: 1px solid;
                transition: opacity 0.3s ease;
            }

            .status-badge-icon {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .status-badge-icon svg {
                width: 100%;
                height: 100%;
            }

            .status-badge-message {
                flex: 1;
            }

            .status-badge-close {
                flex-shrink: 0;
                background: none;
                border: none;
                font-size: 1.5rem;
                line-height: 1;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s;
                padding: 0;
                width: 24px;
                height: 24px;
            }

            .status-badge-close:hover {
                opacity: 1;
            }

            /* Type variants */
            .status-badge-success {
                background-color: #f0fdf4;
                border-color: #86efac;
                color: #166534;
            }

            .status-badge-error {
                background-color: #fef2f2;
                border-color: #fca5a5;
                color: #991b1b;
            }

            .status-badge-warning {
                background-color: #fffbeb;
                border-color: #fcd34d;
                color: #92400e;
            }

            .status-badge-info {
                background-color: #eff6ff;
                border-color: #93c5fd;
                color: #1e40af;
            }

            .status-badge-loading {
                background-color: #f8fafc;
                border-color: #cbd5e1;
                color: #475569;
            }

            /* Loading spinner animation */
            .status-spinner {
                animation: status-spinner-rotate 1s linear infinite;
            }

            @keyframes status-spinner-rotate {
                100% {
                    transform: rotate(360deg);
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Register the custom element
customElements.define('status-badge', StatusBadge);
