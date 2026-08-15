/**
 * StepAccountSecurity.ts — pages/client/registration/steps/
 *
 * Step 5 of the registration wizard. Email (pre-filled from Step 1), OTP,
 * Password, Confirm Password.
 *
 * Email is pre-filled from Step 1's emailOrId — duplicate email fields are
 * reconciled rather than asking twice.
 *
 * Password validation rule (de facto contract the backend must also enforce):
 *   - Minimum 8 characters
 *   - At least 1 uppercase letter
 *   - At least 1 lowercase letter
 *   - At least 1 digit
 *
 * Uses TextFieldElement's password inputType (added in Part 7 — this was a
 * real Part 2 gap: TextFieldElement only supported type="text" before).
 *
 * Emits:
 *   step-data-changed   { data: Partial<RegistrationFormData> }
 *   step-validity-changed { isValid: boolean }
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { isNotEmpty, isValidEmail, isValidPassword, PASSWORD_RULE } from '../../../../utils/validators';
import type { RegistrationFormData, StepComponent } from '../registration-types';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .step-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-6); }
  .field-grid { display: flex; flex-direction: column; gap: var(--space-4); max-width: 400px; }
  .password-hint { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; }
`;

const FIELDS = ['securityEmail', 'otp', 'password', 'confirmPassword'] as const;

class StepAccountSecurity extends BaseComponent implements StepComponent {
  private _data: RegistrationFormData = {} as RegistrationFormData;
  private _isValid = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: RegistrationFormData) {
    // Pre-fill securityEmail from Step 1's emailOrId if not already set
    this._data = {
      ...value,
      securityEmail: value.securityEmail || value.emailOrId || value.email || '',
    };
    if (this.isConnected) this.syncFieldValues();
  }
  public get data(): RegistrationFormData { return this._data; }

  protected onMount(): void {
    this.syncFieldValues();
    this.applyPasswordTypes();
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
    this.applyPasswordTypes();
  }

  private applyPasswordTypes(): void {
    const passwordField = this.shadow.querySelector<HTMLElement & { inputType: string }>(`[data-field-name="password"]`);
    if (passwordField) passwordField.inputType = 'password';
    const confirmField = this.shadow.querySelector<HTMLElement & { inputType: string }>(`[data-field-name="confirmPassword"]`);
    if (confirmField) confirmField.inputType = 'password';
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
    const emailOk = isValidEmail(this._data.securityEmail);
    const otpOk = isNotEmpty(this._data.otp);
    const passwordOk = isValidPassword(this._data.password);
    const matchOk = this._data.password === this._data.confirmPassword && isNotEmpty(this._data.confirmPassword);
    const valid = emailOk && otpOk && passwordOk && matchOk;

    this.setFieldError('securityEmail', isNotEmpty(this._data.securityEmail) && !emailOk ? 'Enter a valid email' : null);
    this.setFieldError('password', isNotEmpty(this._data.password) && !passwordOk ? PASSWORD_RULE : null);
    this.setFieldError('confirmPassword', isNotEmpty(this._data.confirmPassword) && !matchOk ? 'Passwords do not match' : null);

    if (valid !== this._isValid) this._isValid = valid;
    this.emit('step-data-changed', { data: { securityEmail: this._data.securityEmail, otp: this._data.otp, password: this._data.password, confirmPassword: this._data.confirmPassword } });
    this.emit('step-validity-changed', { isValid: this._isValid });
  }

  private setFieldError(fieldName: string, error: string | null): void {
    const field = this.shadow.querySelector<HTMLElement & { errorMessage: string | null }>(`[data-field-name="${fieldName}"]`);
    if (field) field.errorMessage = error;
  }

  protected renderTemplate(): string {
    const fieldHtml = (name: string, label: string) =>
      `<text-field data-field-name="${name}" label="${label}"></text-field>`;
    return html`
      <h2 class="step-title">Account Security</h2>
      <p class="step-subtitle">Secure your account with a password.</p>
      <div class="field-grid">
        ${SafeHtmlString.trusted(fieldHtml('securityEmail', 'Email'))}
        ${SafeHtmlString.trusted(fieldHtml('otp', 'OTP Code'))}
        ${SafeHtmlString.trusted(fieldHtml('password', 'Password'))}
        <p class="password-hint">${PASSWORD_RULE}</p>
        ${SafeHtmlString.trusted(fieldHtml('confirmPassword', 'Confirm Password'))}
      </div>
    `;
  }
}

ComponentRegistry.register('step-account-security', StepAccountSecurity);
export { StepAccountSecurity };