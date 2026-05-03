/**
 * AdminPortal Web Component
 *
 * Admin Portal table: paginated user list with an owner-only role dropdown.
 * All security checks are server-side; this component only hides controls
 * the current role can't use.
 *
 * Usage:
 *   <admin-portal></admin-portal>
 *   portal.setRole('owner' | 'admin')
 *   portal.setUsers(users, hasMore)
 *   portal.appendUsers(users, hasMore)
 *   portal.setLoading(true|false)
 *   portal.setError('message')
 *
 * Events:
 *   - role-change: { detail: { targetUid, toRole } }
 *   - page-request: fired when "Load more" is clicked
 *
 * Spec §XI.3 (UI), AC-3, AC-4, AC-15
 */

const ROLE_LABEL = Object.freeze({
    owner: 'Owner',
    admin: 'Admin',
    user: 'User',
});

function formatDate(value) {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export class AdminPortal extends HTMLElement {
    constructor() {
        super();
        this.users = [];
        this.role = null; // 'owner' | 'admin' | null
        this.loading = false;
        this.error = null;
        this.hasMore = false;
        this.loadingMore = false;
    }

    connectedCallback() {
        this.render();
        this.addStyles();
        this.attachDelegatedListeners();
    }

    setRole(role) {
        this.role = role;
        this.render();
    }

    setUsers(users, hasMore = false) {
        this.users = users ?? [];
        this.hasMore = !!hasMore;
        this.error = null;
        this.loading = false;
        this.loadingMore = false;
        this.render();
    }

    appendUsers(users, hasMore = false) {
        this.users = this.users.concat(users ?? []);
        this.hasMore = !!hasMore;
        this.loadingMore = false;
        this.render();
    }

    setLoading(loading) {
        this.loading = loading;
        if (loading) this.error = null;
        this.render();
    }

    setLoadingMore(loadingMore) {
        this.loadingMore = loadingMore;
        this.render();
    }

    setError(message) {
        this.error = message;
        this.loading = false;
        this.loadingMore = false;
        this.render();
    }

    /**
     * Update the dropdown on a specific row without re-rendering the table.
     * Used after a successful setUserRole call; the snapshot listener will
     * eventually bring Firestore state up to date too.
     */
    updateUserRole(uid, newRole) {
        const u = this.users.find((x) => x.uid === uid);
        if (u) u.role = newRole;
        this.render();
    }

    render() {
        if (this.loading) {
            this.innerHTML = this.renderShell(this.renderLoading());
            return;
        }
        if (this.error) {
            this.innerHTML = this.renderShell(this.renderError());
            return;
        }
        if (this.users.length === 0) {
            this.innerHTML = this.renderShell(this.renderEmpty());
            return;
        }
        this.innerHTML = this.renderShell(this.renderTable());
    }

    renderShell(inner) {
        return `
<section class="admin-portal">
  <header class="admin-portal__header">
    <h1>Admin Portal</h1>
    <p class="admin-portal__subtitle">
      ${this.role === 'owner'
            ? 'Manage users and change roles'
            : 'View users (role changes require owner privileges)'}
    </p>
  </header>
  ${inner}
</section>`;
    }

    renderLoading() {
        return `<div class="admin-portal__status"><loading-spinner></loading-spinner></div>`;
    }

    renderError() {
        return `
<div class="admin-portal__status admin-portal__status--error">
  <p>${escapeHtml(this.error)}</p>
  <button type="button" data-action="retry">Retry</button>
</div>`;
    }

    renderEmpty() {
        return `<div class="admin-portal__status"><p>No users to display.</p></div>`;
    }

    renderTable() {
        const rows = this.users.map((u) => this.renderRow(u)).join('');
        const footer = this.hasMore
            ? `<button type="button" class="admin-portal__load-more"
                 data-action="load-more" ${this.loadingMore ? 'disabled' : ''}>
                 ${this.loadingMore ? 'Loading…' : 'Load more'}
               </button>`
            : '';
        return `
<div class="admin-portal__table-wrap">
  <table class="admin-portal__table">
    <thead>
      <tr>
        <th scope="col">User</th>
        <th scope="col">Email</th>
        <th scope="col">Joined</th>
        <th scope="col">Last sign-in</th>
        <th scope="col">Role</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>
${footer}`;
    }

    renderRow(u) {
        const displayName = escapeHtml(u.displayName || '(no name)');
        const email = escapeHtml(u.email || '—');
        const photo = escapeHtml(u.photoURL || '');
        return `
<tr data-uid="${escapeHtml(u.uid)}">
  <td class="admin-portal__user-cell">
    <user-avatar photo="${photo}" alt="${displayName}'s avatar" size="small"></user-avatar>
    <span class="admin-portal__display-name">${displayName}</span>
  </td>
  <td>${email}</td>
  <td>${formatDate(u.createdAt)}</td>
  <td>${formatDate(u.lastSignInAt)}</td>
  <td>${this.renderRoleCell(u)}</td>
</tr>`;
    }

    renderRoleCell(u) {
        if (this.role !== 'owner') {
            return `<span class="admin-portal__role-badge admin-portal__role-badge--${escapeHtml(u.role)}">
                      ${ROLE_LABEL[u.role] ?? escapeHtml(u.role)}
                    </span>`;
        }
        // Owner: render a select so the owner can change the role
        const options = ['owner', 'admin', 'user']
            .map(
                (r) =>
                    `<option value="${r}" ${r === u.role ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`,
            )
            .join('');
        return `
<select class="admin-portal__role-select"
        data-action="role-change"
        data-uid="${escapeHtml(u.uid)}"
        aria-label="Change role for ${escapeHtml(u.displayName || u.uid)}">
  ${options}
</select>`;
    }

    attachDelegatedListeners() {
        this.addEventListener('click', (e) => {
            const action = e.target?.dataset?.action;
            if (action === 'load-more') {
                this.setLoadingMore(true);
                this.dispatchEvent(new CustomEvent('page-request', { bubbles: true }));
            }
            if (action === 'retry') {
                this.dispatchEvent(new CustomEvent('retry-request', { bubbles: true }));
            }
        });

        this.addEventListener('change', (e) => {
            if (e.target?.dataset?.action !== 'role-change') return;
            const targetUid = e.target.dataset.uid;
            const toRole = e.target.value;
            this.dispatchEvent(
                new CustomEvent('role-change', {
                    bubbles: true,
                    detail: { targetUid, toRole },
                }),
            );
        });
    }

    addStyles() {
        if (document.getElementById('admin-portal-styles')) return;
        const style = document.createElement('style');
        style.id = 'admin-portal-styles';
        style.textContent = `
.admin-portal { padding: 2rem 1rem; max-width: 1100px; margin: 0 auto; color: var(--text-primary); }
.admin-portal__header { margin-bottom: 1.5rem; }
.admin-portal__header h1 { margin: 0 0 .25rem; font-size: 1.5rem; }
.admin-portal__subtitle { margin: 0; color: var(--text-secondary); }
.admin-portal__status { padding: 3rem 1rem; text-align: center; color: var(--text-secondary); }
.admin-portal__status--error { color: var(--error-fg); }
.admin-portal__table-wrap { overflow-x: auto; border: 1px solid var(--surface-border); border-radius: 8px; background: var(--surface-elevated); }
.admin-portal__table { width: 100%; border-collapse: collapse; }
.admin-portal__table th,
.admin-portal__table td { padding: .75rem 1rem; text-align: left; border-bottom: 1px solid var(--surface-border); vertical-align: middle; color: var(--text-primary); }
.admin-portal__table th { background: var(--surface-muted); font-weight: 600; font-size: .875rem; color: var(--text-secondary); }
.admin-portal__table tr:last-child td { border-bottom: none; }
.admin-portal__user-cell { display: flex; align-items: center; gap: .75rem; }
.admin-portal__display-name { font-weight: 500; }
.admin-portal__role-badge { display: inline-block; padding: .25rem .5rem; border-radius: 4px; font-size: .875rem; background: var(--surface-muted); color: var(--text-primary); }
.admin-portal__role-badge--owner { background: #fef3c7; color: #92400e; }
.admin-portal__role-badge--admin { background: #dbeafe; color: #1e40af; }
.admin-portal__role-badge--user { background: #f3f4f6; color: #4b5563; }
.admin-portal__role-select { padding: .35rem .5rem; border-radius: 4px; border: 1px solid var(--surface-border); background: var(--surface-elevated); color: var(--text-primary); }
.admin-portal__load-more { margin-top: 1rem; padding: .5rem 1rem; cursor: pointer; border: 1px solid var(--surface-border); background: var(--surface-elevated); color: var(--text-primary); border-radius: 4px; }
.admin-portal__load-more:disabled { opacity: .6; cursor: wait; }

/* Role badges — dark palette overrides */
[data-theme="dark"] .admin-portal__role-badge--owner { background: #422006; color: #fde68a; }
[data-theme="dark"] .admin-portal__role-badge--admin { background: #172554; color: #bfdbfe; }
[data-theme="dark"] .admin-portal__role-badge--user  { background: #1f2937; color: #d1d5db; }
`;
        document.head.appendChild(style);
    }
}

if (!customElements.get('admin-portal')) {
    customElements.define('admin-portal', AdminPortal);
}
