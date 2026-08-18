/**
 * SuggestionBusActivityPageElement.ts — pages/super-admin/taranga-governance/suggestion-bus-activity/
 *
 * Aggregated stats — suggestions generated, accepted vs. dismissed,
 * auto-executed count for opted-in clients. Platform-level view of the
 * AI-suggestion feature. Mock-backed; will have real data once the
 * client-side suggestion feature is built in a later part.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { suggestionBusService } from '../../../../services';
import type { SuggestionBusStats } from '../../../../services/SuggestionBusService';
import '../../../../components/empty-state/EmptyStateElement';
import '../../../../components/loading-state/LoadingStateElement';



const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
  @media (max-width: 768px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  .kpi-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); text-align: center; }
  .kpi-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
  .kpi-label { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; margin-top: var(--space-1); }
  .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .panel-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
`;

class SuggestionBusActivityPageElement extends BaseComponent {
  private stats: SuggestionBusStats | null = null;
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
      this.stats = await suggestionBusService.getStats();
    } catch {
      this.stats = null;
    }
    this.isLoading = false;
    this.rerender();
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    if (!this.stats) {
      return '<empty-state message="No suggestion bus data available."></empty-state>';
    }
    const categoryRows = this.stats.byCategory.map((c) => html`<tr>
      <td>${c.category}</td>
      <td>${c.generated.toLocaleString()}</td>
      <td>${c.accepted.toLocaleString()}</td>
      <td>${c.generated > 0 ? Math.round((c.accepted / c.generated) * 100) : 0}%</td>
    </tr>`).join('');

    return html`
      <h1 class="page-title">Suggestion Bus Activity</h1>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-value">${this.stats.totalGenerated.toLocaleString()}</div><div class="kpi-label">Generated</div></div>
        <div class="kpi-card"><div class="kpi-value">${this.stats.accepted.toLocaleString()}</div><div class="kpi-label">Accepted</div></div>
        <div class="kpi-card"><div class="kpi-value">${this.stats.dismissed.toLocaleString()}</div><div class="kpi-label">Dismissed</div></div>
        <div class="kpi-card"><div class="kpi-value">${this.stats.autoExecuted.toLocaleString()}</div><div class="kpi-label">Auto-Executed</div></div>
      </div>
      <div class="panel">
        <p class="panel-title">Acceptance Rate: ${this.stats.acceptanceRate}%</p>
      </div>
      <div class="panel">
        <p class="panel-title">By Category</p>
        <table><thead><tr><th>Category</th><th>Generated</th><th>Accepted</th><th>Acceptance Rate</th></tr></thead><tbody>${SafeHtmlString.trusted(categoryRows)}</tbody></table>
      </div>
    `;
  }
}

ComponentRegistry.register('super-admin-suggestion-bus-activity', SuggestionBusActivityPageElement);
export { SuggestionBusActivityPageElement };