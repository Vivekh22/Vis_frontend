/**
 * PeriodSelectorElement.ts — components/period-selector/
 *
 * Purpose:
 *   Renders the Today/Yesterday/7D/30D/This Month/Custom period-selector as buttons.
 *   When "Custom" is selected, renders two date input fields. On any
 *   selection change, emits 'period-changed' with the resulting DateRange.
 *
 * Uses DateRange from core/value-objects/DateRange.ts — the real immutable
 * value object class.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { DateRange } from '../../core/value-objects/DateRange';
import type { PeriodOption } from '../../core/value-objects/DateRange';

export type { PeriodOption } from '../../core/value-objects/DateRange';

const STYLES = `
  :host { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-body); flex-wrap: wrap; }
  .period-buttons {
    display: flex;
    gap: var(--space-1);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 2px;
  }
  .period-btn {
    padding: var(--space-1) var(--space-3);
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    background: transparent;
    color: var(--color-text-primary);
    cursor: pointer;
  }
  .period-btn.active {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
  }
  .period-btn:hover:not(.active) {
    background: var(--color-bg);
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

const OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: 'this-month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

class PeriodSelectorElement extends BaseComponent {
  private _selectedPeriod: PeriodOption = '7d';
  private customStart = '';
  private customEnd = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set selectedPeriod(value: PeriodOption) {
    if (this._selectedPeriod === value) return;
    this._selectedPeriod = value;
    this.rerender();
    if (value !== 'custom') { this.emit('period-changed', computePresetRange(value)); }
  }
  public get selectedPeriod(): PeriodOption { return this._selectedPeriod; }

  protected onMount(): void { this.shadow.addEventListener('click', this.handleClick); this.shadow.addEventListener('change', this.handleChange); }
  protected onUnmount(): void { this.shadow.removeEventListener('click', this.handleClick); this.shadow.removeEventListener('change', this.handleChange); }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const btn = target.closest('[data-period]');
    if (btn) {
      const value = btn.getAttribute('data-period') as PeriodOption;
      this._selectedPeriod = value;
      this.rerender();
      if (value !== 'custom') {
        this.emit('period-changed', computePresetRange(value));
      } else if (this.customStart && this.customEnd) {
        this.emitCustomPeriod();
      }
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (field === 'custom-start') {
      this.customStart = (target as HTMLInputElement).value;
    } else if (field === 'custom-end') {
      this.customEnd = (target as HTMLInputElement).value;
    }
    if (this._selectedPeriod === 'custom' && this.customStart && this.customEnd) {
      this.emitCustomPeriod();
    }
  };

  private emitCustomPeriod(): void {
    const start = new Date(this.customStart);
    const end = new Date(this.customEnd);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      this.emit('period-changed', new DateRange(startOfDay(start), endOfDay(end)));
    }
  }

  protected renderTemplate(): string {
    const isCustom = this._selectedPeriod === 'custom';
    
    const buttonsHtml = OPTIONS.map(opt => {
      const activeClass = this._selectedPeriod === opt.value ? 'active' : '';
      return html`<button type="button" class="period-btn ${activeClass}" data-period="${opt.value}">${opt.label}</button>`;
    }).join('');

    return html`
      <div class="period-buttons">
        ${SafeHtmlString.trusted(buttonsHtml)}
      </div>
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