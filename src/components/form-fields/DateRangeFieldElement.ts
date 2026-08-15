/**
 * DateRangeFieldElement.ts — components/form-fields/
 *
 * Purpose:
 *   Composes two date inputs into one cohesive token-styled component,
 *   emitting a DateRange value via 'value-changed'.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { DateRange } from '../../core/value-objects/DateRange';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .field { display: flex; flex-direction: column; gap: var(--space-1); }
  .label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  .range { display: inline-flex; align-items: center; gap: var(--space-2); }
  .date-input {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    background: var(--color-bg);
    color: var(--color-text-primary);
  }
  .date-input:focus { outline: none; border-color: var(--color-primary); }
  .date-input--error { border-color: var(--color-danger); }
  .error-msg { font-size: var(--font-size-xs); color: var(--color-danger); }
`;

class DateRangeFieldElement extends BaseComponent {
  private _value: DateRange | null = null;
  private _label = '';
  private _errorMessage: string | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set value(v: DateRange | null) { this._value = v; this.rerender(); }
  public get value(): DateRange | null { return this._value; }
  public set label(v: string) { this._label = v; this.rerender(); }
  public set errorMessage(v: string | null) { this._errorMessage = v; this.rerender(); }

  protected onMount(): void { this.shadow.addEventListener('change', this.handleChange); }
  protected onUnmount(): void { this.shadow.removeEventListener('change', this.handleChange); }

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (field !== 'start' && field !== 'end') return;

    const inputEl = target as HTMLInputElement;
    const current = this._value ?? new DateRange(new Date(), new Date());
    const newDate = new Date(inputEl.value);
    if (isNaN(newDate.getTime())) return;

    const newRange = new DateRange(
      field === 'start' ? newDate : current.start,
      field === 'end' ? newDate : current.end,
    );
    this._value = newRange;
    this.emit('value-changed', newRange);
  };

  private formatDate(date: Date | null): string {
    if (!date) return '';
    return date.toISOString().split('T')[0] ?? '';
  }

  protected renderTemplate(): string {
    const inputClass = this._errorMessage ? 'date-input date-input--error' : 'date-input';
    const start = this._value ? this.formatDate(this._value.start) : '';
    const end = this._value ? this.formatDate(this._value.end) : '';
    return html`
      <div class="field">
        ${this._label ? SafeHtmlString.trusted(`<label class="label">${this._label}</label>`) : ''}
        <div class="range">
          <input type="date" class="${inputClass}" data-field="start" value="${start}">
          <span>–</span>
          <input type="date" class="${inputClass}" data-field="end" value="${end}">
        </div>
        ${this._errorMessage ? SafeHtmlString.trusted(`<span class="error-msg">${this._errorMessage}</span>`) : ''}
      </div>
    `;
  }
}

ComponentRegistry.register('date-range-field', DateRangeFieldElement);
export { DateRangeFieldElement };