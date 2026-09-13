/**
 * SettingsPageElement.ts — pages/client/settings/
 *
 * 5 tabs: Profile, Regional, Notifications, Security, Danger Zone.
 *
 * !!! SECURITY TAB — IMPERSONATION SESSION DISPLAY !!!
 *   getActiveSessions() connects to SessionStore to surface any active
 *   Super Admin impersonation session, per the spec's cross-reference.
 *
 * !!! DANGER ZONE — DEACTIVATE ACCOUNT REQUEST, NOT SELF-EXECUTION !!!
 *   The Deactivate Account button calls settingsService.requestDeactivation(),
 *   which submits a REQUEST for admin/super-admin review. It does NOT call
 *   a deleteAccount() method — the account remains active until an admin
 *   approves. There is no deleteAccount() method in SettingsService — by
 *   design.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { settingsService } from '../../../services';
import type { ActiveSession, LoginHistoryEntry } from '../../../services/SettingsService';

const TABS = ['profile', 'regional', 'notifications', 'security', 'danger'] as const;
type Tab = (typeof TABS)[number];

const STYLES = `
  :host { display: block; font-family: var(--font-body); padding: var(--space-4) 0; }

  /* Header */
  .page-header { margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: var(--font-weight-bold); color: #111827; margin: 0 0 4px 0; }
  .page-subtitle { font-size: 13px; color: #6b7280; margin: 0; }

  /* Tab bar */
  .tab-bar { display: flex; gap: 4px; background: #f8fafc; border: 1px solid #eef0f4; border-radius: 10px; padding: 4px; margin-bottom: 24px; width: fit-content; flex-wrap: wrap; }
  .tab { padding: 8px 16px; border: none; background: transparent; cursor: pointer; font-size: 13px; font-weight: 500; font-family: var(--font-body); color: #6b7280; border-radius: 7px; transition: all 0.2s; white-space: nowrap; }
  .tab.active { background: white; color: #111827; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .tab.danger-tab.active { background: #fef2f2; color: #dc2626; }
  .tab:hover:not(.active) { color: #374151; background: #f1f5f9; }

  /* Card */
  .card { background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .card-title { font-size: 15px; font-weight: 600; color: #111827; margin: 0 0 20px 0; }
  .section-title { font-size: 13px; font-weight: 600; color: #374151; margin: 24px 0 12px 0; }
  .section-title:first-child { margin-top: 0; }

  /* Forms */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-input, .form-select { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: #fcfdfd; color: #1e293b; outline: none; transition: border-color 0.2s; }
  .form-input:focus, .form-select:focus { border-color: #3b66f5; background: white; }

  /* Buttons */
  .btn-primary { padding: 10px 20px; background: #3b66f5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; margin-top: 8px; }
  .btn-secondary { padding: 8px 16px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .btn-danger { padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .btn-sm { padding: 6px 12px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; }

  /* Toggles */
  .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f8fafc; }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-info { display: flex; flex-direction: column; gap: 2px; }
  .toggle-label { font-size: 13px; color: #374151; font-weight: 500; }
  .toggle-desc { font-size: 11px; color: #94a3b8; }
  .toggle { position: relative; width: 44px; height: 22px; flex-shrink: 0; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #e2e8f0; border-radius: 22px; transition: 0.3s; }
  .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 2px; top: 2px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .toggle input:checked + .toggle-slider { background: #3b66f5; }
  .toggle input:checked + .toggle-slider:before { transform: translateX(22px); }

  /* Table */
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid #f8fafc; font-size: 12px; }
  th { font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; background: #fcfdfd; }
  tr:last-child td { border-bottom: none; }

  /* Impersonation Banner */
  .impersonation-banner { display: flex; align-items: center; gap: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #92400e; font-weight: 500; }

  /* Danger Zone */
  .danger-card { background: #fff5f5; border: 1.5px solid #fecaca; border-radius: 12px; padding: 24px; }
  .danger-title { font-size: 15px; font-weight: 700; color: #dc2626; margin: 0 0 8px 0; }
  .danger-desc { font-size: 13px; color: #374151; margin: 0 0 20px 0; line-height: 1.6; }

  /* Pills */
  .pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .pill.green { background: #e5f5eb; color: #16a34a; border: 1px solid #bbf7d0; }
  .pill.orange { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .pill.red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .pill.gray { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
  .modal { background: white; border-radius: 16px; padding: 28px; min-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
  .modal-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 8px 0; }
  .modal-desc { font-size: 13px; color: #6b7280; margin: 0 0 20px 0; line-height: 1.6; }
  .modal-actions { display: flex; gap: 12px; margin-top: 20px; }
  .textarea { width: 100%; box-sizing: border-box; min-height: 90px; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: #fcfdfd; color: #1e293b; resize: vertical; outline: none; }
  .textarea:focus { border-color: #3b66f5; }
`;

class SettingsPageElement extends BaseComponent {
  private activeTab: Tab = 'profile';
  private activeSessions: ActiveSession[] = [];
  private loginHistory: LoginHistoryEntry[] = [];
  private showDeactivateModal = false;
  private deactivationReason = '';
  private deactivationSubmitted = false;

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
      this.activeSessions = await settingsService.getActiveSessions('client-1');
      this.loginHistory = await settingsService.getLoginHistory('client-1');
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
      return;
    }
    if (target.closest('[data-action="show-deactivate"]')) {
      this.showDeactivateModal = true;
      this.deactivationSubmitted = false;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="cancel-deactivate"]')) {
      this.showDeactivateModal = false;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="confirm-deactivate"]')) {
      void this.requestDeactivation();
      return;
    }
    const terminateBtn = target.closest('[data-action="terminate-session"]');
    if (terminateBtn) {
      const sessionId = terminateBtn.getAttribute('data-session-id') ?? '';
      void settingsService.terminateSession(sessionId);
      void this.loadSecurityData();
      return;
    }
  };

  /**
   * Calls settingsService.requestDeactivation() — NOT a deleteAccount() method.
   * This submits a REQUEST for admin/super-admin review. The account is NOT
   * deleted — it remains active until an admin approves the request.
   */
  private async requestDeactivation(): Promise<void> {
    await settingsService.requestDeactivation('client-1', this.deactivationReason || 'No reason provided');
    this.deactivationSubmitted = true;
    this.deactivationReason = '';
    this.rerender();
  }

  private renderProfileTab(): string {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-input" type="text" value="Client User" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" value="client@visprisca.ads" />
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-input" type="tel" value="+1-555-0100" />
        </div>
        <div class="form-group">
          <label class="form-label">Avatar</label>
          <input class="form-input" type="file" />
        </div>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input class="form-input" type="password" placeholder="Enter new password" />
        </div>
        <div class="form-group">
          <label class="form-label">Two-Factor Authentication</label>
          <button class="btn-secondary" type="button" style="align-self:flex-start;">Enable 2FA</button>
        </div>
      </div>
      <button class="btn-primary" type="button">Save Changes</button>
    `;
  }

  private renderRegionalTab(): string {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Timezone</label>
          <select class="form-select">
            <option>Asia/Calcutta</option>
            <option>America/New_York</option>
            <option>Europe/London</option>
            <option>America/Los_Angeles</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Currency</label>
          <select class="form-select">
            <option>USD — US Dollar</option>
            <option>EUR — Euro</option>
            <option>INR — Indian Rupee</option>
            <option>GBP — British Pound</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date Format</label>
          <select class="form-select">
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Language</label>
          <select class="form-select">
            <option>English (US)</option>
            <option>English (UK)</option>
          </select>
        </div>
      </div>
      <button class="btn-primary" type="button">Save Changes</button>
    `;
  }

  private renderNotificationsTab(): string {
    const channels = [
      { key: 'email', label: 'Email Notifications', desc: 'Receive updates to your inbox', checked: true },
      { key: 'inapp', label: 'In-App Notifications', desc: 'Alerts inside the dashboard', checked: true },
      { key: 'digest', label: 'Daily Digest', desc: 'Daily summary at 9:00 AM', checked: false },
    ];
    const types = [
      { key: 'security', label: 'Security', desc: 'Login alerts & suspicious activity' },
      { key: 'campaign', label: 'Campaign', desc: 'Status changes & performance alerts' },
      { key: 'billing', label: 'Billing', desc: 'Invoice generation & payment reminders' },
      { key: 'team', label: 'Team', desc: 'Member added/removed notifications' },
      { key: 'support', label: 'Support', desc: 'Updates on support tickets' },
    ];
    const channelRows = channels.map((c) => `
      <div class="toggle-row">
        <div class="toggle-info">
          <span class="toggle-label">${c.label}</span>
          <span class="toggle-desc">${c.desc}</span>
        </div>
        <div class="toggle"><input type="checkbox" ${c.checked ? 'checked' : ''} /><span class="toggle-slider"></span></div>
      </div>
    `).join('');
    const typeRows = types.map((t) => `
      <div class="toggle-row">
        <div class="toggle-info">
          <span class="toggle-label">${t.label}</span>
          <span class="toggle-desc">${t.desc}</span>
        </div>
        <div class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></div>
      </div>
    `).join('');
    return `
      <p class="section-title">Delivery Channels</p>
      ${channelRows}
      <p class="section-title">Notification Types</p>
      ${typeRows}
    `;
  }

  private renderSecurityTab(): string {
    const impersonationSession = this.activeSessions.find((s) => s.isImpersonation);
    const impersonationBanner = impersonationSession
      ? `<div class="impersonation-banner">⚠ Active ${impersonationSession.actingAsRole ?? 'Admin'} impersonation session detected. Started at ${impersonationSession.lastActiveAt.toLocaleString()}.</div>`
      : '';
    const sessions = this.activeSessions.length > 0 ? this.activeSessions : [
      { id: 's1', device: 'Chrome — macOS', location: 'Mumbai, India', ipAddress: '103.21.244.1', lastActiveAt: new Date(), isCurrent: true, isImpersonation: false },
      { id: 's2', device: 'Safari — iPhone 15', location: 'Pune, India', ipAddress: '49.37.220.8', lastActiveAt: new Date(Date.now() - 3600000), isCurrent: false, isImpersonation: false },
    ];
    const sessionRows = sessions.map((s) => `
      <tr>
        <td>${s.device}</td>
        <td>${s.location}</td>
        <td style="font-family:monospace;font-size:12px;">${s.ipAddress}</td>
        <td>${s.lastActiveAt.toLocaleString()}</td>
        <td>${s.isCurrent ? '<span class="pill green">Current</span>' : s.isImpersonation ? '<span class="pill orange">Impersonation</span>' : '<span class="pill gray">Active</span>'}</td>
        <td>${!s.isCurrent ? `<button class="btn-sm" data-action="terminate-session" data-session-id="${s.id}" type="button">Log Out</button>` : '—'}</td>
      </tr>
    `).join('');
    const history = this.loginHistory.length > 0 ? this.loginHistory : [
      { timestamp: new Date(), ipAddress: '103.21.244.1', device: 'Chrome — macOS', location: 'Mumbai, India', success: true },
      { timestamp: new Date(Date.now() - 86400000), ipAddress: '49.37.220.8', device: 'Safari — iPhone 15', location: 'Pune, India', success: true },
      { timestamp: new Date(Date.now() - 172800000), ipAddress: '185.2.4.21', device: 'Unknown Device', location: 'Berlin, Germany', success: false },
    ];
    const historyRows = history.map((h) => `
      <tr>
        <td>${h.timestamp.toLocaleString()}</td>
        <td style="font-family:monospace;font-size:12px;">${h.ipAddress}</td>
        <td>${h.device}</td>
        <td>${h.location}</td>
        <td>${h.success ? '<span class="pill green">Success</span>' : '<span class="pill red">Failed</span>'}</td>
      </tr>
    `).join('');
    return `
      ${impersonationBanner}
      <p class="section-title">Active Sessions</p>
      <table style="margin-bottom: 24px;">
        <thead><tr><th>Device</th><th>Location</th><th>IP Address</th><th>Last Active</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>${sessionRows}</tbody>
      </table>
      <p class="section-title">Login History</p>
      <table>
        <thead><tr><th>Timestamp</th><th>IP Address</th><th>Device</th><th>Location</th><th>Result</th></tr></thead>
        <tbody>${historyRows}</tbody>
      </table>
    `;
  }

  private renderDangerTab(): string {
    return `
      <div class="danger-card">
        <h3 class="danger-title">⚠ Deactivate Account</h3>
        <p class="danger-desc">Request account deactivation. This submits a request for admin review — your account will remain fully active until an administrator approves the deactivation request. This action does not immediately delete your account.</p>
        <button class="btn-danger" data-action="show-deactivate" type="button">Request Deactivation</button>
      </div>
    `;
  }

  private renderDeactivateModal(): string {
    if (this.deactivationSubmitted) {
      return `
        <div class="modal-overlay">
          <div class="modal">
            <h2 class="modal-title">✅ Request Submitted</h2>
            <p class="modal-desc">Your deactivation request has been submitted for admin review. Your account remains active until an administrator approves the request.</p>
            <button class="btn-primary" data-action="cancel-deactivate" type="button">Close</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="modal-overlay">
        <div class="modal">
          <h2 class="modal-title">Request Account Deactivation</h2>
          <p class="modal-desc">This will submit a deactivation request for admin review. Your account will <strong>not</strong> be deleted immediately — it remains active until an administrator approves it.</p>
          <div class="form-group">
            <label class="form-label">Reason for Deactivation</label>
            <textarea class="textarea" placeholder="Please tell us why you're leaving..."></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-danger" data-action="confirm-deactivate" type="button">Submit Request</button>
            <button class="btn-secondary" data-action="cancel-deactivate" type="button">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderTabContent(): string {
    switch (this.activeTab) {
      case 'profile': return this.renderProfileTab();
      case 'regional': return this.renderRegionalTab();
      case 'notifications': return this.renderNotificationsTab();
      case 'security': return this.renderSecurityTab();
      case 'danger': return this.renderDangerTab();
      default: return '';
    }
  }

  protected renderTemplate(): string {
    const labels: Record<Tab, string> = { profile: 'Profile', regional: 'Regional', notifications: 'Notifications', security: 'Security', danger: 'Danger Zone' };
    const tabsHtml = TABS.map((t) => `<button class="tab ${this.activeTab === t ? 'active' : ''} ${t === 'danger' ? 'danger-tab' : ''}" data-tab="${t}" type="button">${labels[t]}</button>`).join('');
    return html`
      <div class="page-header">
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Manage your profile, preferences, and account security</p>
      </div>
      <div class="tab-bar">${SafeHtmlString.trusted(tabsHtml)}</div>
      <div class="card">
        <p class="card-title">${labels[this.activeTab]}</p>
        ${SafeHtmlString.trusted(this.renderTabContent())}
      </div>
      ${this.showDeactivateModal ? SafeHtmlString.trusted(this.renderDeactivateModal()) : ''}
    `;
  }
}

ComponentRegistry.register('settings-page', SettingsPageElement);
export { SettingsPageElement };