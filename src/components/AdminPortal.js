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
        this.query = '';
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
        this.innerHTML = this.renderShell();
    }

    renderShell() {
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
  ${this.renderSearchBar()}
  <div class="admin-portal__results">${this.renderInner()}</div>
</section>`;
    }

    renderInner() {
        if (this.loading) return this.renderLoading();
        if (this.error) return this.renderError();
        if (this.users.length === 0) return this.renderEmpty();
        return this.renderTable();
    }

    renderSearchBar() {
        if (this.loading || this.error || this.users.length === 0) return '';
        return `
<div class="admin-portal__search-bar">
  <input type="search" class="admin-portal__search"
    placeholder="Search by name or email"
    aria-label="Search users by name or email"
    value="${escapeHtml(this.query)}" />
</div>`;
    }

    filteredUsers() {
        const q = this.query.trim().toLowerCase();
        if (!q) return this.users;
        return this.users.filter((u) => {
            const name = (u.displayName || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            return name.includes(q) || email.includes(q);
        });
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
        const filtered = this.filteredUsers();
        const footer = this.hasMore
            ? `<button type="button" class="admin-portal__load-more"
                 data-action="load-more" ${this.loadingMore ? 'disabled' : ''}>
                 ${this.loadingMore ? 'Loading…' : 'Load more'}
               </button>`
            : '';
        if (filtered.length === 0) {
            return `
<div class="admin-portal__status">
  <p>No users match "${escapeHtml(this.query.trim())}".</p>
</div>
${footer}`;
        }
        const rows = filtered.map((u) => this.renderRow(u)).join('');
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
  <td data-label="Email">${email}</td>
  <td data-label="Joined">${formatDate(u.createdAt)}</td>
  <td data-label="Last sign-in">${formatDate(u.lastSignInAt)}</td>
  <td data-label="Role">${this.renderRoleCell(u)}</td>
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

        this.addEventListener('input', (e) => {
            if (!e.target?.classList?.contains('admin-portal__search')) return;
            this.query = e.target.value;
            const container = this.querySelector('.admin-portal__results');
            if (container) container.innerHTML = this.renderInner();
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
.admin-portal__search-bar { margin-bottom: 1rem; }
.admin-portal__search { width: 100%; max-width: 400px; padding: .5rem .75rem; border: 1px solid var(--surface-border); border-radius: 6px; background: var(--surface-elevated); color: var(--text-primary); font-size: 1rem; box-sizing: border-box; }
.admin-portal__search:focus { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

/* Role badges — dark palette overrides */
[data-theme="dark"] .admin-portal__role-badge--owner { background: #422006; color: #fde68a; }
[data-theme="dark"] .admin-portal__role-badge--admin { background: #172554; color: #bfdbfe; }
[data-theme="dark"] .admin-portal__role-badge--user  { background: #1f2937; color: #d1d5db; }

@media (max-width: 640px) {
  .admin-portal { padding: 1rem .75rem; }
  .admin-portal__table-wrap { border: none; background: transparent; overflow-x: visible; }
  .admin-portal__table,
  .admin-portal__table tbody,
  .admin-portal__table tr,
  .admin-portal__table td { display: block; width: 100%; }
  .admin-portal__table thead { position: absolute; left: -9999px; }
  .admin-portal__table tr {
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    background: var(--surface-elevated);
    margin-bottom: .75rem;
    padding: .75rem 1rem;
  }
  .admin-portal__table td {
    border-bottom: none;
    padding: .35rem 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: .75rem;
  }
  .admin-portal__table td::before {
    content: attr(data-label);
    color: var(--text-secondary);
    font-size: .8125rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  .admin-portal__table td.admin-portal__user-cell {
    justify-content: flex-start;
    padding-bottom: .5rem;
    margin-bottom: .25rem;
    border-bottom: 1px solid var(--surface-border);
  }
  .admin-portal__table td.admin-portal__user-cell::before { content: none; }
  .admin-portal__display-name { font-weight: 600; font-size: 1rem; }
  .admin-portal__role-select { min-height: 40px; padding: .5rem .75rem; font-size: 1rem; }
  .admin-portal__load-more { width: 100%; min-height: 44px; }
  .admin-portal__search { max-width: none; min-height: 40px; }
}
`;
        document.head.appendChild(style);
    }
}

if (!customElements.get('admin-portal')) {
    customElements.define('admin-portal', AdminPortal);
}
