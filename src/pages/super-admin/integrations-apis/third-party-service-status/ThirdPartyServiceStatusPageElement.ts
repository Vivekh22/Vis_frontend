/**
 * ThirdPartyServiceStatusPageElement.ts — pages/super-admin/integrations-apis/third-party-service-status/
 *
 * Simple status-per-service list — payment gateway, fraud-detection
 * vendor, email/SMS delivery. One StatusBadgeElement per row. Mock-backed.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { thirdPartyStatusService } from '../../../../services';
import type { ThirdPartyServiceStatus } from '../../../../services/ThirdPartyStatusService';
import '../../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
`;

class ThirdPartyServiceStatusPageElement extends BaseComponent {
  private services: ThirdPartyServiceStatus[] = [];
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
      this.services = await thirdPartyStatusService.getAllStatuses();
    } catch {
      this.services = [];
    }
    this.isLoading = false;
    this.rerender();
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const rows = this.services.map((s) => {
      const statusText = s.status === 'operational' ? 'active' : s.status === 'degraded' ? 'paused' : 'rejected';
      return html`<tr>
        <td>${s.serviceName}</td>
        <td>${s.category}</td>
        <td><status-badge data-status="${statusText}"></status-badge></td>
        <td>${s.uptimePercent}%</td>
        <td>${s.lastIncident ? s.lastIncident.toLocaleDateString() : 'No recent incidents'}</td>
      </tr>`;
    }).join('');

    return html`
      <h1 class="page-title">Third-Party Service Status</h1>
      <table>
        <thead><tr><th>Service</th><th>Category</th><th>Status</th><th>Uptime</th><th>Last Incident</th></tr></thead>
        <tbody>${SafeHtmlString.trusted(rows)}</tbody>
      </table>
    `;
  }
}

ComponentRegistry.register('super-admin-third-party-service-status', ThirdPartyServiceStatusPageElement);
export { ThirdPartyServiceStatusPageElement };