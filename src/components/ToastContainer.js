/**
 * ToastContainer Web Component
 *
 * Fixed-position container for toast notifications that doesn't affect page layout.
 * Manages a stack of StatusBadge components with animations.
 *
 * Usage:
 *   <toast-container id="toastContainer"></toast-container>
 *
 *   // In JavaScript:
 *   const container = document.getElementById('toastContainer');
 *   container.show('success', 'Changes saved!');
 *   container.show('error', 'Failed to save', 5000);
 *   container.show('loading', 'Processing...', 0); // No auto-dismiss
 *
 * Methods:
 *   - show(type, message, duration) - Display a toast notification
 *     - type: "success" | "error" | "warning" | "info" | "loading"
 *     - message: Text to display
 *     - duration: Auto-dismiss time in ms (0 = manual dismiss only)
 *     - Returns: The created toast element (for programmatic dismiss)
 *
 * Position: Fixed bottom-right corner (industry standard)
 */
export class ToastContainer extends HTMLElement {
    connectedCallback() {
        this.setAttribute('role', 'region');
        this.setAttribute('aria-label', 'Notifications');
        this.setAttribute('aria-live', 'polite');
        this.addStyles();
    }

    /**
     * Show a toast notification
     * @param {string} type - Type of toast: success, error, warning, info, loading
     * @param {string} message - Message to display
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     * @returns {HTMLElement} The created toast element
     */
    show(type, message, duration = 3000) {
        const toast = document.createElement('status-badge');
        toast.setAttribute('type', type);
        toast.setAttribute('message', message);
        toast.setAttribute('dismissible', 'true');
        toast.classList.add('toast-item');

        this.appendChild(toast);

        // Auto-dismiss after duration (if not 0)
        if (duration > 0) {
            setTimeout(() => {
                if (toast.isConnected) {
                    toast.dismiss();
                }
            }, duration);
        }

        // Clean up on dismiss
        toast.addEventListener('dismiss', () => {
            if (toast.isConnected) {
                toast.remove();
            }
        });

        return toast;
    }

    addStyles() {
        // Check if styles already added to document
        if (document.getElementById('toast-container-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'toast-container-styles';
        style.textContent = `
            toast-container {
                position: fixed;
                bottom: 1.5rem;
                right: 1.5rem;
                z-index: 9999;
                display: flex;
                flex-direction: column-reverse;
                gap: 0.75rem;
                max-width: 400px;
                pointer-events: none;
            }

            toast-container > * {
                pointer-events: auto;
                animation: toast-slide-in 0.3s ease-out;
            }

            @keyframes toast-slide-in {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            /* Mobile responsiveness */
            @media (max-width: 480px) {
                toast-container {
                    left: 1rem;
                    right: 1rem;
                    max-width: none;
                }

                @keyframes toast-slide-in {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Register the custom element
customElements.define('toast-container', ToastContainer);
