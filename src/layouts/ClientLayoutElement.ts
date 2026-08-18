/**
 * ClientLayoutElement.ts — layouts/
 *
 * Purpose:
 *   The role-shell wrapper for the Client UI. Renders:
 *   - ImpersonationBannerElement (sticky top, full-width)
 *   - Sidebar with navigation items
 *   - Topbar: NotificationBellElement, theme toggle
 *   - <slot> for routed page content
 *
 * Low-network handling:
 *   Subscribes to ConnectivityStore. When navigator.connection reports
 *   a slow connection, nav is restricted to Dashboard + Campaigns only.
 */
import { BaseComponent } from '../platform/component/BaseComponent';
import { ComponentRegistry } from '../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../platform/rendering/SafeHtml';
import { connectivityStore } from '../platform/state/ConnectivityStore';
import type { User } from '../platform/types';
import '../components/alert-banner/AlertBannerElement';
import './CollapsibleNavElement';
import { SIDEBAR_STYLES } from './sidebarStyles';

const STYLES = `
  :host { display: flex; height: 100vh; overflow: hidden; font-family: var(--font-body); }
  ${SIDEBAR_STYLES}
  .sidebar { width: 240px; }
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
  .topbar-actions { display: flex; align-items: center; gap: var(--space-3); margin-left: auto; }
  .content { padding: var(--space-6); flex: 1; overflow-y: auto; }
  .low-network-notice {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-xs);
    color: #92400e;
    margin: var(--space-4) var(--space-6) 0;
  }
  @media (max-width: 768px) {
    :host { flex-direction: column; }
    .sidebar { width: 100%; max-height: 200px; }
  }
`;

const CLIENT_NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/client/dashboard' },
    ]
  },
  {
    label: 'Advertising',
    items: [
      { label: 'Campaigns', path: '/client/campaigns' },
      { label: 'Creatives', path: '/client/creatives' },
      { label: 'App Lists', path: '/client/app-lists' },
      { label: 'Audience Lists', path: '/client/audiences' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { label: 'Fund', path: '/client/fund' },
      { label: 'Invoices', path: '/client/invoices' },
    ]
  },
  {
    label: 'System & Account',
    items: [
      { label: 'Reports', path: '/client/reports' },
      { label: 'Account', path: '/client/acc-details' },
      { label: 'Integrations', path: '/client/integrations' },
      { label: 'Settings', path: '/client/settings' },
      { label: 'Support', path: '/client/support' },
      { label: 'Notifications', path: '/client/notifications' },
    ]
  }
];

const LOW_NETWORK_ALLOWED = ['Dashboard', 'Campaigns'];

class ClientLayoutElement extends BaseComponent {
  private _user: User | null = null;
  private isLowNetwork = false;
  private unsubscribeConnectivity: (() => void) | null = null;

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

  protected onMount(): void {
    connectivityStore.init();
    const state = connectivityStore.getState();
    this.isLowNetwork = state.isLowNetwork;
    this.updateNav();
    
    this.unsubscribeConnectivity = connectivityStore.subscribe((newState) => {
      this.isLowNetwork = newState.isLowNetwork;
      this.rerender();
    });
  }

  protected rerender(): void {
    super.rerender();
    this.updateNav();
  }

  protected onUnmount(): void {
    if (this.unsubscribeConnectivity) {
      this.unsubscribeConnectivity();
      this.unsubscribeConnectivity = null;
    }
    connectivityStore.destroy();
  }

  private updateNav(): void {
    const nav = this.query<any>('collapsible-nav');
    if (!nav) return;
    
    // Filter items based on low network
    const filteredGroups = CLIENT_NAV_GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item => 
        !this.isLowNetwork || LOW_NETWORK_ALLOWED.includes(item.label)
      )
    })).filter(group => group.items.length > 0);
    
    nav.groups = filteredGroups;
    nav.currentPath = window.location.pathname;
  }

  protected renderTemplate(): string {
    const notice = this.isLowNetwork
      ? html`<alert-banner variant="warning">Slow connection detected. Creatives may load slowly — navigation restricted to Dashboard and Campaigns.</alert-banner>`
      : '';
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
        ${notice}
        <main class="content">
          <slot></slot>
        </main>
      </div>
    `;
  }
}

ComponentRegistry.register('client-layout', ClientLayoutElement);
export { ClientLayoutElement, CLIENT_NAV_GROUPS };