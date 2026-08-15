/**
 * RegistrationStatusPageElement.ts — pages/client/registration/
 *
 * Three-state page rendered after registration submission:
 *   Pending Approval — amber icon, "Your registration is under review"
 *   Rejected        — danger styling, rejection reason shown
 *   Approved        — success styling, "Go to Dashboard" action
 *
 * Designed to fetch current status via authService.getRegistrationStatus()
 * rather than assuming it always arrives with fresh in-memory state. This
 * supports both immediate post-submission display and direct-link return visits.
 *
 * The email for status lookup is read from the URL query param (?email=...) or
 * from a stored value set by the wizard before navigation.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { authService } from '../../../services';
import { navigate } from '../../../utils/navigate';
import type { RegistrationStatus } from '../../../services/AuthService';

const STYLES = `
  :host { display: block; font-family: var(--font-body); max-width: 500px; margin: 0 auto; padding: var(--space-10) var(--space-4); text-align: center; }
  .status-icon { font-size: 3rem; line-height: 1; margin-bottom: var(--space-4); }
  .status-icon--pending { color: var(--color-warning); }
  .status-icon--rejected { color: var(--color-danger); }
  .status-icon--approved { color: var(--color-success); }
  .status-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .status-message { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-6); }
  .rejection-reason { font-size: var(--font-size-sm); color: var(--color-danger); background: rgba(220, 38, 38, 0.08); padding: var(--space-3); border-radius: var(--radius-md); margin: 0 0 var(--space-6); }
  .action-btn {
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
  .action-btn:hover { opacity: 0.9; }
  .loading-msg { font-size: var(--font-size-sm); color: var(--color-text-muted); }
`;

class RegistrationStatusPageElement extends BaseComponent {
  private status: RegistrationStatus | null = null;
  private isLoading = true;
  private loadError: string | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    void this.fetchStatus();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async fetchStatus(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email') || '';
      this.status = await authService.getRegistrationStatus(email);
    } catch {
      this.loadError = 'Failed to load registration status.';
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="go-to-dashboard"]')) {
      navigate('/register/welcome');
    } else if (target.closest('[data-action="retry"]')) {
      void this.fetchStatus();
    }
  };

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<p class="loading-msg">Loading registration status...</p>`;
    }
    if (this.loadError || !this.status) {
      return html`
        <div class="status-icon status-icon--rejected">!</div>
        <h2 class="status-title">Error</h2>
        <p class="status-message">${this.loadError ?? 'Unable to load status.'}</p>
        <button type="button" class="action-btn" data-action="retry">Retry</button>
      `;
    }

    if (this.status.status === 'pending') {
      return html`
        <div class="status-icon status-icon--pending">⏳</div>
        <h2 class="status-title">Pending Approval</h2>
        <p class="status-message">Your registration is under review. You will be notified once it is approved.</p>
      `;
    }

    if (this.status.status === 'rejected') {
      return html`
        <div class="status-icon status-icon--rejected">✕</div>
        <h2 class="status-title">Registration Rejected</h2>
        <p class="status-message">Unfortunately, your registration could not be approved at this time.</p>
        ${this.status.rejectionReason ? SafeHtmlString.trusted(`<div class="rejection-reason">${this.status.rejectionReason}</div>`) : ''}
      `;
    }

    // approved
    return html`
      <div class="status-icon status-icon--approved">✓</div>
      <h2 class="status-title">Approved!</h2>
      <p class="status-message">Your registration has been approved. You can now access your dashboard.</p>
      <button type="button" class="action-btn" data-action="go-to-dashboard">Go to Dashboard</button>
    `;
  }
}

ComponentRegistry.register('registration-status-page', RegistrationStatusPageElement);
export { RegistrationStatusPageElement };