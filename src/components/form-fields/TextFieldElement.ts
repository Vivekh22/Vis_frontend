/**
 * TextFieldElement.ts — components/form-fields/
 *
 * Purpose:
 *   A token-styled text input wrapper with label, value getter/setter,
 *   validation-error display, and 'value-changed' event emission.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .field { display: flex; flex-direction: column; gap: var(--space-1); }
  .label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
  .input {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    background: var(--color-bg);
    color: var(--color-text-primary);
  }
  .input:focus { outline: none; border-color: var(--color-primary); }
  .input--error { border-color: var(--color-danger); }
  .error-msg { font-size: var(--font-size-xs); color: var(--color-danger); }
`;

class TextFieldElement extends BaseComponent {
  private _value = '';
  private _label = '';
  private _errorMessage: string | null = null;
  private _inputType: 'text' | 'password' = 'text';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set value(v: string) { this._value = v; this.rerender(); }
  public get value(): string { return this._value; }
  public set label(v: string) { this._label = v; this.rerender(); }
  public set errorMessage(v: string | null) { this._errorMessage = v; this.rerender(); }
  public set inputType(v: 'text' | 'password') { this._inputType = v; this.rerender(); }

  protected onMount(): void { this.shadow.addEventListener('input', this.handleInput); }
  protected onUnmount(): void { this.shadow.removeEventListener('input', this.handleInput); }

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'text') {
      this._value = (target as HTMLInputElement).value;
      this.emit('value-changed', this._value);
    }
  };

  protected renderTemplate(): string {
    const inputClass = this._errorMessage ? 'input input--error' : 'input';
    return html`
      <div class="field">
        ${this._label ? SafeHtmlString.trusted(`<label class="label">${this._label}</label>`) : ''}
        <input type="${this._inputType}" class="${inputClass}" data-field="text" value="${this._value}">
        ${this._errorMessage ? SafeHtmlString.trusted(`<span class="error-msg">${this._errorMessage}</span>`) : ''}
      </div>
    `;
  }
}

ComponentRegistry.register('text-field', TextFieldElement);
export { TextFieldElement };