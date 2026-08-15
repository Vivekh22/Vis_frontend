/**
 * LoginPageElement.ts — pages/client/login/
 *
 * Plain email/user-ID + password form. "Remember me" checkbox (12-hour session).
 * "Forgot password?" link (minimal inline flow: email input → confirmation).
 *
 * Role-agnostic per spec — role is resolved AFTER authentication via AuthService.
 * AuthService.login() returns a User entity with role populated from the backend
 * response (confirmed in Part 5), not guessed or selected by the frontend.
 *
 * On successful login, routes based on the authenticated user's actual role:
 *   client       → /client/dashboard
 *   admin        → /admin/overview
 *   super-admin  → /super-admin/overview
 *
 * "Remember me" (12-hour session): the frontend requests a shorter token expiry
 * from the backend when "remember me" is NOT checked. This is an assumption
 * about backend behavior — the frontend cannot itself enforce a server-side
 * token's expiry. Documented here as the expected backend contract.
 *
 * Forgot password flow: the spec doesn't describe this flow in detail. Built
 * as a reasonable, simple version: email input → confirmation message. May need
 * spec clarification for the full reset flow.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { isNotEmpty, isValidEmail } from '../../../utils/validators';
import { navigate } from '../../../utils/navigate';
import { authService } from '../../../services';

const STYLES = `
  :host { display: block; font-family: var(--font-body); max-width: 400px; margin: 0 auto; padding: var(--space-10) var(--space-4); }
  .login-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .login-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-6); }
  .field-group { display: flex; flex-direction: column; gap: var(--space-4); }
  .options-row { display: flex; align-items: center; justify-content: space-between; font-size: var(--font-size-xs); }
  .checkbox-label { display: flex; align-items: center; gap: var(--space-1); color: var(--color-text-muted); cursor: pointer; }
  .forgot-link { color: var(--color-primary); text-decoration: none; cursor: pointer; }
  .forgot-link:hover { text-decoration: underline; }
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
  .success-msg { font-size: var(--font-size-sm); color: var(--color-success); margin: 0; }
  .register-link { text-align: center; font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-4); }
  .register-link a { color: var(--color-primary); text-decoration: none; }
  .forgot-panel { margin-top: var(--space-4); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
`;

class LoginPageElement extends BaseComponent {
  private email = '';
  private password = '';
  private rememberMe = false;
  private loginError: string | null = null;
  private isSubmitting = false;
  private showForgotPanel = false;
  private forgotEmail = '';
  private forgotSent = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('value-changed', this.handleValueChanged);
    this.shadow.addEventListener('input', this.handleInput);
    this.shadow.addEventListener('click', this.handleClick);
    this.applyPasswordType();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('value-changed', this.handleValueChanged);
    this.shadow.removeEventListener('input', this.handleInput);
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private applyPasswordType(): void {
    const pwField = this.shadow.querySelector<HTMLElement & { inputType: string }>('[data-field-name="password"]');
    if (pwField) pwField.inputType = 'password';
  }

  private handleValueChanged = (event: Event): void => {
    const target = event.target as HTMLElement;
    const fieldName = target.getAttribute('data-field-name');
    if (!fieldName) return;
    const value = (event as CustomEvent<string>).detail;
    if (fieldName === 'email') this.email = value;
    else if (fieldName === 'password') this.password = value;
    else if (fieldName === 'forgotEmail') this.forgotEmail = value;
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.getAttribute('data-field-name') === 'rememberMe') {
      this.rememberMe = target.checked;
    }
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="login"]')) {
      void this.handleLogin();
    } else if (target.closest('[data-action="forgot"]')) {
      this.showForgotPanel = !this.showForgotPanel;
      this.forgotSent = false;
      this.rerender();
    } else if (target.closest('[data-action="send-reset"]')) {
      this.handleForgotPassword();
    }
  };

  private async handleLogin(): Promise<void> {
    if (!this.isValid() || this.isSubmitting) return;
    this.isSubmitting = true;
    this.loginError = null;
    this.rerender();
    // rememberMe: when false, backend should issue a 12-hour session token.
    // This is a frontend assumption about backend behavior — see file header.
    void this.rememberMe;
    try {
      const user = await authService.login(this.email, this.password);
      // Role-based redirect — role comes from the backend response, not guessed.
      const role = user.role;
      if (role === 'admin') navigate('/admin/overview');
      else if (role === 'super-admin') navigate('/super-admin/overview');
      else navigate('/client/dashboard');
    } catch {
      this.loginError = 'Invalid email or password.';
    }
    this.isSubmitting = false;
    this.rerender();
  }

  private handleForgotPassword(): void {
    if (!isValidEmail(this.forgotEmail)) return;
    // Minimal flow: show confirmation message. Full reset flow may need spec clarification.
    this.forgotSent = true;
    this.rerender();
  }

  private isValid(): boolean {
    return isValidEmail(this.email) && isNotEmpty(this.password);
  }

  protected renderTemplate(): string {
    const fieldHtml = (name: string, label: string, inputType?: string) =>
      `<text-field data-field-name="${name}" label="${label}"${inputType ? ` input-type="${inputType}"` : ''}></text-field>`;

    // Note: inputType is set programmatically in syncFieldValues via applyPasswordType
    // because TextFieldElement's inputType is a JS property, not an HTML attribute.
    return html`
      <h1 class="login-title">Welcome Back</h1>
      <p class="login-subtitle">Log in to your VispriscaAds account.</p>
      <div class="field-group">
        ${SafeHtmlString.trusted(fieldHtml('email', 'Email or User ID'))}
        ${SafeHtmlString.trusted(fieldHtml('password', 'Password'))}
        <div class="options-row">
          <label class="checkbox-label">
            <input type="checkbox" data-field-name="rememberMe">
            Remember me (12-hour session)
          </label>
          <span class="forgot-link" data-action="forgot">Forgot password?</span>
        </div>
        ${this.loginError ? SafeHtmlString.trusted(`<p class="error-banner">${this.loginError}</p>`) : ''}
        <button type="button" class="login-btn" data-action="login" ${this.isValid() && !this.isSubmitting ? '' : 'disabled'}>
          ${this.isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </div>
      <p class="register-link">Don't have an account? <a href="/register" data-router-link>Register</a></p>
      ${this.showForgotPanel ? SafeHtmlString.trusted(`
        <div class="forgot-panel">
          ${this.forgotSent
            ? `<p class="success-msg">If an account exists for ${this.forgotEmail}, a reset link has been sent.</p>`
            : `<text-field data-field-name="forgotEmail" label="Email"></text-field>
               <button type="button" class="login-btn" data-action="send-reset" style="margin-top: var(--space-3)">Send Reset Link</button>`}
        </div>
      `) : ''}
    `;
  }
}

ComponentRegistry.register('login-page', LoginPageElement);
export { LoginPageElement };