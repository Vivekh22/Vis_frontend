/**
 * FraudSecurityOverviewPageElement.ts — pages/super-admin/trust-compliance/fraud-security-overview/
 *
 * Platform-wide fraud/IVT rate trends (ChartWidgetElement), blocklist
 * size + recent additions, security incident log (DataTableElement).
 * Distinct from any single client's fraud flag (Admin Accounts page,
 * Part 11) — this is the aggregate view.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { fraudSecurityService } from '../../../../services';
import type { FraudSecuritySummary } from '../../../../services/FraudSecurityService';
import '../../../../components/empty-state/EmptyStateElement';
import '../../../../components/loading-state/LoadingStateElement';



const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .panel-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); }
  .kpi-row { display: flex; gap: var(--space-6); margin-bottom: var(--space-4); }
  .kpi-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); }
  .kpi-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .severity-high { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .severity-medium { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
  .severity-low { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
`;

class FraudSecurityOverviewPageElement extends BaseComponent {
  private summary: FraudSecuritySummary | null = null;
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    void this.loadData();
  }

  protected onUnmount(): void {}

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.summary = await fraudSecurityService.getSummary();
    } catch {
      this.summary = null;
    }
    this.isLoading = false;
    this.rerender();
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.summary) return;
    const chart = this.shadow.querySelector('[data-chart="ivt-trend"]') as HTMLElement | null;
    if (chart) {
      (chart as unknown as { data: { label: string; value: number }[] }).data = this.summary.ivtRateTrend;
    }
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    if (!this.summary) {
      return '<empty-state message="No fraud/security data available."></empty-state>';
    }
    const blocklistRows = this.summary.recentBlocklistAdditions.map((b) => html`<tr>
      <td style="font-family:var(--font-mono);">${b.ip}</td>
      <td>${b.reason}</td>
      <td>${b.addedAt.toLocaleDateString()}</td>
    </tr>`).join('');

    const incidentRows = this.summary.incidents.map((i) => html`<tr>
      <td>${i.type}</td>
      <td class="severity-${i.severity}">${i.severity}</td>
      <td>${i.description}</td>
      <td>${i.detectedAt.toLocaleDateString()}</td>
      <td>${i.status}</td>
    </tr>`).join('');

    return html`
      <h1 class="page-title">Fraud & Security Overview</h1>
      <div class="panel">
        <p class="panel-title">IVT Rate Trend</p>
        <chart-widget data-chart="ivt-trend" data-chart-type="line"></chart-widget>
      </div>
      <div class="panel">
        <p class="panel-title">Blocklist Summary</p>
        <div class="kpi-row">
          <div><div class="kpi-value">${this.summary.blocklistSize.toLocaleString()}</div><div class="kpi-label">Total Blocked IPs</div></div>
        </div>
        <table><thead><tr><th>IP</th><th>Reason</th><th>Added</th></tr></thead><tbody>${SafeHtmlString.trusted(blocklistRows)}</tbody></table>
      </div>
      <div class="panel">
        <p class="panel-title">Security Incident Log</p>
        <table><thead><tr><th>Type</th><th>Severity</th><th>Description</th><th>Detected</th><th>Status</th></tr></thead><tbody>${SafeHtmlString.trusted(incidentRows)}</tbody></table>
      </div>
    `;
  }
}

ComponentRegistry.register('super-admin-fraud-security-overview', FraudSecurityOverviewPageElement);
export { FraudSecurityOverviewPageElement };