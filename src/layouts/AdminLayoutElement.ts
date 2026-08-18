/**
 * AdminLayoutElement.ts — layouts/
 *
 * Purpose:
 *   The role-shell wrapper for the Admin UI. Renders:
 *   - ImpersonationBannerElement (sticky top, full-width)
 *   - Sidebar with grouped navigation
 *   - Topbar: logo, NotificationBellElement, theme toggle
 *   - <slot> for routed page content
 *
 * Nav structure:
 *   Admin sees a sidebar with grouped nav items. Each group corresponds to a
 *   module. Nav items are FILTERED by the Admin's PermissionGrant — an Admin
 *   only sees modules where they have at least 'view' permission. This is the
 *   key difference from Client/Super Admin: Admin's nav is permission-based,
 *   not role-based.
 *
 * Input:
 *   Takes the current authenticated User (real entity from core/entities/)
 *   as input. The user's `permissions` map determines which nav items appear.
 */
import { BaseComponent } from '../platform/component/BaseComponent';
import { ComponentRegistry } from '../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../platform/rendering/SafeHtml';
import { PermissionGrant } from '../core/value-objects/PermissionGrant';
import type { User } from '../platform/types';
import type { PermissionLevel } from '../core/enums/PermissionLevel';
import './CollapsibleNavElement';
import { SIDEBAR_STYLES } from './sidebarStyles';

const STYLES = `
  :host { display: flex; min-height: 100vh; font-family: var(--font-body); }
  ${SIDEBAR_STYLES}
  .sidebar { width: 240px; }
  .main-area { flex: 1; display: flex; flex-direction: column; background: var(--color-bg); }
  .topbar {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-6);
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .topbar-actions { display: flex; align-items: center; gap: var(--space-3); }
  .content { padding: var(--space-6); flex: 1; }
  @media (max-width: 768px) {
    :host { flex-direction: column; }
    .sidebar { width: 100%; max-height: 200px; }
  }
`;

interface AdminNavGroup {
  label: string;
  module: string;
  items: { label: string; path: string }[];
}

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Overview',
    module: 'dashboard',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Analytics', path: '/admin/analytics' },
    ],
  },
  {
    label: 'Clients',
    module: 'clients',
    items: [
      { label: 'All Clients', path: '/admin/clients' },
      { label: 'Onboarding', path: '/admin/onboarding' },
    ],
  },
  {
    label: 'Campaigns',
    module: 'campaigns',
    items: [
      { label: 'All Campaigns', path: '/admin/campaigns' },
      { label: 'Approvals', path: '/admin/approvals' },
    ],
  },
  {
    label: 'Financial',
    module: 'billing',
    items: [
      { label: 'Transactions', path: '/admin/transactions' },
      { label: 'Invoices', path: '/admin/invoices' },
    ],
  },
  {
    label: 'System',
    module: 'settings',
    items: [
      { label: 'Settings', path: '/admin/settings' },
    ],
  },
];

class AdminLayoutElement extends BaseComponent {
  private _user: User | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set user(value: User | null) {
    this._user = value;
    this.rerender();
  }

  /**
   * Filters nav groups based on the Admin's PermissionGrant. An Admin only
   * sees modules where they have at least 'view' permission. Uses
   * PermissionGrant.canAccess() to check the module-matrix dimension.
   */
  private getVisibleNavGroups(): AdminNavGroup[] {
    if (!this._user || !this._user.permissions) {
      return [];
    }
    const grant = new PermissionGrant(
      new Map(Object.entries(this._user.permissions)),
      this._user.allowedClientIds,
    );
    return ADMIN_NAV_GROUPS.filter((group) => {
      const level: PermissionLevel = grant.getModulePermission(group.module);
      return level !== 'none';
    });
  }

  protected onMount(): void {
    this.updateNav();
  }

  protected rerender(): void {
    super.rerender();
    this.updateNav();
  }

  private updateNav(): void {
    const nav = this.query<any>('collapsible-nav');
    if (nav) {
      nav.groups = this.getVisibleNavGroups();
      nav.currentPath = window.location.pathname;
    }
  }

  protected renderTemplate(): string {
    return html`
      <impersonation-banner></impersonation-banner>
      <div class="sidebar">
        <div class="sidebar-logo">VispriscaAds</div>
        <collapsible-nav></collapsible-nav>
      </div>
      <div class="main-area">
        <div class="topbar">
          <div style="flex: 1;"></div>
          <div class="topbar-actions">
            <notification-bell></notification-bell>
          </div>
        </div>
        <main class="content">
          <slot></slot>
        </main>
      </div>
    `;
  }
}

ComponentRegistry.register('admin-layout', AdminLayoutElement);
export { AdminLayoutElement, ADMIN_NAV_GROUPS };