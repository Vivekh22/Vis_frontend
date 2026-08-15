/**
 * AccountsPageElement.ts — pages/admin/my-clients/accounts/
 *
 * The health/monitoring workspace. Summary cards, sortable main table
 * (Client ID, Company Name, Status, Total Spend, Active Campaigns,
 * Pending Approvals count, Last Activity, At-Risk flag), and a client
 * detail drill-down (row click) showing:
 *   - Team & Roles view-only (TeamMembersTableElement with read-only)
 *   - Integrations view-only (IntegrationsPageElement with read-only)
 *   - Consolidated recent activity
 *
 * View-only enforcement: the shared components refuse to render edit
 * controls when their read-only attribute is present — not just hidden.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { clientService } from '../../../../services';
import { authStore } from '../../../../platform/state/AuthStore';
import type { ClientSummary } from '../../../../core/types/ClientSummary';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .summary-bar { display: flex; gap: var(--space-4); margin-bottom: var(--space-6); flex-wrap: wrap; }
  .summary-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); flex: 1; min-width: 160px; }
  .summary-label { font-size: var(--font-size-xs); text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 var(--space-1); }
  .summary-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
  .table-container { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); cursor: pointer; }
  th:hover { color: var(--color-primary); }
  .client-row { cursor: pointer; }
  .client-row:hover { background: var(--color-surface-2); }
  .status-active { color: var(--color-success); font-weight: var(--font-weight-semibold); }
  .status-suspended { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .status-pending { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
  .at-risk-flag { color: var(--color-danger); font-weight: var(--font-weight-bold); }
  .detail-panel { margin-top: var(--space-6); }
  .detail-tabs { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--color-border); margin-bottom: var(--space-4); }
  .detail-tab { padding: var(--space-2) var(--space-4); border: none; background: none; cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-muted); border-bottom: 2px solid transparent; }
  .detail-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  .back-btn { padding: var(--space-2) var(--space-4); background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); margin-bottom: var(--space-4); }
`;

type SortKey = 'clientId' | 'companyName' | 'status' | 'totalSpend' | 'activeCampaigns' | 'pendingApprovals' | 'lastActivity';
type DetailTab = 'team' | 'integrations' | 'activity';

class AccountsPageElement extends BaseComponent {
  private clients: ClientSummary[] = [];
  private isLoading = true;
  private sortKey: SortKey = 'companyName';
  private sortAsc = true;
  private selectedClient: ClientSummary | null = null;
  private activeDetailTab: DetailTab = 'team';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    void this.loadClients();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadClients(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    const user = authStore.getState().currentUser;
    const clientIds = user?.allowedClientIds;
    try {
      this.clients = await clientService.listAssignedClients(clientIds);
    } catch {
      this.clients = [];
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const row = target.closest('[data-client-id]');
    if (row) {
      const clientId = row.getAttribute('data-client-id') ?? '';
      this.selectedClient = this.clients.find((c) => c.clientId === clientId) ?? null;
      this.activeDetailTab = 'team';
      this.rerender();
      return;
    }
    const tab = target.closest('[data-detail-tab]');
    if (tab) {
      this.activeDetailTab = tab.getAttribute('data-detail-tab') as DetailTab;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="back-to-list"]')) {
      this.selectedClient = null;
      this.rerender();
      return;
    }
    const th = target.closest('th[data-sort]');
    if (th) {
      const key = th.getAttribute('data-sort') as SortKey;
      if (this.sortKey === key) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortKey = key;
        this.sortAsc = true;
      }
      this.rerender();
    }
  };

  private get sortedClients(): ClientSummary[] {
    const sorted = [...this.clients].sort((a, b) => {
      const av = a[this.sortKey];
      const bv = b[this.sortKey];
      if (av instanceof Date && bv instanceof Date) return av.getTime() - bv.getTime();
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return this.sortAsc ? sorted : sorted.reverse();
  }

  private get totalSpend(): number {
    return this.clients.reduce((sum, c) => sum + c.totalSpend, 0);
  }

  private get totalActiveCampaigns(): number {
    return this.clients.reduce((sum, c) => sum + c.activeCampaigns, 0);
  }

  private get totalPendingApprovals(): number {
    return this.clients.reduce((sum, c) => sum + c.pendingApprovals, 0);
  }

  private statusClass(status: string): string {
    return `status-${status}`;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    if (this.selectedClient) {
      return this.renderDetailPanel();
    }
    const rows = this.sortedClients.map((c) => html`
      <tr class="client-row" data-client-id="${c.clientId}">
        <td>${c.clientId}</td>
        <td>${c.companyName}</td>
        <td class="${this.statusClass(c.status)}">${c.status}</td>
        <td>$${c.totalSpend.toLocaleString()}</td>
        <td>${c.activeCampaigns}</td>
        <td>${c.pendingApprovals}</td>
        <td>${c.lastActivity.toLocaleDateString()}</td>
        <td>${c.isAtRisk ? '<span class="at-risk-flag">⚠ At Risk</span>' : '—'}</td>
      </tr>
    `).join('');
    return html`
      <h1 class="page-title">Accounts</h1>
      <div class="summary-bar">
        <div class="summary-card"><p class="summary-label">Total Clients</p><p class="summary-value">${this.clients.length}</p></div>
        <div class="summary-card"><p class="summary-label">Total Spend</p><p class="summary-value">$${this.totalSpend.toLocaleString()}</p></div>
        <div class="summary-card"><p class="summary-label">Active Campaigns</p><p class="summary-value">${this.totalActiveCampaigns}</p></div>
        <div class="summary-card"><p class="summary-label">Pending Approvals</p><p class="summary-value">${this.totalPendingApprovals}</p></div>
      </div>
      <div class="table-container">
        <table>
          <thead><tr>
            <th data-sort="clientId">Client ID</th>
            <th data-sort="companyName">Company Name</th>
            <th data-sort="status">Status</th>
            <th data-sort="totalSpend">Total Spend</th>
            <th data-sort="activeCampaigns">Active Campaigns</th>
            <th data-sort="pendingApprovals">Pending Approvals</th>
            <th data-sort="lastActivity">Last Activity</th>
            <th>At-Risk</th>
          </tr></thead>
          <tbody>${SafeHtmlString.trusted(rows)}</tbody>
        </table>
      </div>
    `;
  }

  private renderDetailPanel(): string {
    if (!this.selectedClient) return '';
    const c = this.selectedClient;
    const tabs: { key: DetailTab; label: string }[] = [
      { key: 'team', label: 'Team & Roles' },
      { key: 'integrations', label: 'Integrations' },
      { key: 'activity', label: 'Recent Activity' },
    ];
    const tabsHtml = tabs.map((t) => html`
      <button class="detail-tab ${this.activeDetailTab === t.key ? 'active' : ''}" data-detail-tab="${t.key}" type="button">${t.label}</button>
    `).join('');
    let tabContent = '';
    if (this.activeDetailTab === 'team') {
      tabContent = `<team-members-table read-only client-id="${c.clientId}"></team-members-table>`;
    } else if (this.activeDetailTab === 'integrations') {
      tabContent = `<integrations-page read-only></integrations-page>`;
    } else {
      tabContent = `<activity-log show-filters></activity-log>`;
    }
    return html`
      <button class="back-btn" data-action="back-to-list" type="button">← Back to Accounts</button>
      <h1 class="page-title">${c.companyName} — ${c.clientId}</h1>
      <div class="summary-bar">
        <div class="summary-card"><p class="summary-label">Status</p><p class="summary-value">${c.status}</p></div>
        <div class="summary-card"><p class="summary-label">Total Spend</p><p class="summary-value">$${c.totalSpend.toLocaleString()}</p></div>
        <div class="summary-card"><p class="summary-label">Active Campaigns</p><p class="summary-value">${c.activeCampaigns}</p></div>
        <div class="summary-card"><p class="summary-label">Pending Approvals</p><p class="summary-value">${c.pendingApprovals}</p></div>
      </div>
      <div class="detail-panel">
        <div class="detail-tabs">${SafeHtmlString.trusted(tabsHtml)}</div>
        ${SafeHtmlString.trusted(tabContent)}
      </div>
    `;
  }
}

ComponentRegistry.register('admin-accounts', AccountsPageElement);
export { AccountsPageElement };