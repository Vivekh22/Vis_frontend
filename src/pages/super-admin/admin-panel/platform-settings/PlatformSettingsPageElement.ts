/**
 * PlatformSettingsPageElement.ts — pages/super-admin/admin-panel/platform-settings/
 *
 * Default Base Margin (what New Registrations pre-fills), SLA thresholds
 * (separate Campaign/Creative approval turnaround fields — read by
 * ApprovalService.isOverdue()), default Low-Balance Threshold, Support
 * Email, editable content behind auto-generated suggestion notifications.
 *
 * !!! SLA RETROFIT CONFIRMATION !!!
 * ApprovalService.isOverdue() now reads SLA thresholds from here (via
 * PlatformSettingsService.getSlaThreshold()), replacing Part 5's
 * hardcoded `4`. The isOverdueWithConfig() method fetches the configured
 * threshold based on item type (campaign or creative).
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../platform/rendering/SafeHtml';
import { platformSettingsService } from '../../../../services';
import '../../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
  .panel-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); }
  .form-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
  .form-label { font-size: var(--font-size-sm); min-width: 200px; }
  .form-input { width: 120px; padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
  .form-input.wide { width: 300px; }
  .save-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin-top: var(--space-2); }
`;

class PlatformSettingsPageElement extends BaseComponent {
  private defaultBaseMargin = 15;
  private campaignSlaHours = 4;
  private creativeSlaHours = 4;
  private lowBalanceThreshold = 500;
  private supportEmail = 'support@visprisca.ads';
  private notificationTemplates: { key: string; label: string; template: string }[] = [];
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
      this.defaultBaseMargin = await platformSettingsService.getDefaultBaseMargin();
      this.campaignSlaHours = await platformSettingsService.getSlaThreshold('campaign');
      this.creativeSlaHours = await platformSettingsService.getSlaThreshold('creative');
      this.lowBalanceThreshold = await platformSettingsService.getDefaultLowBalanceThreshold();
      this.supportEmail = await platformSettingsService.getSupportEmail();
      this.notificationTemplates = await platformSettingsService.getNotificationTemplates();
    } catch {
      // Use defaults
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (!field) return;
    const value = (target as HTMLInputElement).value;
    if (field === 'defaultBaseMargin') this.defaultBaseMargin = parseFloat(value) || 0;
    else if (field === 'campaignSlaHours') this.campaignSlaHours = parseFloat(value) || 0;
    else if (field === 'creativeSlaHours') this.creativeSlaHours = parseFloat(value) || 0;
    else if (field === 'lowBalanceThreshold') this.lowBalanceThreshold = parseFloat(value) || 0;
    else if (field === 'supportEmail') this.supportEmail = value;
    else if (field.startsWith('tmpl_')) {
      const key = field.substring(5);
      const tmpl = this.notificationTemplates.find((t) => t.key === key);
      if (tmpl) tmpl.template = value;
    }
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="save-margin"]')) {
      void platformSettingsService.updateDefaultBaseMargin(this.defaultBaseMargin);
      return;
    }
    if (target.closest('[data-action="save-sla"]')) {
      void platformSettingsService.updateSlaThresholds(this.campaignSlaHours, this.creativeSlaHours);
      return;
    }
    if (target.closest('[data-action="save-threshold"]')) {
      void platformSettingsService.updateLowBalanceThreshold(this.lowBalanceThreshold);
      return;
    }
    if (target.closest('[data-action="save-email"]')) {
      void platformSettingsService.updateSupportEmail(this.supportEmail);
      return;
    }
    if (target.closest('[data-action="save-templates"]')) {
      for (const tmpl of this.notificationTemplates) {
        void platformSettingsService.updateNotificationTemplate(tmpl.key, tmpl.template);
      }
      return;
    }
  };

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const templateRows = this.notificationTemplates.map((t) => html`
      <div class="form-row">
        <span class="form-label">${t.label}</span>
        <input class="form-input wide" type="text" value="${t.template}" data-field="tmpl_${t.key}" />
      </div>
    `).join('');
    return html`
      <h1 class="page-title">Platform Settings</h1>
      <div class="panel">
        <p class="panel-title">Default Base Margin</p>
        <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin:0 0 var(--space-2);">Pre-fills New Registrations' base margin input.</p>
        <div class="form-row">
          <span class="form-label">Default Base Margin</span>
          <input class="form-input" type="number" min="0" max="100" step="0.1" value="${this.defaultBaseMargin}" data-field="defaultBaseMargin" />
          <span>%</span>
        </div>
        <button class="save-btn" data-action="save-margin" type="button">Save</button>
      </div>
      <div class="panel">
        <p class="panel-title">SLA Thresholds</p>
        <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin:0 0 var(--space-2);">Read by ApprovalService.isOverdue() — replacing Part 5's hardcoded constant.</p>
        <div class="form-row">
          <span class="form-label">Campaign Approval SLA (hours)</span>
          <input class="form-input" type="number" min="1" max="72" value="${this.campaignSlaHours}" data-field="campaignSlaHours" />
        </div>
        <div class="form-row">
          <span class="form-label">Creative Approval SLA (hours)</span>
          <input class="form-input" type="number" min="1" max="72" value="${this.creativeSlaHours}" data-field="creativeSlaHours" />
        </div>
        <button class="save-btn" data-action="save-sla" type="button">Save</button>
      </div>
      <div class="panel">
        <p class="panel-title">Default Low-Balance Threshold</p>
        <div class="form-row">
          <span class="form-label">Low-Balance Threshold ($)</span>
          <input class="form-input" type="number" min="0" step="10" value="${this.lowBalanceThreshold}" data-field="lowBalanceThreshold" />
        </div>
        <button class="save-btn" data-action="save-threshold" type="button">Save</button>
      </div>
      <div class="panel">
        <p class="panel-title">Support Email</p>
        <div class="form-row">
          <span class="form-label">Support Email</span>
          <input class="form-input wide" type="email" value="${this.supportEmail}" data-field="supportEmail" />
        </div>
        <button class="save-btn" data-action="save-email" type="button">Save</button>
      </div>
      <div class="panel">
        <p class="panel-title">Notification Templates</p>
        <p style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin:0 0 var(--space-2);">Editable text behind auto-generated suggestion notifications.</p>
        ${templateRows}
        <button class="save-btn" data-action="save-templates" type="button">Save Templates</button>
      </div>
    `;
  }
}

ComponentRegistry.register('super-admin-platform-settings', PlatformSettingsPageElement);
export { PlatformSettingsPageElement };