/**
 * KpiMetricPickerElement.ts — components/kpi-metric-picker/
 *
 * Purpose:
 *   Renders a "+" control opening a checklist of metrics (Impressions, Clicks,
 *   Installs, Spend, Revenue, eCPM, eCPI, eCPC, eCPA, Clear Rate, Win Rate,
 *   CTR, ROAS, Bids). Selected metrics render as removable chips.
 *
 *   Emits 'metrics-changed' with the updated selection array whenever a
 *   metric is toggled on/off or a chip is removed.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

const DEFAULT_METRICS = [
  'Impressions', 'Clicks', 'Installs', 'Spend', 'Revenue',
  'eCPM', 'eCPI', 'eCPC', 'eCPA', 'Clear Rate', 'Win Rate', 'CTR', 'ROAS', 'Bids',
];

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .container { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: var(--color-surface-2);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  .chip-remove {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: 1;
    padding: 0;
  }
  .chip-remove:hover { color: var(--color-danger); }
  .add-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  .checklist {
    position: relative;
    display: inline-block;
  }
  .checklist-panel {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: var(--space-1);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: var(--space-2);
    min-width: 180px;
    z-index: 100;
    max-height: 240px;
    overflow-y: auto;
  }
  .checklist-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    cursor: pointer;
  }
  .checklist-item:hover { background: var(--color-surface); }
  .checklist-item input { pointer-events: none; }
`;

class KpiMetricPickerElement extends BaseComponent {
  private _availableMetrics: string[] = DEFAULT_METRICS;
  private _selectedMetrics: string[] = [];
  private isChecklistOpen = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set availableMetrics(value: string[]) {
    this._availableMetrics = value;
    this.rerender();
  }

  public set selectedMetrics(value: string[]) {
    this._selectedMetrics = value;
    this.rerender();
  }

  public get selectedMetrics(): string[] {
    return this._selectedMetrics;
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-action="toggle-checklist"]')) {
      this.isChecklistOpen = !this.isChecklistOpen;
      this.rerender();
      return;
    }

    const removeEl = target.closest('[data-action="remove-chip"]');
    if (removeEl) {
      const metric = removeEl.getAttribute('data-metric');
      if (metric) {
        this._selectedMetrics = this._selectedMetrics.filter((m) => m !== metric);
        this.emit('metrics-changed', [...this._selectedMetrics]);
        this.rerender();
      }
      return;
    }

    const itemEl = target.closest('[data-action="toggle-metric"]');
    if (itemEl) {
      const metric = itemEl.getAttribute('data-metric');
      if (metric) {
        if (this._selectedMetrics.includes(metric)) {
          this._selectedMetrics = this._selectedMetrics.filter((m) => m !== metric);
        } else {
          this._selectedMetrics = [...this._selectedMetrics, metric];
        }
        this.emit('metrics-changed', [...this._selectedMetrics]);
        this.rerender();
      }
    }
  };

  protected renderTemplate(): string {
    const chips = this._selectedMetrics.map((metric) => {
      return html`
        <span class="chip">
          ${metric}
          <button class="chip-remove" data-action="remove-chip" data-metric="${metric}" type="button">×</button>
        </span>
      `;
    }).join('');

    const checklistItems = this._availableMetrics.map((metric) => {
      const isChecked = this._selectedMetrics.includes(metric);
      return html`
        <div class="checklist-item" data-action="toggle-metric" data-metric="${metric}">
          <input type="checkbox" ${isChecked ? 'checked' : ''} readonly>
          ${metric}
        </div>
      `;
    }).join('');

    return html`
      <div class="container">
        ${SafeHtmlString.trusted(chips)}
        <div class="checklist">
          <button class="add-btn" data-action="toggle-checklist" type="button">+ Add Metric</button>
          ${this.isChecklistOpen ? SafeHtmlString.trusted(`<div class="checklist-panel">${checklistItems}</div>`) : ''}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('kpi-metric-picker', KpiMetricPickerElement);
export { KpiMetricPickerElement };