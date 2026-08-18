/**
 * SuperAdminViewAsElement.ts — components/view-as-control/
 *
 * Purpose:
 *   The topbar "View As" control specifically for Super Admins.
 *   Allows unrestricted impersonation of any Admin or Client.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { impersonationService, clientService } from '../../services';
import { navigate } from '../../utils/navigate';
import type { ClientSummary } from '../../core/types/ClientSummary';

const STYLES = `
  :host { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-body); }
  .view-as-container { display: flex; align-items: center; gap: var(--space-2); position: relative; }
  .view-as-label { font-size: var(--font-size-xs); color: var(--color-text-muted); white-space: nowrap; }
  .view-as-select, .view-as-input {
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-family: var(--font-body);
    background: var(--color-bg);
    color: var(--color-text-primary);
  }
  .view-as-select { width: 100px; }
  .view-as-input { width: 150px; }
  .view-as-btn {
    padding: var(--space-1) var(--space-3);
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  .view-as-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .error-msg { font-size: var(--font-size-xs); color: var(--color-danger); font-weight: var(--font-weight-semibold); position: absolute; top: 100%; left: 0; margin-top: 2px; white-space: nowrap;}
`;

class SuperAdminViewAsElement extends BaseComponent {
  private selectedRole: 'admin' | 'client' = 'client';
  private targetId = '';
  private isImpersonating = false;
  private error: string | null = null;
  private availableClients: ClientSummary[] = [];
  
  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    this.shadow.addEventListener('change', this.handleChange);
    void this.loadClients();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private async loadClients(): Promise<void> {
    try {
      this.availableClients = await clientService.listAssignedClients();
      this.rerender();
    } catch {
      // Ignore
    }
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="start-view-as"]')) {
      void this.startImpersonation();
      return;
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'target-id') {
      this.targetId = (target as HTMLInputElement).value;
      this.error = null;
      
      const goBtn = this.shadow.querySelector('[data-action="start-view-as"]') as HTMLButtonElement | null;
      if (goBtn) {
        goBtn.disabled = !this.targetId.trim();
      }
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field') === 'role-select') {
      this.selectedRole = (target as HTMLSelectElement).value as 'admin' | 'client';
      this.targetId = '';
      this.error = null;
      this.rerender();
    }
  };

  private async startImpersonation(): Promise<void> {
    if (!this.targetId.trim()) {
      this.error = 'Please enter an ID';
      this.rerender();
      return;
    }
    
    try {
      await impersonationService.startImpersonation(this.targetId.trim(), 'super-admin');
      this.isImpersonating = true;
      this.error = null;

      // Navigate via the SPA router (pushState), NOT window.location.href:
      // a full page reload would wipe the in-memory authStore + sessionStore,
      // dropping the impersonation session and the amber banner. The Router
      // re-renders the target route; RouteGuard permits the client route
      // because sessionStore now reports an active client impersonation.
      const path = this.selectedRole === 'admin' ? '/admin/overview' : '/client/dashboard';
      navigate(path);
    } catch (err: any) {
      this.error = err.message || 'Error switching views';
      this.rerender();
    }
  }

  protected renderTemplate(): string {
    return html`
      <div class="view-as-container">
        <span class="view-as-label">View As:</span>
        <select class="view-as-select" data-field="role-select">
          <option value="client" ${this.selectedRole === 'client' ? 'selected' : ''}>Client</option>
          <option value="admin" ${this.selectedRole === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
        
        ${this.selectedRole === 'client' 
          ? SafeHtmlString.trusted(`
              <input class="view-as-input" type="text" list="client-list" data-field="target-id" value="${this.targetId}" placeholder="Client ID / Name" />
              <datalist id="client-list">
                ${this.availableClients.map(c => '<option value="' + c.clientId + '">' + c.companyName + '</option>').join('')}
              </datalist>
            `)
          : SafeHtmlString.trusted(`
              <input class="view-as-input" type="text" data-field="target-id" value="${this.targetId}" placeholder="Admin Email / ID" />
            `)
        }
        
        <button class="view-as-btn" data-action="start-view-as" type="button" ${!this.targetId.trim() ? 'disabled' : ''}>Go</button>
        ${this.error ? SafeHtmlString.trusted(`<span class="error-msg">${this.error}</span>`) : ''}
      </div>
    `;
  }
}

ComponentRegistry.register('super-admin-view-as', SuperAdminViewAsElement);
export { SuperAdminViewAsElement };
