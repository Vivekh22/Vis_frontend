/**
 * StepGetStarted.ts — pages/client/registration/steps/
 *
 * Step 1 of the registration wizard. Single email/ID field + "Get Connected" button.
 * Validates non-empty + basic email format.
 *
 * Emits:
 *   step-data-changed   { data: Partial<RegistrationFormData> }
 *   step-validity-changed { isValid: boolean }
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { isNotEmpty, isValidEmail } from '../../../../utils/validators';
import type { RegistrationFormData, StepComponent } from '../registration-types';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .step-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-6); }
  .field-group { display: flex; flex-direction: column; gap: var(--space-4); max-width: 400px; }
`;

class StepGetStarted extends BaseComponent implements StepComponent {
  private _data: RegistrationFormData = { emailOrId: '' } as unknown as RegistrationFormData;
  private _isValid = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: RegistrationFormData) {
    this._data = { ...value };
    if (this.isConnected) this.syncFieldValues();
  }
  public get data(): RegistrationFormData { return this._data; }

  protected onMount(): void {
    this.syncFieldValues();
    this.shadow.addEventListener('value-changed', this.handleValueChanged);
  }
  protected onUnmount(): void {
    this.shadow.removeEventListener('value-changed', this.handleValueChanged);
  }

  private syncFieldValues(): void {
    const field = this.shadow.querySelector<HTMLElement & { value: string }>('[data-field-name="emailOrId"]');
    if (field) field.value = this._data.emailOrId;
  }

  private handleValueChanged = (event: Event): void => {
    const target = event.target as HTMLElement;
    const fieldName = target.getAttribute('data-field-name');
    if (!fieldName) return;
    const value = (event as CustomEvent<string>).detail;
    (this._data as unknown as Record<string, unknown>)[fieldName] = value;
    this.validateAndEmit();
  };

  private validateAndEmit(): void {
    const valid = isNotEmpty(this._data.emailOrId) && isValidEmail(this._data.emailOrId);
    const field = this.shadow.querySelector<HTMLElement & { errorMessage: string | null }>('[data-field-name="emailOrId"]');
    if (field) field.errorMessage = isNotEmpty(this._data.emailOrId) && !isValidEmail(this._data.emailOrId) ? 'Enter a valid email address' : null;
    if (valid !== this._isValid) {
      this._isValid = valid;
    }
    this.emit('step-data-changed', { data: { emailOrId: this._data.emailOrId } });
    this.emit('step-validity-changed', { isValid: this._isValid });
  }

  protected renderTemplate(): string {
    return html`
      <h2 class="step-title">Get Connected</h2>
      <p class="step-subtitle">Enter your email to get started.</p>
      <div class="field-group">
        ${SafeHtmlString.trusted(`<text-field data-field-name="emailOrId" label="Email or User ID"></text-field>`)}
      </div>
    `;
  }
}

ComponentRegistry.register('step-get-started', StepGetStarted);
export { StepGetStarted };