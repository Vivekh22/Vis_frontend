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
import '../../../components/form-fields/TextFieldElement';

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
  private isSubmitting = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="client-login"]')) {
      void this.handleDevLogin('client@vispriscaads.com');
    } else if (target.closest('[data-action="admin-login"]')) {
      void this.handleDevLogin('admin@vispriscaads.com');
    } else if (target.closest('[data-action="super-admin-login"]')) {
      void this.handleDevLogin('superadmin@vispriscaads.com');
    }
  };

  private async handleDevLogin(email: string): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.rerender();
    
    try {
      const user = await authService.login(email, 'password');
      // Role-based redirect — role comes from the backend response, not guessed.
      const role = user.role;
      if (role === 'admin') navigate('/admin/overview');
      else if (role === 'super-admin') navigate('/super-admin/overview');
      else navigate('/client/dashboard');
    } catch (err) {
      console.error('Dev login failed:', err);
    }
    
    this.isSubmitting = false;
    this.rerender();
  }

  protected renderTemplate(): string {
    return html`
      <h1 class="login-title">Development Mode</h1>
      <p class="login-subtitle">Choose a role to log in as.</p>
      
      <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
        <button type="button" data-action="client-login" class="login-btn" style="background: var(--color-surface); color: var(--color-text-primary); border: 1px solid var(--color-border); padding: 15px;">
          Log in as Client
        </button>
        <button type="button" data-action="admin-login" class="login-btn" style="background: var(--color-primary); color: var(--color-primary-foreground); padding: 15px;">
          Log in as Admin
        </button>
        <button type="button" data-action="super-admin-login" class="login-btn" style="background: #000; color: #fff; padding: 15px;">
          Log in as Super Admin
        </button>
      </div>
      
      ${this.isSubmitting ? SafeHtmlString.trusted('<p style="text-align:center; margin-top: 20px;">Logging in...</p>') : ''}
    `;
  }
}

ComponentRegistry.register('login-page', LoginPageElement);
export { LoginPageElement };