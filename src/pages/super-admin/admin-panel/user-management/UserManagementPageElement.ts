/**
 * UserManagementPageElement.ts — pages/super-admin/admin-panel/user-management/
 *
 * Two tabs:
 *   Clients: every client account, status, registration date, assigned
 *   Admin(s). Row click → detail view with sub-tabs.
 *   Admins: every Admin account, role label, assigned client count,
 *   status. "+ Create Admin" flows into the Role & Permission Builder.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { clientService, adminUserRepo } from '../../../../services';
import type { ClientSummary } from '../../../../core/types/ClientSummary';
import type { AdminUserSummary } from '../../../../core/types/AdminUserSummary';
import '../../../../components/loading-state/LoadingStateElement';


type Tab = 'clients' | 'admins';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .tabs { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--color-border); margin-bottom: var(--space-4); }
  .tab { padding: var(--space-2) var(--space-4); border: none; background: none; cursor: pointer; font-size: var(--font-size-sm); color: var(--color-text-muted); border-bottom: 2px solid transparent; }
  .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  tr { cursor: pointer; }
  tr:hover { background: var(--color-bg); }
  .create-admin-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4); }
  .status-badge { font-size: var(--font-size-xs); padding: 2px 8px; border-radius: var(--radius-full); }
  .status-active { background: var(--color-success); color: #fff; }
  .status-suspended { background: var(--color-danger); color: #fff; }
`;

class UserManagementPageElement extends BaseComponent {
  private activeTab: Tab = 'clients';
  private clients: ClientSummary[] = [];
  private admins: AdminUserSummary[] = [];
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.clients = await clientService.listAssignedClients();
      this.admins = await adminUserRepo.findAllAdmins();
    } catch {
      // Use empty arrays
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const tab = target.closest('[data-tab]');
    if (tab) {
      this.activeTab = tab.getAttribute('data-tab') as Tab;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="create-admin"]')) {
      window.location.hash = '#/super-admin/role-permission-builder';
      return;
    }
  };

  private renderClientsTab(): string {
    const rows = this.clients.map((c) => html`
      <tr data-client-id="${c.clientId}">
        <td>${c.companyName}</td>
        <td><span class="status-badge status-${c.status}">${c.status}</span></td>
        <td>${c.assignedSince.toLocaleDateString()}</td>
        <td>${c.activeCampaigns}</td>
        <td>${c.isAtRisk ? '⚠ At Risk' : '—'}</td>
      </tr>
    `).join('');
    return html`
      <table>
        <thead><tr><th>Company Name</th><th>Status</th><th>Registration Date</th><th>Active Campaigns</th><th>Health</th></tr></thead>
        <tbody>${SafeHtmlString.trusted(rows)}</tbody>
      </table>
    `;
  }

  private renderAdminsTab(): string {
    const rows = this.admins.map((a) => html`
      <tr data-admin-id="${a.adminId}">
        <td>${a.fullName}</td>
        <td>${a.email}</td>
        <td>${a.roleLabel}</td>
        <td>${a.assignedClientCount}</td>
        <td><span class="status-badge status-${a.status}">${a.status}</span></td>
      </tr>
    `).join('');
    return html`
      <button class="create-admin-btn" data-action="create-admin" type="button">+ Create Admin</button>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role Label</th><th>Assigned Clients</th><th>Status</th></tr></thead>
        <tbody>${SafeHtmlString.trusted(rows)}</tbody>
      </table>
    `;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    return html`
      <h1 class="page-title">User Management</h1>
      <div class="tabs">
        <button class="tab ${this.activeTab === 'clients' ? 'active' : ''}" data-tab="clients" type="button">Clients</button>
        <button class="tab ${this.activeTab === 'admins' ? 'active' : ''}" data-tab="admins" type="button">Admins</button>
      </div>
      ${SafeHtmlString.trusted(this.activeTab === 'clients' ? this.renderClientsTab() : this.renderAdminsTab())}
    `;
  }
}

ComponentRegistry.register('super-admin-user-management', UserManagementPageElement);
export { UserManagementPageElement };