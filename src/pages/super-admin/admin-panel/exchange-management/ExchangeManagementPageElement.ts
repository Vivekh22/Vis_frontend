/**
 * ExchangeManagementPageElement.ts — pages/super-admin/admin-panel/exchange-management/
 *
 * Per-client selector, table of every technically-connected exchange,
 * Allowed/Blocked toggle per exchange per client, Bulk Allow All /
 * Block All, optional per-campaign-type override.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { exchangeService, clientService } from '../../../../services';
import type { ExchangeConfig } from '../../../../core/entities/ExchangeConfig';
import type { ClientSummary } from '../../../../core/types/ClientSummary';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .client-selector { padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); margin-bottom: var(--space-4); }
  .bulk-actions { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
  .bulk-btn { padding: var(--space-1) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .toggle { position: relative; display: inline-block; width: 44px; height: 22px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--color-danger); border-radius: var(--radius-full); transition: 0.3s; }
  .toggle-slider:before { content: ""; position: absolute; height: 18px; width: 18px; left: 2px; top: 2px; background: #fff; border-radius: 50%; transition: 0.3s; }
  .toggle input:checked + .toggle-slider { background: var(--color-success); }
  .toggle input:checked + .toggle-slider:before { transform: translateX(22px); }
`;

class ExchangeManagementPageElement extends BaseComponent {
  private clients: ClientSummary[] = [];
  private selectedClientId = '';
  private exchanges: ExchangeConfig[] = [];
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('change', this.handleChange);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.clients = await clientService.listAssignedClients();
      if (this.clients.length > 0) {
        this.selectedClientId = this.clients[0]!.clientId;
        await this.loadExchanges();
      }
    } catch {
      // Use empty state
    }
    this.isLoading = false;
    this.rerender();
  }

  private async loadExchanges(): Promise<void> {
    if (!this.selectedClientId) return;
    try {
      this.exchanges = await exchangeService.getClientExchanges(this.selectedClientId);
    } catch {
      this.exchanges = [];
    }
    this.rerender();
  }

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const selector = target.closest('[data-field="client-selector"]');
    if (selector) {
      this.selectedClientId = (selector as HTMLSelectElement).value;
      void this.loadExchanges();
      return;
    }
    const toggle = target.closest('[data-exchange]');
    if (toggle instanceof HTMLInputElement) {
      const exchangeName = toggle.getAttribute('data-exchange');
      if (exchangeName) {
        const status = toggle.checked ? 'allowed' : 'blocked';
        void exchangeService.setExchangeStatus(this.selectedClientId, exchangeName, status);
      }
    }
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="allow-all"]')) {
      void exchangeService.bulkAllowAll(this.selectedClientId).then(() => this.loadExchanges());
      return;
    }
    if (target.closest('[data-action="block-all"]')) {
      void exchangeService.bulkBlockAll(this.selectedClientId).then(() => this.loadExchanges());
      return;
    }
  };

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const options = this.clients.map((c) =>
      `<option value="${c.clientId}" ${c.clientId === this.selectedClientId ? 'selected' : ''}>${c.companyName}</option>`,
    ).join('');
    const rows = this.exchanges.map((ex) => html`
      <tr>
        <td>${ex.exchangeName}</td>
        <td>
          <label class="toggle">
            <input type="checkbox" data-exchange="${ex.exchangeName}" ${ex.status === 'allowed' ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td>${ex.status}</td>
      </tr>
    `).join('');
    return html`
      <h1 class="page-title">Exchange Management</h1>
      <select class="client-selector" data-field="client-selector">${SafeHtmlString.trusted(options)}</select>
      <div class="bulk-actions">
        <button class="bulk-btn" data-action="allow-all" type="button">Allow All</button>
        <button class="bulk-btn" data-action="block-all" type="button">Block All</button>
      </div>
      <table>
        <thead><tr><th>Exchange</th><th>Allowed</th><th>Status</th></tr></thead>
        <tbody>${SafeHtmlString.trusted(rows)}</tbody>
      </table>
    `;
  }
}

ComponentRegistry.register('super-admin-exchange-management', ExchangeManagementPageElement);
export { ExchangeManagementPageElement };