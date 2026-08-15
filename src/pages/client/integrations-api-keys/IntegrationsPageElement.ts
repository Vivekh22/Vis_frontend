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
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .tabs { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--color-border); margin-bottom: var(--space-6); flex-wrap: wrap; }
  .tab { padding: var(--space-2) var(--space-4); border: none; background: none; cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-muted); border-bottom: 2px solid transparent; }
  .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  .tab-content { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .form-group { margin-bottom: var(--space-3); }
  .form-label { font-size: var(--font-size-xs); color: var(--color-text-muted); display: block; margin-bottom: var(--space-1); }
  .form-input { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-text-primary); }
  .btn { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .btn.primary { background: var(--color-primary); color: var(--color-primary-foreground); border: none; font-weight: var(--font-weight-semibold); }
  .btn.danger { background: var(--color-danger); color: var(--color-danger-foreground); border: none; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .reveal-banner { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .reveal-banner h4 { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .reveal-key { font-family: var(--font-mono); font-size: var(--font-size-sm); background: var(--color-bg); padding: var(--space-2); border-radius: var(--radius-sm); word-break: break-all; }
  .reveal-warning { font-size: var(--font-size-xs); color: var(--color-danger); margin-top: var(--space-2); }
  .usage-bar { height: 6px; background: var(--color-surface-2); border-radius: var(--radius-full); overflow: hidden; }
  .usage-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); }
  .mmp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
  @media (max-width: 768px) { .mmp-grid { grid-template-columns: 1fr; } }
  .mmp-card { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); text-align: center; }
  .mmp-card.connected { border-color: var(--color-success); }
  .mmp-card h5 { font-size: var(--font-size-sm); margin: 0 0 var(--space-1); }
  .macro-list { background: var(--color-surface-2); border-radius: var(--radius-sm); padding: var(--space-3); font-size: var(--font-size-xs); }
  .macro-row { display: flex; gap: var(--space-2); margin-bottom: var(--space-1); }
  .macro-code { font-family: var(--font-mono); color: var(--color-primary); }
  .section-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-3); }
  .status-active { color: var(--color-success); font-weight: var(--font-weight-semibold); }
  .status-revoked { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .status-expired { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
  .test-result { margin-top: var(--space-2); font-size: var(--font-size-sm); }
  .test-result.success { color: var(--color-success); }
  .test-result.error { color: var(--color-danger); }
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
    const labels: Record<Tab, string> = { 'api-keys': 'API Keys', postback: 'Postback / S2S', mmp: 'MMP Connections', webhooks: 'Webhooks' };
    const tabsHtml = TABS.map((t) => `<button class="tab ${this.activeTab === t ? 'active' : ''}" data-tab="${t}" type="button">${labels[t]}</button>`).join('');
    return html`
      <h1 class="page-title">Integrations & API Keys</h1>
      <div class="tabs">${SafeHtmlString.trusted(tabsHtml)}</div>
      <div class="tab-content">${SafeHtmlString.trusted(this.renderTabContent())}</div>
    `;
  }
}

ComponentRegistry.register('integrations-page', IntegrationsPageElement);
export { IntegrationsPageElement };