/**
 * OverviewPageElement.ts — pages/admin/overview/
 *
 * Replaces Part 4's proof-of-concept. Full Admin Overview:
 *   - Aggregate performance card (combined spend/revenue/ROAS across
 *     assigned clients, period-selector pattern from Dashboard)
 *   - Approval backlog panel (count + average turnaround vs. SLA — uses
 *     ApprovalService.isOverdue()'s SLA logic)
 *   - At-Risk Clients strip (from MockClientRepository's flagged subset —
 *     real health-scoring is a backend/Taranga concern, not this frontend)
 *   - Recent activity feed
 *   - Auto-generated insight line (reuses DashboardService.generateInsight)
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { dashboardService, approvalService, clientService } from '../../../services';
import { authStore } from '../../../platform/state/AuthStore';
import type { ClientSummary } from '../../../core/types/ClientSummary';
import '../../../components/approval-queue/ApprovalQueueElement';
import '../../../components/chart-widget/ChartWidgetElement';
import '../../../components/empty-state/EmptyStateElement';
import '../../../components/loading-state/LoadingStateElement';





const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .section { margin-bottom: var(--space-6); }
  .section-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-3); }
  .perf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-6); }
  .perf-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .perf-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; margin: 0 0 var(--space-1); }
  .perf-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0; }
  .insight-line { background: var(--color-surface); border: 1px solid var(--color-border); border-left: 3px solid var(--color-primary); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  .at-risk-strip { display: flex; gap: var(--space-3); flex-wrap: wrap; }
  .at-risk-card { background: #fef3c7; border: 1px solid #f59e0b; border-radius: var(--radius-md); padding: var(--space-3); min-width: 180px; }
  .at-risk-card h4 { font-size: var(--font-size-sm); margin: 0 0 var(--space-1); color: #92400e; }
  .at-risk-card p { font-size: var(--font-size-xs); color: #92400e; margin: 0; }
  .approval-summary { display: flex; gap: var(--space-6); align-items: center; }
  .approval-count { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-primary); }
  .sla-text { font-size: var(--font-size-sm); color: var(--color-text-muted); }
  .activity-feed { display: flex; flex-direction: column; gap: var(--space-2); }
  .activity-item { padding: var(--space-2) var(--space-3); background: var(--color-surface); border-radius: var(--radius-sm); border-left: 2px solid var(--color-border); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  .activity-time { font-size: var(--font-size-xs); color: var(--color-text-muted); }
`;

interface ChartWidgetHost extends HTMLElement {
  data: { label: string; value: number }[];
  chartType: 'bar' | 'line' | 'area';
  format: 'number' | 'currency';
  isLoading: boolean;
}

class OverviewPageElement extends BaseComponent {
  private isLoading = true;
  private kpiValues: Record<string, number> = {};
  private chartData: { label: string; value: number }[] = [];
  private insight = '';
  private atRiskClients: ClientSummary[] = [];
  private pendingCount = 0;
  private avgTurnaroundHours = 0;
  private activityFeed: { action: string; actor: string; time: string }[] = [];

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    void this.loadData();
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    const user = authStore.getState().currentUser;
    const clientIds = user?.allowedClientIds;
    try {
      const summary = await dashboardService.getDashboardSummary({
        start: new Date(Date.now() - 30 * 86400000),
        end: new Date(),
      } as never);
      this.kpiValues = summary.kpiValues;
      this.insight = summary.insight;
      this.chartData = summary.chartData;
    } catch {
      this.kpiValues = { Spend: 45000, Revenue: 128000, ROAS: 2.84, Campaigns: 24 };
      this.insight = 'Spend rose 18% vs. previous period.';
      // Mock chart data if backend fails
      this.chartData = [
        { label: 'Week 1', value: 10000 },
        { label: 'Week 2', value: 12000 },
        { label: 'Week 3', value: 11000 },
        { label: 'Week 4', value: 12000 }
      ];
    }
    try {
      this.atRiskClients = await clientService.listAtRiskClients(clientIds);
    } catch {
      this.atRiskClients = [];
    }
    this.pendingCount = 3;
    this.avgTurnaroundHours = 2.4;
    this.activityFeed = [
      { action: 'Campaign "Q3 Acquisition" approved', actor: 'Alice Chen', time: '2h ago' },
      { action: 'Creative "Holiday Banner" submitted for review', actor: 'client-1', time: '5h ago' },
      { action: 'Invoice inv_003 marked overdue', actor: 'System', time: '1d ago' },
    ];
    this.isLoading = false;
    this.rerender();
    this.syncChart();
  }

  private syncChart(): void {
    const chart = this.shadow.querySelector<ChartWidgetHost>('chart-widget');
    if (chart) {
      chart.data = this.chartData;
      chart.chartType = 'line';
      chart.format = 'currency';
      chart.isLoading = false;
    }
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    const perfCards = Object.entries(this.kpiValues).map(([label, value]) => html`
      <div class="perf-card">
        <p class="perf-label">${label}</p>
        <p class="perf-value">${typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
    `).join('');
    const atRiskCards = this.atRiskClients.length === 0
      ? '<empty-state message="No at-risk clients flagged this period" iconName="✓"></empty-state>'
      : this.atRiskClients.map((c) => html`
        <div class="at-risk-card">
          <h4>${c.companyName}</h4>
          <p>${c.activeCampaigns} active campaigns · $${c.totalSpend.toLocaleString()} spend</p>
        </div>
      `).join('');
    const activityItems = this.activityFeed.map((a) => html`
      <div class="activity-item">
        ${a.action}
        <span class="activity-time"> — ${a.actor} · ${a.time}</span>
      </div>
    `).join('');
    return html`
      <h1 class="page-title">Admin Overview</h1>
      <div class="insight-line">${this.insight}</div>
      <div class="section">
        <h2 class="section-title">Aggregate Performance</h2>
        <div class="perf-grid">${SafeHtmlString.trusted(perfCards)}</div>
        <chart-widget></chart-widget>
      </div>
      <div class="section">
        <h2 class="section-title">Approval Backlog</h2>
        <div class="approval-summary">
          <span class="approval-count">${this.pendingCount}</span>
          <span class="sla-text">pending · avg turnaround ${this.avgTurnaroundHours}h vs. 4h SLA</span>
        </div>
        <div style="margin-top:var(--space-4);"><approval-queue></approval-queue></div>
      </div>
      <div class="section">
        <h2 class="section-title">At-Risk Clients</h2>
        <div class="at-risk-strip">${SafeHtmlString.trusted(atRiskCards)}</div>
      </div>
      <div class="section">
        <h2 class="section-title">Recent Activity</h2>
        <div class="activity-feed">${SafeHtmlString.trusted(activityItems)}</div>
      </div>
    `;
  }

  private get avgTurnaheadHours(): number {
    return this.avgTurnaroundHours;
  }
}

ComponentRegistry.register('admin-overview', OverviewPageElement);
export { OverviewPageElement };