import './ToastContainer.css';
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
    }

    /**
     * Show a toast notification
     * @param {string} type - Type of toast: success, error, warning, info, loading
     * @param {string} message - Message to display
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     * @returns {import('./StatusBadge.js').StatusBadge} The created toast element
     */
    show(type, message, duration = 3000) {
        const toast = /** @type {import('./StatusBadge.js').StatusBadge} */ (
            document.createElement('status-badge')
        );
        toast.setAttribute('type', type);
        toast.setAttribute('message', message);
        toast.setAttribute('dismissible', 'true');
        toast.classList.add('toast-item');

        this.appendChild(toast);

        // Auto-dismiss after duration (if not 0)
        if (duration > 0) {
            setTimeout(() => {
                if (toast.isConnected) {
                    /** @type {import('./StatusBadge.js').StatusBadge} */ (toast).dismiss();
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
}

// Register the custom element
customElements.define('toast-container', ToastContainer);
