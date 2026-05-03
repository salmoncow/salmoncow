/**
 * AdminPortalModule - Controller for the Admin Portal.
 *
 * Wires the <admin-portal> web component to the AdminUserService and the
 * role observable. Handles:
 *   - Initial load when the portal is first shown (route match)
 *   - Pagination via Load More
 *   - Role-change requests (owner only) with optimistic UI update
 *   - Role-observable subscription so the component re-renders when the
 *     current user's own role changes (e.g. owner gets demoted)
 *
 * Spec §XI.3, §XI.7 Group 7; AC-3, AC-4, AC-9, AC-15
 */

export class AdminPortalModule {
    /**
     * @param {object} deps
     * @param {import('../services/admin-user-service.js').AdminUserService} deps.adminService
     * @param {import('./role.js').RoleModule} deps.role
     * @param {{ show: Function }} [deps.toast] - optional toast API: show(type, message, duration)
     */
    constructor({ adminService, role, toast = null }) {
        if (!adminService) throw new Error('AdminPortalModule requires adminService');
        if (!role) throw new Error('AdminPortalModule requires role');
        this.adminService = adminService;
        this.role = role;
        this.toast = toast;

        this.container = null;
        this.portal = null;
        this.unsubscribeRole = null;

        this.cursor = null;
        this.hasMore = false;
        this.initialized = false;
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn(`AdminPortalModule: container #${containerId} not found`);
            return;
        }
        this.portal = document.createElement('admin-portal');
        this.container.appendChild(this.portal);

        this.attachComponentListeners();
        this.attachRoleSubscription();
    }

    attachComponentListeners() {
        this.portal.addEventListener('page-request', () => this.loadMore());
        this.portal.addEventListener('retry-request', () => this.refresh());
        this.portal.addEventListener('role-change', (e) => {
            const { targetUid, toRole } = e.detail ?? {};
            if (targetUid && toRole) this.handleRoleChange(targetUid, toRole);
        });
    }

    attachRoleSubscription() {
        this.unsubscribeRole = this.role.onRoleChange((next) => {
            this.portal?.setRole(next === 'owner' ? 'owner' : next === 'admin' ? 'admin' : null);
        });
    }

    /**
     * Called by main.js when the /admin route is shown. First call fetches
     * page 1; subsequent calls re-use the loaded list so the owner doesn't
     * pay a read every time they toggle in and out of the view.
     */
    async show() {
        if (!this.portal) return;
        if (this.initialized) return; // keep prior list
        this.initialized = true;
        await this.refresh();
    }

    async refresh() {
        this.cursor = null;
        this.portal.setLoading(true);
        const res = await this.adminService.listUsers({ pageSize: 20, cursor: null });
        if (!res.success) {
            this.portal.setError(res.error ?? 'Failed to load users');
            return;
        }
        this.cursor = res.data.nextCursor;
        this.hasMore = res.data.hasMore;
        this.portal.setUsers(res.data.users, res.data.hasMore);
    }

    async loadMore() {
        if (!this.hasMore || this.cursor == null) return;
        this.portal.setLoadingMore(true);
        const res = await this.adminService.listUsers({
            pageSize: 20,
            cursor: this.cursor,
        });
        if (!res.success) {
            this.portal.setLoadingMore(false);
            this.toast?.show?.('error', res.error ?? 'Failed to load more users', 5000);
            return;
        }
        this.cursor = res.data.nextCursor;
        this.hasMore = res.data.hasMore;
        this.portal.appendUsers(res.data.users, res.data.hasMore);
    }

    async handleRoleChange(targetUid, toRole) {
        // No optimistic flip — the server is the source of truth and may
        // reject (last-owner, rate limit). We show a loading toast instead.
        const pending = this.toast?.show?.('loading', 'Updating role…', 0);
        const res = await this.adminService.setUserRole(targetUid, toRole);
        pending?.dismiss?.();

        if (!res.success) {
            this.toast?.show?.('error', res.error, 5000);
            // Refresh to undo the visual dropdown change
            await this.refresh();
            return;
        }
        this.portal.updateUserRole(targetUid, toRole);
        this.toast?.show?.('success', `Role updated to ${toRole}`, 3000);
    }

    destroy() {
        this.unsubscribeRole?.();
        if (this.portal && this.container) {
            this.container.removeChild(this.portal);
        }
        this.portal = null;
        this.container = null;
    }
}
