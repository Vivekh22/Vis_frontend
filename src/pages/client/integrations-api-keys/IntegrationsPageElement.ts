/**
 * IntegrationsPageElement.ts — pages/client/integrations-api-keys/
 *
 * API Keys: generate (one-time reveal, masked thereafter), usage bar, revoke.
 * Postback/S2S: URL + event type config, macro cheat-sheet, Test Postback.
 * MMP Connections: prebuilt cards + custom fallback.
 * Webhooks: platform-event subscriptions.
 *
 * !!! API KEY ONE-TIME REVEAL !!!
 *   generateKey() returns the real key ONCE. After display, only the masked
 *   representation is stored in component state. The real key variable is
 *   cleared (set to '') after the reveal screen renders — it is never
 *   retained in app state after the reveal closes.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { apiKeyService, integrationService, masterIntegrationService } from '../../../services';
import type { ApiKey } from '../../../core/entities/ApiKey';
import type { IntegrationConfig } from '../../../core/entities/IntegrationConfig';
import type { WebhookConfig } from '../../../core/entities/WebhookConfig';
import type { MasterMmpEntry } from '../../../services/MasterIntegrationService';
import { WebhookEvent } from '../../../core/enums/WebhookEvent';

const TABS = ['api-keys', 'postback', 'mmp', 'webhooks'] as const;
type Tab = (typeof TABS)[number];

// MMP provider list now comes from MasterIntegrationService (Part 13's
// Master Integration Lists page) — single source of truth, not hardcoded.
// Loaded asynchronously in loadData() into this.mmpProviders.


const MACRO_CHEAT_SHEET = [
  { macro: '{event_name}', desc: 'The event name (e.g. install, click)' },
  { macro: '{click_id}', desc: 'Unique click identifier' },
  { macro: '{campaign_id}', desc: 'Campaign ID' },
  { macro: '{creative_id}', desc: 'Creative ID' },
  { macro: '{site_id}', desc: 'Publisher / Site ID' },
  { macro: '{device_id}', desc: 'Device advertising ID' },
  { macro: '{timestamp}', desc: 'Event timestamp (Unix epoch)' },
];

const WEBHOOK_EVENTS = [
  { value: WebhookEvent.CampaignApproved, label: 'Campaign Approved' },
  { value: WebhookEvent.CampaignRejected, label: 'Campaign Rejected' },
  { value: WebhookEvent.CampaignPaused, label: 'Campaign Paused' },
  { value: WebhookEvent.FundCredited, label: 'Fund Credited' },
  { value: WebhookEvent.InvoiceGenerated, label: 'Invoice Generated' },
  { value: WebhookEvent.CreativeApproved, label: 'Creative Approved' },
  { value: WebhookEvent.CreativeRejected, label: 'Creative Rejected' },
  { value: WebhookEvent.TeamMemberInvited, label: 'Team Member Invited' },
];

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
  .tab:hover:not(.active) { color: #374151; background: #f1f5f9; }

  /* Card */
  .card { background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .card-title { font-size: 15px; font-weight: 600; color: #111827; margin: 0 0 20px 0; }
  .section-title { font-size: 13px; font-weight: 600; color: #374151; margin: 20px 0 12px 0; }
  .section-title:first-child { margin-top: 0; }

  /* Form */
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .form-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: #fcfdfd; color: #1e293b; outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: #3b66f5; background: white; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }

  /* Buttons */
  .btn-primary { padding: 10px 20px; background: #3b66f5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .btn-secondary { padding: 8px 14px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 500; }
  .btn-danger { padding: 8px 14px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; }
  .btn-sm { padding: 6px 12px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; }

  /* Table */
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid #f8fafc; font-size: 13px; }
  th { font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; background: #fcfdfd; }
  tr:last-child td { border-bottom: none; }

  /* Reveal Banner */
  .reveal-banner { background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
  .reveal-banner h4 { font-size: 14px; font-weight: 700; color: #92400e; margin: 0 0 10px 0; }
  .reveal-key { font-family: monospace; font-size: 12px; background: white; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 8px; word-break: break-all; color: #1e293b; }
  .reveal-warning { font-size: 12px; color: #dc2626; margin: 10px 0 12px 0; font-weight: 500; }

  /* Usage Bar */
  .usage-bar { height: 6px; background: #f1f5f9; border-radius: 6px; overflow: hidden; margin-top: 4px; }
  .usage-fill { height: 100%; background: #3b66f5; border-radius: 6px; }

  /* MMP Grid */
  .mmp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 768px) { .mmp-grid { grid-template-columns: 1fr; } }
  .mmp-card { border: 1px solid #eef0f4; border-radius: 10px; padding: 20px; text-align: center; background: #fcfdfd; }
  .mmp-card.connected { border-color: #bbf7d0; background: #f0fdf4; }
  .mmp-card h5 { font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 6px 0; }
  .mmp-status { font-size: 12px; margin: 0 0 12px 0; }
  .mmp-status.connected { color: #16a34a; }
  .mmp-status.disconnected { color: #94a3b8; }

  /* Macro list */
  .macro-list { background: #f8fafc; border: 1px solid #eef0f4; border-radius: 8px; padding: 16px; }
  .macro-row { display: flex; gap: 12px; margin-bottom: 8px; font-size: 12px; align-items: baseline; }
  .macro-row:last-child { margin-bottom: 0; }
  .macro-code { font-family: monospace; color: #3b66f5; background: #eff3ff; padding: 2px 6px; border-radius: 4px; font-size: 11px; white-space: nowrap; }
  .macro-desc { color: #475569; }

  /* Webhook events */
  .event-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .event-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #374151; padding: 4px 0; }

  /* Pills */
  .pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .pill.green { background: #e5f5eb; color: #16a34a; border: 1px solid #bbf7d0; }
  .pill.red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .pill.gray { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

  /* Test result */
  .test-result { margin-top: 12px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; }
  .test-result.success { background: #e5f5eb; color: #16a34a; border: 1px solid #bbf7d0; }
  .test-result.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

  /* Readonly */
  .readonly-notice { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; color: #92400e; font-weight: 500; }
`;

class IntegrationsPageElement extends BaseComponent {
  private activeTab: Tab = 'api-keys';
  private apiKeys: ApiKey[] = [];
  private newKeyName = '';
  private newKeyScope = 'full';
  private newKeyExpiry = 365;
  private revealedKey: string | null = null;
  private integrations: IntegrationConfig[] = [];
  private webhooks: WebhookConfig[] = [];
  private postbackUrl = '';
  private postbackEvent = 'install';
  private postbackResult: { success: boolean; message: string } | null = null;
  private newWebhookUrl = '';
  private newWebhookEvents: Set<string> = new Set();
  private mmpProviders: MasterMmpEntry[] = [];
  private readOnly = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.readOnly = this.hasAttribute('read-only');
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('change', this.handleChange);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private async loadData(): Promise<void> {
    try {
      this.apiKeys = await apiKeyService.listKeys('client-1');
      this.integrations = await integrationService.listIntegrations('client-1');
      this.webhooks = await integrationService.listWebhooks('client-1');
      this.mmpProviders = await masterIntegrationService.getMmpList();
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
    if (target.closest('[data-action="generate-key"]')) {
      if (this.readOnly) return; // Read-only enforcement
      void this.generateKey();
      return;
    }
    if (target.closest('[data-action="dismiss-reveal"]')) {
      this.revealedKey = null;
      this.rerender();
      return;
    }
    const revokeBtn = target.closest('[data-action="revoke-key"]');
    if (revokeBtn) {
      if (this.readOnly) return; // Read-only enforcement
      const id = revokeBtn.getAttribute('data-key-id') ?? '';
      void apiKeyService.revokeKey(id);
      void this.loadData();
      return;
    }
    if (target.closest('[data-action="test-postback"]')) {
      void this.testPostback();
      return;
    }
    const webhookEvent = target.closest('[data-webhook-event]');
    if (webhookEvent) {
      const evt = webhookEvent.getAttribute('data-webhook-event') ?? '';
      if (this.newWebhookEvents.has(evt)) this.newWebhookEvents.delete(evt);
      else this.newWebhookEvents.add(evt);
      this.rerender();
      return;
    }
    if (target.closest('[data-action="create-webhook"]')) {
      if (this.readOnly) return; // Read-only enforcement
      void this.createWebhook();
      return;
    }
    const deleteWebhookBtn = target.closest('[data-action="delete-webhook"]');
    if (deleteWebhookBtn) {
      if (this.readOnly) return; // Read-only enforcement
      const id = deleteWebhookBtn.getAttribute('data-webhook-id') ?? '';
      void integrationService.deleteWebhook(id);
      void this.loadData();
      return;
    }
    const disconnectBtn = target.closest('[data-action="disconnect-mmp"]');
    if (disconnectBtn) {
      if (this.readOnly) return; // Read-only enforcement
      const id = disconnectBtn.getAttribute('data-integration-id') ?? '';
      void integrationService.disconnectIntegration(id);
      void this.loadData();
      return;
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.name === 'key-name') this.newKeyName = target.value;
    if (target.name === 'key-scope') this.newKeyScope = target.value;
    if (target.name === 'key-expiry') this.newKeyExpiry = parseInt(target.value, 10);
    if (target.name === 'postback-url') this.postbackUrl = target.value;
    if (target.name === 'postback-event') this.postbackEvent = target.value;
    if (target.name === 'webhook-url') this.newWebhookUrl = target.value;
  };

  private async generateKey(): Promise<void> {
    const result = await apiKeyService.generateKey({
      clientId: 'client-1',
      name: this.newKeyName || 'New API Key',
      scope: this.newKeyScope,
      expiryDays: this.newKeyExpiry,
    });
    this.revealedKey = result.realKey;
    this.newKeyName = '';
    await this.loadData();
    // The real key is in this.revealedKey for ONE-TIME display.
    // When the user dismisses the reveal banner, this.revealedKey is set to null.
  }

  private async testPostback(): Promise<void> {
    const result = await integrationService.testPostback(this.postbackUrl, this.postbackEvent);
    this.postbackResult = result;
    this.rerender();
  }

  private async createWebhook(): Promise<void> {
    if (!this.newWebhookUrl || this.newWebhookEvents.size === 0) return;
    await integrationService.createWebhook({
      clientId: 'client-1',
      url: this.newWebhookUrl,
      events: Array.from(this.newWebhookEvents) as never[],
    });
    this.newWebhookUrl = '';
    this.newWebhookEvents.clear();
    await this.loadData();
  }

  private renderApiKeysTab(): string {
    if (this.readOnly) {
      const rows = this.apiKeys.length === 0
        ? '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);">No API keys</td></tr>'
        : this.apiKeys.map((k) => `<tr><td>${k.name}</td><td style="font-family:var(--font-mono);">${k.maskedKey}</td><td>${k.scope}</td><td>${k.status}</td><td>${k.expiresAt ? k.expiresAt.toLocaleDateString() : 'Never'}</td></tr>`).join('');
      return `<p class="readonly-notice" style="font-size:var(--font-size-xs);color:var(--color-text-muted);font-style:italic;margin-bottom:var(--space-3);">Viewing integrations in read-only mode.</p><table><thead><tr><th>Name</th><th>Key</th><th>Scope</th><th>Status</th><th>Expires</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    const revealBanner = this.revealedKey
      ? `<div class="reveal-banner">
          <h4>API Key Generated — Copy Now!</h4>
          <div class="reveal-key">${this.revealedKey}</div>
          <p class="reveal-warning">This key will not be shown again. Copy it now and store it securely.</p>
          <button class="btn" data-action="dismiss-reveal" type="button">I've Copied It</button>
        </div>`
      : '';
    const rows = this.apiKeys.length === 0
      ? '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);">No API keys yet</td></tr>'
      : this.apiKeys.map((k) => {
          const statusClass = k.status === 'active' ? 'status-active' : k.status === 'revoked' ? 'status-revoked' : 'status-expired';
          return `<tr>
            <td>${k.name}</td>
            <td style="font-family:var(--font-mono);">${k.maskedKey}</td>
            <td>${k.scope}</td>
            <td class="${statusClass}">${k.status}</td>
            <td>${k.expiresAt ? k.expiresAt.toLocaleDateString() : 'Never'}</td>
            <td>${k.status === 'active' ? `<button class="btn danger" data-action="revoke-key" data-key-id="${k.id}" type="button">Revoke</button>` : '—'}</td>
          </tr>`;
        }).join('');
    return `
      ${revealBanner}
      <div class="form-group">
        <label class="form-label">Key Name</label>
        <input class="form-input" type="text" name="key-name" value="${this.newKeyName}" placeholder="e.g. Production API" />
      </div>
      <div class="form-group">
        <label class="form-label">Scope</label>
        <select class="form-input" name="key-scope">
          <option value="full" ${this.newKeyScope === 'full' ? 'selected' : ''}>Full Access</option>
          <option value="read" ${this.newKeyScope === 'read' ? 'selected' : ''}>Read Only</option>
          <option value="write" ${this.newKeyScope === 'write' ? 'selected' : ''}>Write Only</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Expiry (days)</label>
        <input class="form-input" type="number" name="key-expiry" value="${this.newKeyExpiry}" />
      </div>
      <button class="btn primary" data-action="generate-key" type="button">Generate Key</button>
      <table style="margin-top:var(--space-4);">
        <thead><tr><th>Name</th><th>Key</th><th>Scope</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private renderPostbackTab(): string {
    const macros = MACRO_CHEAT_SHEET.map((m) => `<div class="macro-row"><span class="macro-code">${m.macro}</span><span>${m.desc}</span></div>`).join('');
    const testResult = this.postbackResult
      ? `<div class="test-result ${this.postbackResult.success ? 'success' : 'error'}">${this.postbackResult.message}</div>`
      : '';
    if (this.readOnly) {
      return `<p class="readonly-notice" style="font-size:var(--font-size-xs);color:var(--color-text-muted);font-style:italic;margin-bottom:var(--space-3);">Viewing in read-only mode.</p><div class="form-group"><label class="form-label">Postback URL</label><input class="form-input" type="text" value="${this.postbackUrl}" readonly /></div><div style="margin-top:var(--space-4);"><p class="section-title">Macro Cheat Sheet</p><div class="macro-list">${macros}</div></div>`;
    }
    return `
      <div class="form-group">
        <label class="form-label">Postback URL</label>
        <input class="form-input" type="text" name="postback-url" value="${this.postbackUrl}" placeholder="https://example.com/postback?event={event_name}&click_id={click_id}" />
      </div>
      <div class="form-group">
        <label class="form-label">Event Type</label>
        <select class="form-input" name="postback-event">
          <option value="install" ${this.postbackEvent === 'install' ? 'selected' : ''}>Install</option>
          <option value="click" ${this.postbackEvent === 'click' ? 'selected' : ''}>Click</option>
          <option value="conversion" ${this.postbackEvent === 'conversion' ? 'selected' : ''}>Conversion</option>
        </select>
      </div>
      <button class="btn primary" data-action="test-postback" type="button">Test Postback</button>
      ${testResult}
      <div style="margin-top:var(--space-4);">
        <p class="section-title">Macro Cheat Sheet</p>
        <div class="macro-list">${macros}</div>
      </div>
    `;
  }

  private renderMmpTab(): string {
    const cards = this.mmpProviders.map((p) => {
      const integration = this.integrations.find((i) => i.provider === p.providerKey);
      const connected = integration?.isConnected ?? false;
      return `<div class="mmp-card ${connected ? 'connected' : ''}">
        <h5>${p.name}</h5>
        <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin:var(--space-1) 0;">${connected ? 'Connected' : 'Not Connected'}</p>
        ${connected ? `<button class="btn danger" data-action="disconnect-mmp" data-integration-id="${integration?.id ?? ''}" type="button">Disconnect</button>` : `<button class="btn" type="button">Connect</button>`}
      </div>`;
    }).join('');
    return `<div class="mmp-grid">${cards}</div>`;
  }

  private renderWebhooksTab(): string {
    if (this.readOnly) {
      const rows = this.webhooks.length === 0
        ? '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);">No webhooks configured</td></tr>'
        : this.webhooks.map((w) => `<tr><td>${w.url}</td><td>${w.events.join(', ')}</td><td>${w.isActive ? 'Active' : 'Inactive'}</td></tr>`).join('');
      return `<p class="readonly-notice" style="font-size:var(--font-size-xs);color:var(--color-text-muted);font-style:italic;margin-bottom:var(--space-3);">Viewing in read-only mode.</p><table><thead><tr><th>URL</th><th>Events</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    const eventCheckboxes = WEBHOOK_EVENTS.map((e) => {
      const checked = this.newWebhookEvents.has(e.value);
      return `<div class="macro-row"><input type="checkbox" data-webhook-event="${e.value}" ${checked ? 'checked' : ''} /><span>${e.label}</span></div>`;
    }).join('');
    const rows = this.webhooks.length === 0
      ? '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);">No webhooks configured</td></tr>'
      : this.webhooks.map((w) => `<tr><td>${w.url}</td><td>${w.events.join(', ')}</td><td>${w.isActive ? 'Active' : 'Inactive'}</td><td><button class="btn danger" data-action="delete-webhook" data-webhook-id="${w.id}" type="button">Delete</button></td></tr>`).join('');
    return `
      <div class="form-group">
        <label class="form-label">Webhook URL</label>
        <input class="form-input" type="text" name="webhook-url" value="${this.newWebhookUrl}" placeholder="https://example.com/webhooks/visprisca" />
      </div>
      <p class="section-title">Events to Subscribe</p>
      <div class="macro-list" style="margin-bottom:var(--space-3);">${eventCheckboxes}</div>
      <button class="btn primary" data-action="create-webhook" type="button">Create Webhook</button>
      <table style="margin-top:var(--space-4);">
        <thead><tr><th>URL</th><th>Events</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private renderTabContent(): string {
    switch (this.activeTab) {
      case 'api-keys': return this.renderApiKeysTab();
      case 'postback': return this.renderPostbackTab();
      case 'mmp': return this.renderMmpTab();
      case 'webhooks': return this.renderWebhooksTab();
      default: return '';
    }
  }

  protected renderTemplate(): string {
    const labels: Record<Tab, string> = { 'api-keys': '🔑 API Keys', postback: '📡 Postback / S2S', mmp: '🔗 MMP Connections', webhooks: '🔔 Webhooks' };
    const tabsHtml = TABS.map((t) => `<button class="tab ${this.activeTab === t ? 'active' : ''}" data-tab="${t}" type="button">${labels[t]}</button>`).join('');
    return html`
      <div class="page-header">
        <h1 class="page-title">Integrations & API Keys</h1>
        <p class="page-subtitle">Manage API keys, postback URLs, MMP connections, and webhooks</p>
      </div>
      <div class="tab-bar">${SafeHtmlString.trusted(tabsHtml)}</div>
      <div class="card">${SafeHtmlString.trusted(this.renderTabContent())}</div>
    `;
  }
}

ComponentRegistry.register('integrations-page', IntegrationsPageElement);
export { IntegrationsPageElement };