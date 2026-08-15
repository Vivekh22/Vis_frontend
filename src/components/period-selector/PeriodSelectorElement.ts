/**
 * PeriodSelectorElement.ts — components/period-selector/
 *
 * Purpose:
 *   Renders the Today/Yesterday/7D/30D/This Month/Custom period-selector.
 *   When "Custom" is selected, renders two date input fields. On any
 *   selection change, emits 'period-changed' with the resulting DateRange.
 *
 * Uses DateRange from core/value-objects/DateRange.ts — the real immutable
 * value object class (replaced Part 2's minimal stub in Part 3).
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { DateRange } from '../../core/value-objects/DateRange';
import type { PeriodOption } from '../../core/value-objects/DateRange';

export type { PeriodOption } from '../../core/value-objects/DateRange';

const STYLES = `
  :host { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-body); }
  .period-select {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    background: var(--color-bg);
    color: var(--color-text-primary);
  }
  .custom-range { display: inline-flex; align-items: center; gap: var(--space-1); }
  .date-input {
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
  }
`;

function startOfDay(d: Date): Date { const r = new Date(d); r.setHours(0,0,0,0); return r; }
function endOfDay(d: Date): Date { const r = new Date(d); r.setHours(23,59,59,999); return r; }

export function computePresetRange(period: Exclude<PeriodOption, 'custom'>): DateRange {
  return DateRange.fromPeriodOption(period);
}

class PeriodSelectorElement extends BaseComponent {
  private _selectedPeriod: PeriodOption = 'today';
  private customStart = '';
  private customEnd = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set selectedPeriod(value: PeriodOption) {
    this._selectedPeriod = value;
    this.rerender();
    if (value !== 'custom') { this.emit('period-changed', computePresetRange(value)); }
  }
  public get selectedPeriod(): PeriodOption { return this._selectedPeriod; }

  protected onMount(): void { this.shadow.addEventListener('change', this.handleChange); }
  protected onUnmount(): void { this.shadow.removeEventListener('change', this.handleChange); }

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (field === 'period') {
      const value = (target as HTMLSelectElement).value as PeriodOption;
      this._selectedPeriod = value;
      this.rerender();
      if (value !== 'custom') { this.emit('period-changed', computePresetRange(value)); }
    } else if (field === 'custom-start') {
      this.customStart = (target as HTMLInputElement).value;
    } else if (field === 'custom-end') {
      this.customEnd = (target as HTMLInputElement).value;
    }
    if (this._selectedPeriod === 'custom' && this.customStart && this.customEnd) {
      const start = new Date(this.customStart);
      const end = new Date(this.customEnd);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        this.emit('period-changed', new DateRange(startOfDay(start), endOfDay(end)));
      }
    }
  };

  protected renderTemplate(): string {
    const isCustom = this._selectedPeriod === 'custom';
    return html`
      <select class="period-select" data-field="period">
        <option value="today" ${this._selectedPeriod === 'today' ? 'selected' : ''}>Today</option>
        <option value="yesterday" ${this._selectedPeriod === 'yesterday' ? 'selected' : ''}>Yesterday</option>
        <option value="7d" ${this._selectedPeriod === '7d' ? 'selected' : ''}>7D</option>
        <option value="30d" ${this._selectedPeriod === '30d' ? 'selected' : ''}>30D</option>
        <option value="this-month" ${this._selectedPeriod === 'this-month' ? 'selected' : ''}>This Month</option>
        <option value="custom" ${this._selectedPeriod === 'custom' ? 'selected' : ''}>Custom</option>
      </select>
      ${isCustom ? SafeHtmlString.trusted(this.renderCustomRange()) : ''}
    `;
  }

  private renderCustomRange(): string {
    return html`
      <span class="custom-range">
        <input type="date" class="date-input" data-field="custom-start" value="${this.customStart}">
        <span>–</span>
        <input type="date" class="date-input" data-field="custom-end" value="${this.customEnd}">
      </span>
    `;
  }
}

ComponentRegistry.register('period-selector', PeriodSelectorElement);
export { PeriodSelectorElement };