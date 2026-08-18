/**
 * InfrastructureHealthPageElement.ts — pages/super-admin/system-health/infrastructure-health/
 *
 * API latency, error rates, database health, queue sizes, uptime.
 * Standard ops dashboard — ChartWidgetElement + DataTableElement. Mock-backed.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { infrastructureHealthService } from '../../../../services';
import type { InfrastructureMetric } from '../../../../services/InfrastructureHealthService';
import '../../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
  @media (max-width: 768px) { .metric-grid { grid-template-columns: 1fr; } }
  .metric-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .metric-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2); }
  .metric-name { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .metric-value { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); }
  .metric-unit { font-size: var(--font-size-xs); color: var(--color-text-muted); }
  .status-badge { display: inline-block; padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
  .status-healthy { background: rgba(22,163,74,0.12); color: var(--color-success); }
  .status-warning { background: rgba(217,119,6,0.12); color: var(--color-warning); }
  .status-critical { background: rgba(220,38,38,0.12); color: var(--color-danger); }
`;

class InfrastructureHealthPageElement extends BaseComponent {
  private metrics: InfrastructureMetric[] = [];
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
      this.metrics = await infrastructureHealthService.getMetrics();
    } catch {
      this.metrics = [];
    }
    this.isLoading = false;
    this.rerender();
    // Set chart data after render so chart-widget elements exist
    this.updateCharts();
  }

  private updateCharts(): void {
    for (const metric of this.metrics) {
      const chart = this.shadow.querySelector(`[data-chart-id="${metric.id}"]`) as HTMLElement | null;
      if (chart) {
        (chart as unknown as { data: { label: string; value: number }[] }).data = metric.trendData;
      }
    }
  }

  private renderStatusBadge(status: string): string {
    return `<span class="status-badge status-${status}">${status}</span>`;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const cards = this.metrics.map((m) => html`
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-name">${m.metricName}</span>
          ${SafeHtmlString.trusted(this.renderStatusBadge(m.status))}
        </div>
        <div class="metric-value">${m.currentValue} <span class="metric-unit">${m.unit}</span></div>
        <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin:var(--space-1) 0 var(--space-2);">Threshold: ${m.threshold} ${m.unit}</p>
        <chart-widget data-chart-id="${m.id}" data-chart-type="line"></chart-widget>
      </div>
    `).join('');

    return html`
      <h1 class="page-title">Infrastructure Health</h1>
      <div class="metric-grid">${SafeHtmlString.trusted(cards)}</div>
    `;
  }
}

ComponentRegistry.register('super-admin-infrastructure-health', InfrastructureHealthPageElement);
export { InfrastructureHealthPageElement };