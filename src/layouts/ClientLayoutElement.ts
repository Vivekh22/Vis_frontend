/**
 * ClientLayoutElement.ts — layouts/
 *
 * Purpose:
 *   The role-shell wrapper for the Client UI. Renders:
 *   - ImpersonationBannerElement (sticky top, full-width)
 *   - Topbar: logo, horizontal nav, NotificationBellElement, theme toggle
 *   - Hamburger drawer for mobile navigation
 *   - <slot> for routed page content
 *
 * Low-network handling:
 *   Subscribes to ConnectivityStore. When navigator.connection reports
 *   a slow connection (effectiveType 'slow-2g' or '2g'), nav is restricted
 *   to Dashboard + Campaigns only, with a notice that Creatives may load
 *   slowly. If navigator.connection is unavailable (Firefox/Safari), no
 *   restriction is applied — we do NOT guess network quality.
 */
import { BaseComponent } from '../platform/component/BaseComponent';
import { ComponentRegistry } from '../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../platform/rendering/SafeHtml';
import { connectivityStore } from '../platform/state/ConnectivityStore';
import type { User } from '../platform/types';

const STYLES = `
  :host { display: block; min-height: 100vh; font-family: var(--font-body); }
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
  .logo {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    white-space: nowrap;
  }
  .nav { display: flex; gap: var(--space-1); flex: 1; }
  .nav-item {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    white-space: nowrap;
  }
  .nav-item:hover { background: var(--color-surface); color: var(--color-text-primary); }
  .nav-item.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
  .topbar-right { display: flex; align-items: center; gap: var(--space-3); margin-left: auto; }
  .hamburger {
    display: none;
    background: none;
    border: none;
    font-size: var(--font-size-xl);
    cursor: pointer;
    padding: var(--space-2);
  }
  .drawer {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 260px;
    height: 100vh;
    background: var(--color-bg);
    border-right: 1px solid var(--color-border);
    z-index: 200;
    flex-direction: column;
    padding: var(--space-4);
    gap: var(--space-1);
  }
  .drawer.open { display: flex; }
  .drawer-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 199;
  }
  .drawer-overlay.open { display: block; }
  @media (max-width: 768px) {
    .nav { display: none; }
    .hamburger { display: block; }
  }
  .content { padding: var(--space-6); }
  .low-network-notice {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-xs);
    color: #92400e;
    margin: 0 var(--space-6);
  }
`;

const ALL_CLIENT_NAV = [
  { label: 'Dashboard', path: '/client/dashboard' },
  { label: 'Campaigns', path: '/client/campaigns' },
  { label: 'Creatives', path: '/client/creatives' },
  { label: 'App Lists', path: '/client/app-lists' },
  { label: 'Audience Lists', path: '/client/audiences' },
  { label: 'Fund', path: '/client/fund' },
  { label: 'Invoices', path: '/client/invoices' },
  { label: 'Reports', path: '/client/reports' },
  { label: 'Account', path: '/client/acc-details' },
  { label: 'Integrations', path: '/client/integrations' },
  { label: 'Support', path: '/client/support' },
  { label: 'Notifications', path: '/client/notifications' },
  { label: 'Settings', path: '/client/settings' },
];

const LOW_NETWORK_ALLOWED = ['Dashboard', 'Campaigns'];

class ClientLayoutElement extends BaseComponent {
  private _user: User | null = null;
  private isDrawerOpen = false;
  private isLowNetwork = false;

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
    this.shadow.addEventListener('click', this.handleClick);
    connectivityStore.init();
    const state = connectivityStore.getState();
    this.isLowNetwork = state.isLowNetwork;
    this.unsubscribeConnectivity = connectivityStore.subscribe((newState) => {
      this.isLowNetwork = newState.isLowNetwork;
      this.rerender();
    });
  }

  private unsubscribeConnectivity: (() => void) | null = null;

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    if (this.unsubscribeConnectivity) {
      this.unsubscribeConnectivity();
      this.unsubscribeConnectivity = null;
    }
    connectivityStore.destroy();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="toggle-drawer"]')) {
      this.isDrawerOpen = !this.isDrawerOpen;
      this.rerender();
    }
  };

  private renderNavItems(): string {
    return ALL_CLIENT_NAV.map((item) => {
      const isDisabled = this.isLowNetwork && !LOW_NETWORK_ALLOWED.includes(item.label);
      const cls = isDisabled ? 'nav-item disabled' : 'nav-item';
      return html`<a class="${cls}" href="#${item.path}">${item.label}</a>`;
    }).join('');
  }

  protected renderTemplate(): string {
    const notice = this.isLowNetwork
      ? html`<div class="low-network-notice">Slow connection detected. Creatives may load slowly — navigation restricted to Dashboard and Campaigns.</div>`
      : '';
    return html`
      <impersonation-banner></impersonation-banner>
      <div class="topbar">
        <button class="hamburger" data-action="toggle-drawer" type="button">☰</button>
        <span class="logo">VispriscaAds</span>
        <nav class="nav">${SafeHtmlString.trusted(this.renderNavItems())}</nav>
        <div class="topbar-right">
          <theme-toggle></theme-toggle>
          <notification-bell></notification-bell>
        </div>
      </div>
      ${notice}
      <div class="drawer-overlay ${this.isDrawerOpen ? 'open' : ''}"></div>
      <div class="drawer ${this.isDrawerOpen ? 'open' : ''}">
        ${SafeHtmlString.trusted(this.renderNavItems())}
      </div>
      <main class="content">
        <slot></slot>
      </main>
    `;
  }
}

ComponentRegistry.register('client-layout', ClientLayoutElement);
export { ClientLayoutElement, ALL_CLIENT_NAV };