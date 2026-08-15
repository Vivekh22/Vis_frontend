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

const STYLES = `
  :host { display: flex; min-height: 100vh; font-family: var(--font-body); }
  .sidebar {
    width: 260px;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    padding: var(--space-4) 0;
    overflow-y: auto;
    flex-shrink: 0;
  }
  .sidebar-logo {
    padding: 0 var(--space-4) var(--space-4);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--space-2);
  }
  .nav-group { margin-bottom: var(--space-3); }
  .nav-group-label {
    padding: var(--space-1) var(--space-4);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .nav-item {
    display: block;
    padding: var(--space-2) var(--space-4);
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: var(--font-size-sm);
    cursor: pointer;
  }
  .nav-item:hover { background: var(--color-bg); color: var(--color-text-primary); }
  .main-area { flex: 1; display: flex; flex-direction: column; }
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
  .topbar-right { display: flex; align-items: center; gap: var(--space-3); margin-left: auto; }
  .content { padding: var(--space-6); flex: 1; }
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

  private renderSidebar(): string {
    return SUPER_ADMIN_NAV.map(
      (group) => html`
        <div class="nav-group">
          <div class="nav-group-label">${group.label}</div>
          ${SafeHtmlString.trusted(
            group.items
              .map((item) => html`<a class="nav-item" href="#${item.path}">${item.label}</a>`)
              .join(''),
          )}
        </div>
      `,
    ).join('');
  }

  protected renderTemplate(): string {
    return html`
      <impersonation-banner></impersonation-banner>
      <div class="sidebar">
        <div class="sidebar-logo">VispriscaAds</div>
        ${SafeHtmlString.trusted(this.renderSidebar())}
      </div>
      <div class="main-area">
        <div class="topbar">
          <div class="topbar-right">
            <theme-toggle></theme-toggle>
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