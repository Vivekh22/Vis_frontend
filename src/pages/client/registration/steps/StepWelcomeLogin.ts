/**
 * StepWelcomeLogin.ts — pages/client/registration/steps/
 *
 * Step 6 of the registration wizard — the one-time post-signup screen.
 * Explicitly NOT the standard login route (/login). This is a distinct
 * "Hey [Name], one more step" screen shown after registration is approved.
 *
 * On successful login here, navigates into the Dashboard (role-based redirect).
 *
 * This component is registered both as a wizard step AND as a standalone page
 * at /register/welcome — the RegistrationStatusPageElement's "Go to Dashboard"
 * action navigates to /register/welcome when the registration is approved.
 *
 * Emits:
 *   step-data-changed   { data: Partial<RegistrationFormData> }
 *   step-validity-changed { isValid: boolean }
 *
 * On "Login" button click, calls authService.login() and navigates based on
 * the returned user's role.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { isNotEmpty, isValidEmail } from '../../../../utils/validators';
import { navigate } from '../../../../utils/navigate';
import { authService } from '../../../../services';
import type { RegistrationFormData, StepComponent } from '../registration-types';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .welcome-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .welcome-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-6); }
  .field-grid { display: flex; flex-direction: column; gap: var(--space-4); max-width: 400px; }
  .login-btn {
    padding: var(--space-2) var(--space-4);
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    font-family: var(--font-body);
  }
  .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .error-banner { font-size: var(--font-size-sm); color: var(--color-danger); margin: 0; }
`;

class StepWelcomeLogin extends BaseComponent implements StepComponent {
  private _data: RegistrationFormData = {} as RegistrationFormData;
  private _isValid = false;
  private _loginEmail = '';
  private _loginPassword = '';
  private _loginError: string | null = null;
  private _isSubmitting = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: RegistrationFormData) {
    this._data = { ...value };
    this._loginEmail = value.securityEmail || value.emailOrId || value.email || '';
    if (this.isConnected) this.syncFieldValues();
  }
  public get data(): RegistrationFormData { return this._data; }

  protected onMount(): void {
    this.syncFieldValues();
    this.applyPasswordType();
    this.shadow.addEventListener('value-changed', this.handleValueChanged);
    this.shadow.addEventListener('click', this.handleClick);
  }
  protected onUnmount(): void {
    this.shadow.removeEventListener('value-changed', this.handleValueChanged);
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private syncFieldValues(): void {
    const emailField = this.shadow.querySelector<HTMLElement & { value: string }>('[data-field-name="loginEmail"]');
    if (emailField) emailField.value = this._loginEmail;
    const pwField = this.shadow.querySelector<HTMLElement & { value: string }>('[data-field-name="loginPassword"]');
    if (pwField) pwField.value = this._loginPassword;
    this.applyPasswordType();
  }

  private applyPasswordType(): void {
    const pwField = this.shadow.querySelector<HTMLElement & { inputType: string }>('[data-field-name="loginPassword"]');
    if (pwField) pwField.inputType = 'password';
  }

  private handleValueChanged = (event: Event): void => {
    const target = event.target as HTMLElement;
    const fieldName = target.getAttribute('data-field-name');
    if (!fieldName) return;
    const value = (event as CustomEvent<string>).detail;
    if (fieldName === 'loginEmail') this._loginEmail = value;
    if (fieldName === 'loginPassword') this._loginPassword = value;
    this.validateAndEmit();
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="login"]')) {
      void this.handleLogin();
    }
  };

  private async handleLogin(): Promise<void> {
    if (!this._isValid || this._isSubmitting) return;
    this._isSubmitting = true;
    this._loginError = null;
    this.rerender();
    try {
      const user = await authService.login(this._loginEmail, this._loginPassword);
      // Role-based redirect
      const role = user.role;
      if (role === 'admin') navigate('/admin/overview');
      else if (role === 'super-admin') navigate('/super-admin/overview');
      else navigate('/client/dashboard');
    } catch {
      this._loginError = 'Invalid email or password.';
    }
    this._isSubmitting = false;
    this.rerender();
  }

  private validateAndEmit(): void {
    const emailOk = isValidEmail(this._loginEmail);
    const pwOk = isNotEmpty(this._loginPassword);
    const valid = emailOk && pwOk;
    if (valid !== this._isValid) this._isValid = valid;
    this.emit('step-data-changed', { data: { securityEmail: this._loginEmail } });
    this.emit('step-validity-changed', { isValid: this._isValid });
  }

  protected renderTemplate(): string {
    const firstName = this._data.firstName || 'there';
    return html`
      <h2 class="welcome-title">Hey ${firstName}, one more step</h2>
      <p class="welcome-subtitle">Your registration is approved. Log in to access your dashboard.</p>
      <div class="field-grid">
        ${SafeHtmlString.trusted(`<text-field data-field-name="loginEmail" label="Email"></text-field>`)}
        ${SafeHtmlString.trusted(`<text-field data-field-name="loginPassword" label="Password"></text-field>`)}
        ${this._loginError ? SafeHtmlString.trusted(`<p class="error-banner">${this._loginError}</p>`) : ''}
        <button type="button" class="login-btn" data-action="login" ${this._isValid && !this._isSubmitting ? '' : 'disabled'}>${this._isSubmitting ? 'Logging in...' : 'Login'}</button>
      </div>
    `;
  }
}

ComponentRegistry.register('step-welcome-login', StepWelcomeLogin);
export { StepWelcomeLogin };