/**
 * AssignedClientsPageElement.ts — pages/admin/my-clients/assigned-clients/
 *
 * Simple roster table: Client ID, Company Name, Contact Name, Status,
 * Campaign Types, No. of Active Campaigns, Assigned Since. Row click
 * navigates into that client's scoped data. Search/filter.
 *
 * Empty state: "No clients assigned yet — contact your Super Admin"
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { clientService } from '../../../../services';
import { authStore } from '../../../../platform/state/AuthStore';
import { navigate } from '../../../../utils/navigate';
import type { ClientSummary } from '../../../../core/types/ClientSummary';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .search-bar { margin-bottom: var(--space-4); }
  .search-input { width: 100%; max-width: 400px; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: var(--font-body); }
  .table-container { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .client-row { cursor: pointer; }
  .client-row:hover { background: var(--color-surface-2); }
  .status-active { color: var(--color-success); font-weight: var(--font-weight-semibold); }
  .status-suspended { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .status-pending { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
`;

class AssignedClientsPageElement extends BaseComponent {
  private clients: ClientSummary[] = [];
  private filteredClients: ClientSummary[] = [];
  private isLoading = true;
  private searchTerm = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    void this.loadClients();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
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
    this.applyFilter();
    this.isLoading = false;
    this.rerender();
  }

  private applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredClients = this.clients;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(
        (c) => c.companyName.toLowerCase().includes(term) || c.clientId.toLowerCase().includes(term),
      );
    }
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const row = target.closest('[data-client-id]');
    if (row) {
      const clientId = row.getAttribute('data-client-id') ?? '';
      navigate(`/admin/accounts?clientId=${clientId}`);
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'search') {
      this.searchTerm = (target as HTMLInputElement).value;
      this.applyFilter();
      this.rerender();
    }
  };

  private statusClass(status: string): string {
    return `status-${status}`;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="table-rows"></loading-state>`;
    }
    if (this.clients.length === 0) {
      return html`
        <h1 class="page-title">Assigned Clients</h1>
        <empty-state message="No clients assigned yet — contact your Super Admin" iconName="👥"></empty-state>
      `;
    }
    const rows = this.filteredClients.map((c) => html`
      <tr class="client-row" data-client-id="${c.clientId}">
        <td>${c.clientId}</td>
        <td>${c.companyName}</td>
        <td>${c.contactName}</td>
        <td class="${this.statusClass(c.status)}">${c.status}</td>
        <td>${c.campaignTypes.join(', ')}</td>
        <td>${c.activeCampaigns}</td>
        <td>${c.assignedSince.toLocaleDateString()}</td>
      </tr>
    `).join('');
    return html`
      <h1 class="page-title">Assigned Clients</h1>
      <div class="search-bar">
        <input type="text" class="search-input" data-field="search" placeholder="Search by company or client ID..." value="${this.searchTerm}">
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>Client ID</th><th>Company Name</th><th>Contact Name</th><th>Status</th><th>Campaign Types</th><th>Active Campaigns</th><th>Assigned Since</th></tr></thead>
          <tbody>${SafeHtmlString.trusted(rows)}</tbody>
        </table>
      </div>
    `;
  }
}

ComponentRegistry.register('admin-assigned-clients', AssignedClientsPageElement);
export { AssignedClientsPageElement };