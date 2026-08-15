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
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .tabs { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--color-border); margin-bottom: var(--space-6); flex-wrap: wrap; }
  .tab { padding: var(--space-2) var(--space-4); border: none; background: none; cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-muted); border-bottom: 2px solid transparent; }
  .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  .tab-content { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .form-group { margin-bottom: var(--space-3); }
  .form-label { font-size: var(--font-size-xs); color: var(--color-text-muted); display: block; margin-bottom: var(--space-1); }
  .form-input { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-text-primary); }
  .btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .btn.secondary { background: var(--color-bg); color: var(--color-text-primary); border: 1px solid var(--color-border); }
  .btn.danger { background: var(--color-danger); color: var(--color-danger-foreground); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .danger-zone { border: 2px solid var(--color-danger); border-radius: var(--radius-md); padding: var(--space-4); }
  .danger-zone h4 { color: var(--color-danger); font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); margin: 0 0 var(--space-2); }
  .danger-zone p { font-size: var(--font-size-sm); color: var(--color-text-primary); margin: 0 0 var(--space-3); }
  .impersonation-banner { background: #fef3c7; border: 1px solid #f59e0b; border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-3); font-size: var(--font-size-sm); color: #92400e; }
  .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-label { font-size: var(--font-size-sm); color: var(--color-text-primary); }
  .toggle { position: relative; width: 40px; height: 20px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--color-border); border-radius: var(--radius-full); transition: 0.3s; }
  .toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; top: 2px; background: white; border-radius: 50%; transition: 0.3s; }
  .toggle input:checked + .toggle-slider { background: var(--color-primary); }
  .toggle input:checked + .toggle-slider:before { transform: translateX(20px); }
  .section-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-3); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; }
  .modal { background: var(--color-surface); border-radius: var(--radius-md); padding: var(--space-6); min-width: 400px; }
  .modal-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0 0 var(--space-4); }
  .textarea { width: 100%; min-height: 80px; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-text-primary); resize: vertical; }
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
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" type="text" value="Client User" /></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" value="client@visprisca.ads" /></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" type="tel" value="+1-555-0100" /></div>
      <div class="form-group"><label class="form-label">Avatar</label><input class="form-input" type="file" /></div>
      <div class="form-group"><label class="form-label">Change Password</label><input class="form-input" type="password" placeholder="New password" /></div>
      <div class="form-group"><label class="form-label">Two-Factor Authentication</label><button class="btn secondary" type="button">Enable 2FA</button></div>
      <button class="btn" type="button">Save Changes</button>
    `;
  }

  private renderRegionalTab(): string {
    return `
      <div class="form-group"><label class="form-label">Timezone</label><select class="form-input"><option>Asia/Calcutta</option><option>America/New_York</option><option>Europe/London</option></select></div>
      <div class="form-group"><label class="form-label">Currency</label><select class="form-input"><option>USD</option><option>EUR</option><option>INR</option><option>GBP</option></select></div>
      <div class="form-group"><label class="form-label">Date Format</label><select class="form-input"><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></div>
      <button class="btn" type="button">Save Changes</button>
    `;
  }

  private renderNotificationsTab(): string {
    const types = ['Security', 'Campaign', 'Billing', 'Team', 'Integrations', 'Support', 'Platform'];
    const rows = types.map((t) => `
      <div class="toggle-row">
        <span class="toggle-label">${t}</span>
        <div class="toggle">
          <input type="checkbox" checked /><span class="toggle-slider"></span>
        </div>
      </div>
    `).join('');
    return `
      <div class="toggle-row"><span class="toggle-label">Email Notifications</span><div class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></div></div>
      <div class="toggle-row"><span class="toggle-label">In-App Notifications</span><div class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span></div></div>
      <div class="toggle-row"><span class="toggle-label">Daily Digest</span><div class="toggle"><input type="checkbox" /><span class="toggle-slider"></span></div></div>
      <p class="section-title" style="margin-top:var(--space-4);">Per-Type Toggles</p>
      ${rows}
    `;
  }

  private renderSecurityTab(): string {
    const impersonationSession = this.activeSessions.find((s) => s.isImpersonation);
    const impersonationBanner = impersonationSession
      ? `<div class="impersonation-banner">⚠ Active ${impersonationSession.actingAsRole ?? 'Admin'} impersonation session detected. Started at ${impersonationSession.lastActiveAt.toLocaleString()}.</div>`
      : '';
    const sessionRows = this.activeSessions.map((s) => `
      <tr>
        <td>${s.device}</td><td>${s.location}</td><td>${s.ipAddress}</td>
        <td>${s.lastActiveAt.toLocaleString()}</td>
        <td>${s.isCurrent ? '<strong>Current</strong>' : s.isImpersonation ? 'Impersonation' : 'Active'}</td>
        <td>${!s.isCurrent ? `<button class="btn secondary" data-action="terminate-session" data-session-id="${s.id}" type="button">Log Out</button>` : '—'}</td>
      </tr>
    `).join('');
    const historyRows = this.loginHistory.map((h) => `
      <tr>
        <td>${h.timestamp.toLocaleString()}</td><td>${h.ipAddress}</td><td>${h.device}</td>
        <td>${h.location}</td><td class="${h.success ? '' : 'text-danger'}">${h.success ? 'Success' : 'Failed'}</td>
      </tr>
    `).join('');
    return `
      ${impersonationBanner}
      <p class="section-title">Active Sessions</p>
      <table style="margin-bottom:var(--space-6);">
        <thead><tr><th>Device</th><th>Location</th><th>IP Address</th><th>Last Active</th><th>Status</th><th>Actions</th></tr></thead>
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
      <div class="danger-zone">
        <h4>Deactivate Account</h4>
        <p>Request account deactivation. This submits a request for admin review — your account will remain active until an administrator approves it.</p>
        <button class="btn danger" data-action="show-deactivate" type="button">Request Deactivation</button>
      </div>
    `;
  }

  private renderDeactivateModal(): string {
    if (this.deactivationSubmitted) {
      return `
        <div class="modal-overlay">
          <div class="modal">
            <h2 class="modal-title">Request Submitted</h2>
            <p style="font-size:var(--font-size-sm);color:var(--color-text-primary);margin-bottom:var(--space-4);">Your deactivation request has been submitted for admin review. Your account remains active until an administrator approves it.</p>
            <button class="btn" data-action="cancel-deactivate" type="button">Close</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="modal-overlay">
        <div class="modal">
          <h2 class="modal-title">Request Account Deactivation</h2>
          <p style="font-size:var(--font-size-sm);color:var(--color-text-primary);margin-bottom:var(--space-3);">This will submit a deactivation request for admin review. Your account will NOT be deleted immediately.</p>
          <div class="form-group">
            <label class="form-label">Reason for Deactivation</label>
            <textarea class="textarea" placeholder="Please tell us why you're leaving..."></textarea>
          </div>
          <div style="display:flex;gap:var(--space-3);">
            <button class="btn danger" data-action="confirm-deactivate" type="button">Submit Request</button>
            <button class="btn secondary" data-action="cancel-deactivate" type="button">Cancel</button>
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
    const tabsHtml = TABS.map((t) => `<button class="tab ${this.activeTab === t ? 'active' : ''}" data-tab="${t}" type="button">${labels[t]}</button>`).join('');
    return html`
      <h1 class="page-title">Settings</h1>
      <div class="tabs">${SafeHtmlString.trusted(tabsHtml)}</div>
      <div class="tab-content">${SafeHtmlString.trusted(this.renderTabContent())}</div>
      ${this.showDeactivateModal ? SafeHtmlString.trusted(this.renderDeactivateModal()) : ''}
    `;
  }
}

ComponentRegistry.register('settings-page', SettingsPageElement);
export { SettingsPageElement };