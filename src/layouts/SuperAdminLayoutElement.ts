/**
 * SuperAdminLayoutElement.ts — layouts/
 *
 * Purpose:
 *   The role-shell wrapper for the Super Admin UI. Renders:
 *   - ImpersonationBannerElement (sticky top, full-width)
 *   - Sidebar with 7 groups / 22 tabs
 *   - Topbar: logo, NotificationBellElement, theme toggle
 *   - <slot> for routed page content
 *
 * Nav structure:
 *   Super Admin sees all 7 groups / 22 tabs — no permission filtering needed
 *   since Super Admin has unrestricted access to all modules and all clients.
 *
 * Input:
 *   Takes the current authenticated User (real entity from core/entities/)
 *   as input. Unlike Admin, nav items are NOT filtered — Super Admin sees
 *   everything.
 */
import { BaseComponent } from '../platform/component/BaseComponent';
import { ComponentRegistry } from '../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../platform/rendering/SafeHtml';
import type { User } from '../platform/types';
import '../components/view-as-control/SuperAdminViewAsElement';
import './CollapsibleNavElement';
import { SIDEBAR_STYLES } from './sidebarStyles';

const STYLES = `
  :host { display: flex; height: 100vh; overflow: hidden; font-family: var(--font-body); }
  ${SIDEBAR_STYLES}
  .sidebar { 
    width: 260px; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
  }
  .sidebar.collapsed {
    width: 0;
    border-right: none;
  }
  .hamburger-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--color-text-primary);
    padding: var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: background 0.2s;
  }
  .hamburger-btn:hover {
    background: var(--color-surface-2);
  }
  .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--color-bg); }
  .topbar {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-6);
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }
  .topbar-actions { display: flex; align-items: center; gap: var(--space-3); }
  .content { padding: var(--space-6); flex: 1; overflow-y: auto; }
  @media (max-width: 768px) {
    :host { flex-direction: column; }
    .sidebar { width: 100%; max-height: 300px; }
  }
`;

interface NavGroup {
  label: string;
  items: { label: string; path: string }[];
}

// Super Admin nav: 7 groups / 22 tabs
const SUPER_ADMIN_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Overview', path: '/super-admin/overview' },
    ],
  },
  {
    label: 'Admin Panel',
    items: [
      { label: 'New Registrations', path: '/super-admin/new-registrations' },
      { label: 'User Management', path: '/super-admin/user-management' },
      { label: 'Role & Permission Builder', path: '/super-admin/role-permission-builder' },
      { label: 'Margin Management', path: '/super-admin/margin-management' },
      { label: 'Exchange Management', path: '/super-admin/exchange-management' },
      { label: 'Feature Gating', path: '/super-admin/feature-gating' },
      { label: 'Pending Approvals', path: '/super-admin/pending-approvals' },
      { label: 'Activity Log', path: '/super-admin/activity-log' },
      { label: 'Platform Settings', path: '/super-admin/platform-settings' },
    ],
  },
  {
    label: 'Platform Connections',
    items: [
      { label: 'Connected Exchanges', path: '/super-admin/connected-exchanges' },
      { label: 'Connected Publishers', path: '/super-admin/connected-publishers' },
      { label: 'Connected DSPs', path: '/super-admin/connected-dsps' },
    ],
  },
  {
    label: 'Integrations & APIs',
    items: [
      { label: 'Platform API Management', path: '/super-admin/platform-api-management' },
      { label: 'Master Integration Lists', path: '/super-admin/master-integration-lists' },
      { label: 'Third-Party Service Status', path: '/super-admin/third-party-service-status' },
    ],
  },
  {
    label: 'Taranga Governance',
    items: [
      { label: 'Model Management', path: '/super-admin/model-management' },
      { label: 'Suggestion Bus Activity', path: '/super-admin/suggestion-bus-activity' },
    ],
  },
  {
    label: 'System Health',
    items: [
      { label: 'Infrastructure Health', path: '/super-admin/infrastructure-health' },
      { label: 'Geo & Edge Status', path: '/super-admin/geo-edge-status' },
    ],
  },
  {
    label: 'Trust & Compliance',
    items: [
      { label: 'Fraud & Security Overview', path: '/super-admin/fraud-security-overview' },
      { label: 'Compliance Center', path: '/super-admin/compliance-center' },
    ],
  },
];

class SuperAdminLayoutElement extends BaseComponent {
  private _user: User | null = null;
  private isSidebarCollapsed = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set user(value: User | null) {
    this._user = value;
    this.rerender();
  }

  public get user(): User | null {
    return this._user;
  }

  
  private handleLayoutClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action="toggle-sidebar"]')) {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      this.rerender();
    }
  };

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleLayoutClick);
    this.updateNav();
  }

  
  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleLayoutClick);
  }

  protected rerender(): void {
    super.rerender();
    this.updateNav();
  }

  private updateNav(): void {
    const nav = this.query<any>('collapsible-nav');
    if (nav) {
      nav.groups = SUPER_ADMIN_NAV;
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
            <super-admin-view-as></super-admin-view-as>
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

ComponentRegistry.register('super-admin-layout', SuperAdminLayoutElement);
export { SuperAdminLayoutElement, SUPER_ADMIN_NAV };