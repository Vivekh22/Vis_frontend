/**
 * ComplianceCenterPageElement.ts — pages/super-admin/trust-compliance/compliance-center/
 *
 * Regulatory status (GDPR, DPDP, COPPA, etc. — a status list, not a full
 * compliance-tracking workflow), consent-management statistics, outstanding
 * DSAR queue with due-date tracking.
 *
 * DSAR OVERDUE INDICATOR:
 *   Reuses the SAME non-color-alone overdue pattern established by
 *   ApprovalQueueElement in Part 2 — the overdue indicator includes
 *   both a red color AND a text label ("OVERDUE"), not color alone.
 *   No new overdue-indicator style is invented here.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { complianceService } from '../../../../services';
import type { ComplianceRegulation, ConsentStats, DsarRequest } from '../../../../services/ComplianceService';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .panel-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .kpi-row { display: flex; gap: var(--space-6); margin-bottom: var(--space-4); }
  .kpi-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); }
  .kpi-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; }
  .reg-status { display: inline-block; padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
  .reg-compliant { background: rgba(22,163,74,0.12); color: var(--color-success); }
  .reg-action_needed { background: rgba(217,119,6,0.12); color: var(--color-warning); }
  .reg-non_compliant { background: rgba(220,38,38,0.12); color: var(--color-danger); }
  .dsar-overdue-cell { color: var(--color-danger); font-weight: var(--font-weight-bold); }
  .dsar-overdue-label { display: inline-block; margin-left: var(--space-1); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--color-danger); }
`;

class ComplianceCenterPageElement extends BaseComponent {
  private regulations: ComplianceRegulation[] = [];
  private consentStats: ConsentStats | null = null;
  private dsarQueue: DsarRequest[] = [];
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
      const [regulations, consentStats, dsarQueue] = await Promise.all([
        complianceService.getRegulations(),
        complianceService.getConsentStats(),
        complianceService.getDsarQueue(),
      ]);
      this.regulations = regulations;
      this.consentStats = consentStats;
      this.dsarQueue = dsarQueue;
    } catch {
      // Use empty state
    }
    this.isLoading = false;
    this.rerender();
  }

  private renderRegStatus(status: string): string {
    return `<span class="reg-status reg-${status}">${status.replace(/_/g, ' ')}</span>`;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const now = new Date();

    const regRows = this.regulations.map((r) => html`<tr>
      <td>${r.name}</td>
      <td>${SafeHtmlString.trusted(this.renderRegStatus(r.status))}</td>
      <td>${r.lastAudit.toLocaleDateString()}</td>
      <td>${r.notes}</td>
    </tr>`).join('');

    const consentHtml = this.consentStats ? html`
      <div class="kpi-row">
        <div><div class="kpi-value">${this.consentStats.totalUsers.toLocaleString()}</div><div class="kpi-label">Total Users</div></div>
        <div><div class="kpi-value">${this.consentStats.consentGranted.toLocaleString()}</div><div class="kpi-label">Consent Granted</div></div>
        <div><div class="kpi-value">${this.consentStats.consentRate}%</div><div class="kpi-label">Consent Rate</div></div>
      </div>
    ` : '';

    const dsarRows = this.dsarQueue.map((d) => {
      const isOverdue = complianceService.isOverdue(d, now);
      return html`<tr>
        <td>${d.requesterName}</td>
        <td>${d.requestType}</td>
        <td>${d.submittedAt.toLocaleDateString()}</td>
        <td class="${isOverdue ? 'dsar-overdue-cell' : ''}">
          ${d.dueDate.toLocaleDateString()}
          ${isOverdue ? SafeHtmlString.trusted('<span class="dsar-overdue-label">OVERDUE</span>') : ''}
        </td>
        <td>${d.status}</td>
      </tr>`;
    }).join('');

    return html`
      <h1 class="page-title">Compliance Center</h1>
      <div class="panel">
        <p class="panel-title">Regulatory Status</p>
        <table><thead><tr><th>Regulation</th><th>Status</th><th>Last Audit</th><th>Notes</th></tr></thead><tbody>${SafeHtmlString.trusted(regRows)}</tbody></table>
      </div>
      <div class="panel">
        <p class="panel-title">Consent Management Statistics</p>
        ${SafeHtmlString.trusted(consentHtml)}
      </div>
      <div class="panel">
        <p class="panel-title">DSAR Queue</p>
        <table><thead><tr><th>Requester</th><th>Type</th><th>Submitted</th><th>Due Date</th><th>Status</th></tr></thead><tbody>${SafeHtmlString.trusted(dsarRows)}</tbody></table>
      </div>
    `;
  }
}

ComponentRegistry.register('super-admin-compliance-center', ComplianceCenterPageElement);
export { ComplianceCenterPageElement };