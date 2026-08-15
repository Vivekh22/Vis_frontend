/**
 * StepPersonalBusinessInfo.ts — pages/client/registration/steps/
 *
 * Step 2 of the registration wizard. Name, Last Name, Email, Business Name,
 * Business Phone, Agency fields.
 *
 * Required: firstName, lastName, email, businessName, businessPhone.
 * Optional: agency (assumption — spec doesn't explicitly state; made the more
 * permissive choice per project convention).
 *
 * Emits:
 *   step-data-changed   { data: Partial<RegistrationFormData> }
 *   step-validity-changed { isValid: boolean }
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { isNotEmpty, isValidEmail, isValidPhone } from '../../../../utils/validators';
import type { RegistrationFormData, StepComponent } from '../registration-types';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .step-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-6); }
  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); max-width: 600px; }
  .field-grid text-field { grid-column: span 1; }
  .field-grid text-field.full { grid-column: span 2; }
  @media (max-width: 600px) { .field-grid { grid-template-columns: 1fr; } .field-grid text-field.full { grid-column: span 1; } }
`;

const FIELDS = ['firstName', 'lastName', 'email', 'businessName', 'businessPhone', 'agency'] as const;

class StepPersonalBusinessInfo extends BaseComponent implements StepComponent {
  private _data: RegistrationFormData = {} as RegistrationFormData;
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
    for (const f of FIELDS) {
      const field = this.shadow.querySelector<HTMLElement & { value: string }>(`[data-field-name="${f}"]`);
      if (field) field.value = (this._data as unknown as Record<string, string>)[f] ?? '';
    }
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
    const required = ['firstName', 'lastName', 'email', 'businessName', 'businessPhone'];
    const allFilled = required.every((f) => isNotEmpty((this._data as unknown as Record<string, string>)[f] ?? ''));
    const emailOk = isValidEmail(this._data.email);
    const phoneOk = isValidPhone(this._data.businessPhone);
    const valid = allFilled && emailOk && phoneOk;

    this.setFieldError('email', isNotEmpty(this._data.email) && !emailOk ? 'Enter a valid email' : null);
    this.setFieldError('businessPhone', isNotEmpty(this._data.businessPhone) && !phoneOk ? 'Enter a valid phone' : null);

    if (valid !== this._isValid) this._isValid = valid;
    this.emit('step-data-changed', { data: { firstName: this._data.firstName, lastName: this._data.lastName, email: this._data.email, businessName: this._data.businessName, businessPhone: this._data.businessPhone, agency: this._data.agency } });
    this.emit('step-validity-changed', { isValid: this._isValid });
  }

  private setFieldError(fieldName: string, error: string | null): void {
    const field = this.shadow.querySelector<HTMLElement & { errorMessage: string | null }>(`[data-field-name="${fieldName}"]`);
    if (field) field.errorMessage = error;
  }

  protected renderTemplate(): string {
    const fieldHtml = (name: string, label: string, full = false) =>
      `<text-field data-field-name="${name}" label="${label}"${full ? ' class="full"' : ''}></text-field>`;
    return html`
      <h2 class="step-title">Personal & Business Info</h2>
      <p class="step-subtitle">Tell us about yourself and your business.</p>
      <div class="field-grid">
        ${SafeHtmlString.trusted(fieldHtml('firstName', 'First Name'))}
        ${SafeHtmlString.trusted(fieldHtml('lastName', 'Last Name'))}
        ${SafeHtmlString.trusted(fieldHtml('email', 'Email', true))}
        ${SafeHtmlString.trusted(fieldHtml('businessName', 'Business Name'))}
        ${SafeHtmlString.trusted(fieldHtml('businessPhone', 'Business Phone'))}
        ${SafeHtmlString.trusted(fieldHtml('agency', 'Agency (optional)', true))}
      </div>
    `;
  }
}

ComponentRegistry.register('step-personal-business', StepPersonalBusinessInfo);
export { StepPersonalBusinessInfo };