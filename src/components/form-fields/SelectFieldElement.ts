/**
 * SelectFieldElement.ts — components/form-fields/
 *
 * Purpose:
 *   A token-styled select input wrapper with label, value getter/setter,
 *   options, validation-error display, and 'value-changed' event emission.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

export interface SelectOption {
  value: string;
  label: string;
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .field { display: flex; flex-direction: column; gap: var(--space-1); }
  .label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  .select {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    background: var(--color-bg);
    color: var(--color-text-primary);
  }
  .select:focus { outline: none; border-color: var(--color-primary); }
  .select--error { border-color: var(--color-danger); }
  .error-msg { font-size: var(--font-size-xs); color: var(--color-danger); }
`;

class SelectFieldElement extends BaseComponent {
  private _value = '';
  private _label = '';
  private _options: SelectOption[] = [];
  private _errorMessage: string | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set value(v: string) { this._value = v; this.rerender(); }
  public get value(): string { return this._value; }
  public set label(v: string) { this._label = v; this.rerender(); }
  public set options(v: SelectOption[]) { this._options = v; this.rerender(); }
  public set errorMessage(v: string | null) { this._errorMessage = v; this.rerender(); }

  protected onMount(): void { this.shadow.addEventListener('change', this.handleChange); }
  protected onUnmount(): void { this.shadow.removeEventListener('change', this.handleChange); }

  static get observedAttributes() {
    return ['label', 'value', 'options'];
  }

  attributeChangedCallback(name: string, _oldVal: string, newVal: string): void {
    if (name === 'label') {
      this._label = newVal;
      this.rerender();
    } else if (name === 'value') {
      this._value = newVal;
      this.rerender();
    } else if (name === 'options') {
      try {
        this._options = JSON.parse(newVal);
      } catch (e) {
        console.error('Invalid options JSON', newVal);
      }
      this.rerender();
    }
  }

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'select') {
      this._value = (target as HTMLSelectElement).value;
      this.emit('value-changed', this._value);
    }
  };

  protected renderTemplate(): string {
    const selectClass = this._errorMessage ? 'select select--error' : 'select';
    const options = this._options.map((opt) => {
      const selected = opt.value === this._value ? 'selected' : '';
      return `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
    }).join('');
    return html`
      <div class="field">
        ${this._label ? SafeHtmlString.trusted(`<label class="label">${this._label}</label>`) : ''}
        <select class="${selectClass}" data-field="select">${SafeHtmlString.trusted(options)}</select>
        ${this._errorMessage ? SafeHtmlString.trusted(`<span class="error-msg">${this._errorMessage}</span>`) : ''}
      </div>
    `;
  }
}

ComponentRegistry.register('select-field', SelectFieldElement);
export { SelectFieldElement };
