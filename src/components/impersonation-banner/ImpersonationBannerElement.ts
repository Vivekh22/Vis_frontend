/**
 * ImpersonationBannerElement.ts — components/impersonation-banner/
 *
 * Purpose:
 *   Renders the persistent amber banner shown during an active impersonation
 *   session. Non-dismissible, always visible while impersonating.
 *
 * Lifecycle:
 *   onMount   → subscribes to sessionStore, stores unsubscribe function.
 *   onUnmount → calls the unsubscribe function.
 *
 *   This is the first real test of the BaseComponent + Store subscribe/
 *   unsubscribe lifecycle pattern built in Part 1.
 *
 * Rendering:
 *   - isImpersonating === false → returns '' (renders nothing, no stale ARIA).
 *   - isImpersonating === true  → renders amber banner, wording branches on
 *     actingAsRole:
 *       super-admin: "Viewing as [Client Name] — Super Admin session · Exit"
 *       admin:       "Viewing as [Client Name] — Admin session · Exit"
 *
 *   Client name from sessionStore.impersonatedEntityName, interpolated via
 *   the html tag so it is auto-escaped (user-provided data — never trusted).
 *
 * Exit action:
 *   Calls sessionStore.endImpersonation() (preserves audit trail, distinct
 *   from clearSession() used by logout) and emits 'impersonation-exit' so
 *   the parent router can navigate back to the Admin/Super Admin dashboard.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html } from '../../platform/rendering/SafeHtml';
import { sessionStore } from '../../platform/state/SessionStore';
import { impersonationService } from '../../services';

const STYLES = `
  :host {
    display: block;
    position: sticky;
    top: 0;
    z-index: 9999;
  }
  .banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    background: var(--color-warning);
    color: #fff;
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    width: 100%;
    box-sizing: border-box;
  }
  .banner-text {
    flex: 1;
    text-align: center;
  }
  .exit-btn {
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.4);
    color: #fff;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  .exit-btn:hover {
    background: rgba(255,255,255,0.3);
  }
`;

class ImpersonationBannerElement extends BaseComponent {
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.unsubscribe = sessionStore.subscribe(() => this.rerender());
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const actionEl = target.closest('[data-action]');
    if (!actionEl) return;
    if (actionEl.getAttribute('data-action') === 'exit') {
      impersonationService.endImpersonation();
      this.emit('impersonation-exit', {});
    }
  };

  protected renderTemplate(): string {
    const state = sessionStore.getState();
    if (!state.isImpersonating) {
      return '';
    }
    const roleLabel = state.actingAsRole === 'super-admin' ? 'Super Admin' : 'Admin';
    const entityName = state.impersonatedEntityName ?? '';
    return html`
      <div class="banner" role="alert" aria-live="polite">
        <span class="banner-text">Viewing as ${entityName} — ${roleLabel} session ·
          <button class="exit-btn" data-action="exit" type="button">Exit</button>
        </span>
      </div>
    `;
  }
}

ComponentRegistry.register('impersonation-banner', ImpersonationBannerElement);
export { ImpersonationBannerElement };