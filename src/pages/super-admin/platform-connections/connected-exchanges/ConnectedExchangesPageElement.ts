/**
 * ConnectedExchangesPageElement.ts — pages/super-admin/platform-connections/connected-exchanges/
 *
 * List of every exchange the platform is technically connected to —
 * connection status (live/degraded/down), OpenRTB protocol version,
 * current traffic volume/QPS, health/uptime history (line chart).
 *
 * DATA SOURCE:
 *   Mock-backed for now. In production, this data will come from
 *   Taranga's own monitoring output — NOT something this frontend
 *   computes itself.
 *
 * SINGLE SOURCE OF TRUTH:
 *   This page's repository (MockPlatformConnectionRepository) exports
 *   CONNECTED_EXCHANGE_NAMES, which MockExchangeRepository imports —
 *   so Part 12's Exchange Management reads from the same exchange list.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { platformConnectionService } from '../../../../services';
import type { ConnectedExchange } from '../../../../services/PlatformConnectionService';
import '../../../../components/chart-widget/ChartWidgetElement';
import '../../../../components/loading-state/LoadingStateElement';



const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .page-note { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0 0 var(--space-6); }
  table { width: 100%; border-collapse: collapse; margin-bottom: var(--space-6); }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .exchange-row { cursor: pointer; }
  .exchange-row:hover { background: var(--color-bg); }
  .exchange-detail { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .detail-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-2); }
  .status-badge { display: inline-block; padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
  .status-live { background: rgba(22,163,74,0.12); color: var(--color-success); }
  .status-degraded { background: rgba(217,119,6,0.12); color: var(--color-warning); }
  .status-down { background: rgba(220,38,38,0.12); color: var(--color-danger); }
`;

class ConnectedExchangesPageElement extends BaseComponent {
  private exchanges: ConnectedExchange[] = [];
  private selectedExchange: ConnectedExchange | null = null;
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
      this.exchanges = await platformConnectionService.getConnectedExchanges();
    } catch {
      this.exchanges = [];
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const row = target.closest('[data-exchange-id]');
    if (row) {
      const id = row.getAttribute('data-exchange-id');
      this.selectedExchange = this.exchanges.find((e) => e.id === id) ?? null;
      this.rerender();
      this.updateChart();
    }
  };

  private updateChart(): void {
    if (!this.selectedExchange) return;
    const chart = this.shadow.querySelector('chart-widget') as HTMLElement | null;
    if (chart) {
      (chart as unknown as { data: { label: string; value: number }[] }).data = this.selectedExchange.uptimeHistory;
    }
  }

  private renderStatusBadge(status: string): string {
    const cls = status === 'live' ? 'status-live' : status === 'degraded' ? 'status-degraded' : 'status-down';
    return `<span class="status-badge ${cls}">${status}</span>`;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const rows = this.exchanges.map((ex) => html`
      <tr class="exchange-row" data-exchange-id="${ex.id}">
        <td>${ex.name}</td>
        <td>${this.renderStatusBadge(ex.status)}</td>
        <td>${ex.openRtbVersion}</td>
        <td>${ex.currentQps.toLocaleString()}</td>
      </tr>
    `).join('');

    const detail = this.selectedExchange
      ? html`
        <div class="exchange-detail">
          <p class="detail-title">${this.selectedExchange.name} — Uptime History (7 days)</p>
          <chart-widget data-chart-type="line"></chart-widget>
        </div>
      `
      : '';

    return html`
      <h1 class="page-title">Connected Exchanges / SSPs</h1>
      <p class="page-note">Data source: Taranga monitoring output (mock-backed until backend connection exists).</p>
      <table>
        <thead><tr><th>Exchange</th><th>Status</th><th>OpenRTB Version</th><th>Current QPS</th></tr></thead>
        <tbody>${SafeHtmlString.trusted(rows)}</tbody>
      </table>
      ${SafeHtmlString.trusted(detail)}
    `;
  }
}

ComponentRegistry.register('super-admin-connected-exchanges', ConnectedExchangesPageElement);
export { ConnectedExchangesPageElement };