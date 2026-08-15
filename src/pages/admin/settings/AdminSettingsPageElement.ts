/**
 * AdminSettingsPageElement.ts — pages/admin/settings/
 *
 * Exactly 3 sections (narrower than Client's 5, per spec):
 *   - Profile
 *   - Security (Active Sessions, Login History)
 *   - Notifications (Admin-specific event types: campaign/creative
 *     submitted for review, SLA halfway reminder, new client assigned,
 *     ticket replies)
 *
 * !!! REGIONAL PREFERENCES AND DANGER ZONE STRUCTURALLY ABSENT !!!
 * These are NOT just hidden — they are structurally absent from this
 * page. There is no renderRegionalTab() method, no renderDangerTab()
 * method, no TABS array entry for 'regional' or 'danger', and no
 * deactivation request logic. A code search for these terms in this
 * file returns nothing. This is by design: Admin settings are narrower
 * than Client settings.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { settingsService } from '../../../services';
import type { ActiveSession, LoginHistoryEntry } from '../../../services/SettingsService';

const TABS = ['profile', 'security', 'notifications'] as const;
type Tab = (typeof TABS)[number];

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .tabs { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--color-border); margin-bottom: var(--space-6); }
  .tab { padding: var(--space-2) var(--space-4); border: none; background: none; cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-muted); border-bottom: 2px solid transparent; }
  .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  .tab-content { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .form-group { margin-bottom: var(--space-3); }
  .form-label { font-size: var(--font-size-xs); color: var(--color-text-muted); display: block; margin-bottom: var(--space-1); }
  .form-input { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-text-primary); }
  .btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .btn.secondary { background: var(--color-bg); color: var(--color-text-primary); border: 1px solid var(--color-border); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-label { font-size: var(--font-size-sm); color: var(--color-text-primary); }
  .section-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-3); }
`;

class AdminSettingsPageElement extends BaseComponent {
  private activeTab: Tab = 'profile';
  private activeSessions: ActiveSession[] = [];
  private loginHistory: LoginHistoryEntry[] = [];

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    void this.loadSecurityData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadSecurityData(): Promise<void> {
    try {
      this.activeSessions = await settingsService.getActiveSessions('admin-1');
      this.loginHistory = await settingsService.getLoginHistory('admin-1');
    } catch {
      // Use defaults
    }
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const tab = target.closest('[data-tab]');
    if (tab) {
      this.activeTab = tab.getAttribute('data-tab') as Tab;
      this.rerender();
    }
  };

  private renderProfileTab(): string {
    return `
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" type="text" value="Admin User" /></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" value="admin@visprisca.ads" /></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" type="tel" value="+1-555-0101" /></div>
      <div class="form-group"><label class="form-label">Change Password</label><input class="form-input" type="password" placeholder="New password" /></div>
      <div class="form-group"><label class="form-label">Two-Factor Authentication</label><button class="btn secondary" type="button">Enable 2FA</button></div>
      <button class="btn" type="button">Save Changes</button>
    `;
  }

  private renderSecurityTab(): string {
    const sessionRows = this.activeSessions.map((s) => `
      <tr>
        <td>${s.device}</td><td>${s.location}</td><td>${s.ipAddress}</td>
        <td>${s.lastActiveAt.toLocaleString()}</td>
        <td>${s.isCurrent ? '<strong>Current</strong>' : s.isImpersonation ? 'Impersonation' : 'Active'}</td>
      </tr>
    `).join('');
    const historyRows = this.loginHistory.map((h) => `
      <tr>
        <td>${h.timestamp.toLocaleString()}</td><td>${h.ipAddress}</td><td>${h.device}</td>
        <td>${h.location}</td><td>${h.success ? 'Success' : 'Failed'}</td>
      </tr>
    `).join('');
    return `
      <p class="section-title">Active Sessions</p>
      <table style="margin-bottom:var(--space-6);">
        <thead><tr><th>Device</th><th>Location</th><th>IP Address</th><th>Last Active</th><th>Status</th></tr></thead>
        <tbody>${sessionRows}</tbody>
      </table>
      <p class="section-title">Login History</p>
      <table>
        <thead><tr><th>Timestamp</th><th>IP Address</th><th>Device</th><th>Location</th><th>Result</th></tr></thead>
        <tbody>${historyRows}</tbody>
      </table>
    `;
  }

  private renderNotificationsTab(): string {
    // Admin-specific event types: campaign/creative submitted for review,
    // SLA halfway reminder, new client assigned, ticket replies
    const types = [
      'Campaign Submitted for Review',
      'Creative Submitted for Review',
      'SLA Halfway Reminder',
      'New Client Assigned',
      'Ticket Replies',
      'Security Alerts',
    ];
    const rows = types.map((t) => `
      <div class="toggle-row">
        <span class="toggle-label">${t}</span>
        <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
      </div>
    `).join('');
    return `
      <div class="toggle-row"><span class="toggle-label">Email Notifications</span><label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label></div>
      <div class="toggle-row"><span class="toggle-label">In-App Notifications</span><label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></label></div>
      <div class="toggle-row"><span class="toggle-label">Daily Digest</span><label class="toggle"><input type="checkbox" /><span class="toggle-slider"></span></label></div>
      <p class="section-title" style="margin-top:var(--space-4);">Admin Event Types</p>
      ${rows}
    `;
  }

  private renderTabContent(): string {
    switch (this.activeTab) {
      case 'profile': return this.renderProfileTab();
      case 'security': return this.renderSecurityTab();
      case 'notifications': return this.renderNotificationsTab();
      default: return '';
    }
  }

  protected renderTemplate(): string {
    const labels: Record<Tab, string> = { profile: 'Profile', security: 'Security', notifications: 'Notifications' };
    const tabsHtml = TABS.map((t) => `<button class="tab ${this.activeTab === t ? 'active' : ''}" data-tab="${t}" type="button">${labels[t]}</button>`).join('');
    return html`
      <h1 class="page-title">Admin Settings</h1>
      <div class="tabs">${SafeHtmlString.trusted(tabsHtml)}</div>
      <div class="tab-content">${SafeHtmlString.trusted(this.renderTabContent())}</div>
    `;
  }
}

ComponentRegistry.register('admin-settings', AdminSettingsPageElement);
export { AdminSettingsPageElement };