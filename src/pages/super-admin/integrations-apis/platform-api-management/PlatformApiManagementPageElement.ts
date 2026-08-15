/**
 * PlatformApiManagementPageElement.ts — pages/super-admin/integrations-apis/platform-api-management/
 *
 * Platform-level API keys (distinct from client-level ApiKey in Part 10),
 * platform-wide rate-limit config, webhook-delivery health aggregated
 * across all clients.
 *
 * !!! API KEY ONE-TIME REVEAL !!!
 *   createPlatformApiKey() returns the real key ONCE. After display, only
 *   the masked representation is stored. The real key variable is cleared
 *   after the reveal screen renders — never retained in app state.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { platformApiService } from '../../../../services';
import type { PlatformApiKey, WebhookDeliveryHealth } from '../../../../services/PlatformApiService';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .panel-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); }
  .form-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
  .form-label { font-size: var(--font-size-sm); min-width: 160px; }
  .form-input { width: 120px; padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
  .form-input.wide { width: 300px; }
  .btn { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .btn.primary { background: var(--color-primary); color: var(--color-primary-foreground); border: none; font-weight: var(--font-weight-semibold); }
  .btn.danger { background: var(--color-danger); color: var(--color-danger-foreground); border: none; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .reveal-banner { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .reveal-key { font-family: var(--font-mono); font-size: var(--font-size-sm); background: var(--color-bg); padding: var(--space-2); border-radius: var(--radius-sm); word-break: break-all; }
  .reveal-warning { font-size: var(--font-size-xs); color: var(--color-danger); margin-top: var(--space-2); }
  .status-active { color: var(--color-success); font-weight: var(--font-weight-semibold); }
  .status-revoked { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .status-expired { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
`;

class PlatformApiManagementPageElement extends BaseComponent {
  private apiKeys: PlatformApiKey[] = [];
  private webhookHealth: WebhookDeliveryHealth[] = [];
  private defaultLimit = 1000;
  private burstLimit = 2000;
  private revealedKey: string | null = null;
  private newKeyName = '';
  private newKeyScope = 'read';
  private newKeyRateLimit = 1000;
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      const [keys, health, rateConfig] = await Promise.all([
        platformApiService.listPlatformApiKeys(),
        platformApiService.getWebhookDeliveryHealth(),
        platformApiService.getPlatformRateLimitConfig(),
      ]);
      this.apiKeys = keys;
      this.webhookHealth = health;
      this.defaultLimit = rateConfig.defaultLimit;
      this.burstLimit = rateConfig.burstLimit;
    } catch {
      // Use empty state
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.name === 'key-name') this.newKeyName = target.value;
    else if (target.name === 'key-scope') this.newKeyScope = target.value;
    else if (target.name === 'key-rate-limit') this.newKeyRateLimit = parseInt(target.value, 10) || 0;
    else if (target.name === 'default-limit') this.defaultLimit = parseInt(target.value, 10) || 0;
    else if (target.name === 'burst-limit') this.burstLimit = parseInt(target.value, 10) || 0;
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="generate-key"]')) {
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
      const id = revokeBtn.getAttribute('data-key-id') ?? '';
      void platformApiService.revokePlatformApiKey(id).then(() => this.loadData());
      return;
    }
    if (target.closest('[data-action="save-rate-limit"]')) {
      void platformApiService.updatePlatformRateLimitConfig(this.defaultLimit, this.burstLimit);
      return;
    }
  };

  private async generateKey(): Promise<void> {
    const result = await platformApiService.createPlatformApiKey(
      this.newKeyName || 'New Platform API Key',
      this.newKeyScope,
      this.newKeyRateLimit,
    );
    this.revealedKey = result.realKey;
    this.newKeyName = '';
    await this.loadData();
    // Real key is in this.revealedKey for ONE-TIME display only.
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const revealBanner = this.revealedKey
      ? html`<div class="reveal-banner">
          <h4 style="font-size:var(--font-size-sm);font-weight:var(--font-weight-bold);margin:0 0 var(--space-2);">Platform API Key Generated — Copy Now!</h4>
          <div class="reveal-key">${this.revealedKey}</div>
          <p class="reveal-warning">This key will not be shown again. Copy it now and store it securely.</p>
          <button class="btn" data-action="dismiss-reveal" type="button">I've Copied It</button>
        </div>`
      : '';

    const keyRows = this.apiKeys.map((k) => {
      const statusClass = k.status === 'active' ? 'status-active' : k.status === 'revoked' ? 'status-revoked' : 'status-expired';
      return html`<tr>
        <td>${k.name}</td>
        <td style="font-family:var(--font-mono);">${k.maskedKey}</td>
        <td>${k.issuedTo}</td>
        <td>${k.scope}</td>
        <td class="${statusClass}">${k.status}</td>
        <td>${k.rateLimit}</td>
        <td>${k.expiresAt ? k.expiresAt.toLocaleDateString() : 'Never'}</td>
        <td>${k.status === 'active' ? html`<button class="btn danger" data-action="revoke-key" data-key-id="${k.id}" type="button">Revoke</button>` : '—'}</td>
      </tr>`;
    }).join('');

    const healthRows = this.webhookHealth.map((w) => html`<tr>
      <td>${w.clientName}</td>
      <td>${w.totalDeliveries.toLocaleString()}</td>
      <td>${w.successRate}%</td>
      <td>${w.failedDeliveries}</td>
      <td>${w.lastFailure ? w.lastFailure.toLocaleDateString() : '—'}</td>
    </tr>`).join('');

    return html`
      <h1 class="page-title">Platform API Management</h1>
      ${SafeHtmlString.trusted(revealBanner)}
      <div class="panel">
        <p class="panel-title">Issue Platform API Key</p>
        <div class="form-row"><span class="form-label">Key Name</span><input class="form-input wide" type="text" name="key-name" value="${this.newKeyName}" placeholder="e.g. Partner Integration" /></div>
        <div class="form-row"><span class="form-label">Scope</span>
          <select class="form-input" name="key-scope">
            <option value="read" ${this.newKeyScope === 'read' ? 'selected' : ''}>Read Only</option>
            <option value="write" ${this.newKeyScope === 'write' ? 'selected' : ''}>Write Only</option>
            <option value="full" ${this.newKeyScope === 'full' ? 'selected' : ''}>Full Access</option>
          </select>
        </div>
        <div class="form-row"><span class="form-label">Rate Limit (req/min)</span><input class="form-input" type="number" name="key-rate-limit" value="${this.newKeyRateLimit}" /></div>
        <button class="btn primary" data-action="generate-key" type="button">Generate Key</button>
      </div>
      <div class="panel">
        <p class="panel-title">Platform API Keys</p>
        <table><thead><tr><th>Name</th><th>Key</th><th>Issued To</th><th>Scope</th><th>Status</th><th>Rate Limit</th><th>Expires</th><th>Actions</th></tr></thead><tbody>${SafeHtmlString.trusted(keyRows)}</tbody></table>
      </div>
      <div class="panel">
        <p class="panel-title">Platform Rate Limit Configuration</p>
        <div class="form-row"><span class="form-label">Default Rate Limit (req/min)</span><input class="form-input" type="number" name="default-limit" value="${this.defaultLimit}" /></div>
        <div class="form-row"><span class="form-label">Burst Limit (req/min)</span><input class="form-input" type="number" name="burst-limit" value="${this.burstLimit}" /></div>
        <button class="btn primary" data-action="save-rate-limit" type="button">Save</button>
      </div>
      <div class="panel">
        <p class="panel-title">Webhook Delivery Health (All Clients)</p>
        <table><thead><tr><th>Client</th><th>Total Deliveries</th><th>Success Rate</th><th>Failed</th><th>Last Failure</th></tr></thead><tbody>${SafeHtmlString.trusted(healthRows)}</tbody></table>
      </div>
    `;
  }
}

ComponentRegistry.register('super-admin-platform-api-management', PlatformApiManagementPageElement);
export { PlatformApiManagementPageElement };