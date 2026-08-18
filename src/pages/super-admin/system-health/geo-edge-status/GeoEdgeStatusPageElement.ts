/**
 * GeoEdgeStatusPageElement.ts — pages/super-admin/system-health/geo-edge-status/
 *
 * Per-region status of edge-serving nodes (live/degraded/down per region)
 * and current latency vs. a target threshold. The threshold is displayed
 * as configuration (from the data), not hardcoded in the display component.
 * Mock-backed, matching Taranga's geo-distribution domain conceptually.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { geoEdgeService } from '../../../../services';
import type { EdgeNode } from '../../../../services/GeoEdgeService';
import '../../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .status-badge { display: inline-block; padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
  .status-live { background: rgba(22,163,74,0.12); color: var(--color-success); }
  .status-degraded { background: rgba(217,119,6,0.12); color: var(--color-warning); }
  .status-down { background: rgba(220,38,38,0.12); color: var(--color-danger); }
  .latency-over { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .latency-ok { color: var(--color-success); }
`;

class GeoEdgeStatusPageElement extends BaseComponent {
  private nodes: EdgeNode[] = [];
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
      this.nodes = await geoEdgeService.getEdgeNodes();
    } catch {
      this.nodes = [];
    }
    this.isLoading = false;
    this.rerender();
  }

  private renderStatusBadge(status: string): string {
    return `<span class="status-badge status-${status}">${status}</span>`;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const rows = this.nodes.map((n) => {
      const isOver = n.currentLatencyMs > n.targetLatencyMs;
      const latencyClass = isOver ? 'latency-over' : 'latency-ok';
      return html`<tr>
        <td>${n.region}</td>
        <td>${SafeHtmlString.trusted(this.renderStatusBadge(n.status))}</td>
        <td class="${latencyClass}">${n.currentLatencyMs} ms</td>
        <td>${n.targetLatencyMs} ms</td>
        <td>${isOver ? '⚠ Over threshold' : '✓ Within target'}</td>
      </tr>`;
    }).join('');

    return html`
      <h1 class="page-title">Geo & Edge Status</h1>
      <table>
        <thead><tr><th>Region</th><th>Status</th><th>Current Latency</th><th>Target Threshold</th><th>Assessment</th></tr></thead>
        <tbody>${SafeHtmlString.trusted(rows)}</tbody>
      </table>
    `;
  }
}

ComponentRegistry.register('super-admin-geo-edge-status', GeoEdgeStatusPageElement);
export { GeoEdgeStatusPageElement };