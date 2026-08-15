/**
 * ViewAsControlElement.ts — components/view-as-control/
 *
 * The topbar "View As" control for the Admin layout. ID-entry field
 * that calls ImpersonationService.startImpersonation(clientId, 'admin'),
 * which already correctly checks allowedClientIds and throws
 * PermissionDeniedError if outside it.
 *
 * On denial: renders a clear inline "You don't have access to this
 * client" message (not a generic error toast).
 * On success: the existing ImpersonationBannerElement and sessionStore
 * wiring from Parts 1-5 handle the amber banner correctly.
 *
 * This section is primarily about building the entry-point UI, not
 * new impersonation logic — the allowlist check is delegated entirely
 * to ImpersonationService.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { impersonationService } from '../../services';
import { PermissionDeniedError } from '../../core/errors/PermissionDeniedError';

const STYLES = `
  :host { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-body); }
  .view-as-label { font-size: var(--font-size-xs); color: var(--color-text-muted); white-space: nowrap; }
  .view-as-input { width: 120px; padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-family: var(--font-body); background: var(--color-bg); color: var(--color-text-primary); }
  .view-as-btn { padding: var(--space-1) var(--space-3); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
  .view-as-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .error-msg { font-size: var(--font-size-xs); color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .success-msg { font-size: var(--font-size-xs); color: var(--color-success); }
`;

class ViewAsControlElement extends BaseComponent {
  private clientId = '';
  private isImpersonating = false;
  private error: string | null = null;
  private success: string | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="start-view-as"]')) {
      void this.startImpersonation();
      return;
    }
    if (target.closest('[data-action="end-view-as"]')) {
      impersonationService.endImpersonation();
      this.isImpersonating = false;
      this.success = null;
      this.error = null;
      this.rerender();
      return;
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'client-id') {
      this.clientId = (target as HTMLInputElement).value;
      this.error = null;
    }
  };

  private async startImpersonation(): Promise<void> {
    if (!this.clientId.trim()) return;
    try {
      await impersonationService.startImpersonation(this.clientId.trim(), 'admin');
      this.isImpersonating = true;
      this.error = null;
      this.success = `Now viewing as ${this.clientId}`;
      this.rerender();
    } catch (err) {
      if (err instanceof PermissionDeniedError) {
        this.error = `You don't have access to client "${this.clientId}"`;
      } else {
        this.error = 'An error occurred while switching views.';
      }
      this.success = null;
      this.rerender();
    }
  }

  protected renderTemplate(): string {
    if (this.isImpersonating) {
      return html`
        <span class="success-msg">${this.success}</span>
        <button class="view-as-btn" data-action="end-view-as" type="button">Exit View As</button>
      `;
    }
    return html`
      <span class="view-as-label">View As:</span>
      <input class="view-as-input" type="text" data-field="client-id" value="${this.clientId}" placeholder="Client ID" />
      <button class="view-as-btn" data-action="start-view-as" type="button">Go</button>
      ${this.error ? SafeHtmlString.trusted(`<span class="error-msg">${this.error}</span>`) : ''}
    `;
  }
}

ComponentRegistry.register('view-as-control', ViewAsControlElement);
export { ViewAsControlElement };