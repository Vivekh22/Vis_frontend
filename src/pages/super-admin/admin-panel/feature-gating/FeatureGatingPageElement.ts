/**
 * FeatureGatingPageElement.ts — pages/super-admin/admin-panel/feature-gating/
 *
 * Per-client toggle list: IP-Based Frequency Capping, Advanced Rule
 * Engine, and any future flag.
 *
 * When disabled, the feature must be FULLY ABSENT from that client's
 * UI, not shown-but-locked. Client-side pages (Parts 8-10) that touch
 * these features have FeatureFlagService checks added — the flag being
 * off actually removes the UI element rather than disabling it.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { featureFlagService, clientService } from '../../../../services';
import { FeatureFlag, ALL_FEATURE_FLAGS } from '../../../../core/enums/FeatureFlag';
import type { ClientSummary } from '../../../../core/types/ClientSummary';
import '../../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .client-selector { padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); margin-bottom: var(--space-4); }
  .flag-row { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3); border-bottom: 1px solid var(--color-border); }
  .flag-row:last-child { border-bottom: none; }
  .flag-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); }
  .flag-desc { font-size: var(--font-size-xs); color: var(--color-text-muted); }
  .toggle { position: relative; display: inline-block; width: 44px; height: 22px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--color-danger); border-radius: var(--radius-full); transition: 0.3s; }
  .toggle-slider:before { content: ""; position: absolute; height: 18px; width: 18px; left: 2px; top: 2px; background: #fff; border-radius: 50%; transition: 0.3s; }
  .toggle input:checked + .toggle-slider { background: var(--color-success); }
  .toggle input:checked + .toggle-slider:before { transform: translateX(22px); }
`;

class FeatureGatingPageElement extends BaseComponent {
  private clients: ClientSummary[] = [];
  private selectedClientId = '';
  private flagStates: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('change', this.handleChange);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.clients = await clientService.listAssignedClients();
      if (this.clients.length > 0) {
        this.selectedClientId = this.clients[0]!.clientId;
        await this.loadFlags();
      }
    } catch {
      // Use empty state
    }
    this.isLoading = false;
    this.rerender();
  }

  private async loadFlags(): Promise<void> {
    if (!this.selectedClientId) return;
    try {
      this.flagStates = await featureFlagService.getAllFlags(this.selectedClientId);
    } catch {
      this.flagStates = {} as Record<FeatureFlag, boolean>;
    }
    this.rerender();
  }

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const selector = target.closest('[data-field="client-selector"]');
    if (selector) {
      this.selectedClientId = (selector as HTMLSelectElement).value;
      void this.loadFlags();
      return;
    }
    const toggle = target.closest('[data-flag]');
    if (toggle instanceof HTMLInputElement) {
      const flag = toggle.getAttribute('data-flag') as FeatureFlag;
      if (flag) {
        void featureFlagService.setEnabled(this.selectedClientId, flag, toggle.checked).then(() => this.loadFlags());
      }
    }
  };

  private flagLabel(flag: FeatureFlag): string {
    switch (flag) {
      case FeatureFlag.IpBasedFrequencyCapping: return 'IP-Based Frequency Capping';
      case FeatureFlag.AdvancedRuleEngine: return 'Advanced Rule Engine';
      default: return flag;
    }
  }

  private flagDesc(flag: FeatureFlag): string {
    switch (flag) {
      case FeatureFlag.IpBasedFrequencyCapping: return 'Cap ad frequency per IP address across devices.';
      case FeatureFlag.AdvancedRuleEngine: return 'Complex multi-condition targeting rules beyond standard filters.';
      default: return '';
    }
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    const options = this.clients.map((c) =>
      `<option value="${c.clientId}" ${c.clientId === this.selectedClientId ? 'selected' : ''}>${c.companyName}</option>`,
    ).join('');
    const rows = ALL_FEATURE_FLAGS.map((flag) => {
      const enabled = this.flagStates[flag] ?? false;
      return html`
        <div class="flag-row">
          <div>
            <div class="flag-label">${this.flagLabel(flag)}</div>
            <div class="flag-desc">${this.flagDesc(flag)}</div>
          </div>
          <label class="toggle">
            <input type="checkbox" data-flag="${flag}" ${enabled ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      `;
    }).join('');
    return html`
      <h1 class="page-title">Feature Gating</h1>
      <select class="client-selector" data-field="client-selector">${SafeHtmlString.trusted(options)}</select>
      <div>${SafeHtmlString.trusted(rows)}</div>
    `;
  }
}

ComponentRegistry.register('super-admin-feature-gating', FeatureGatingPageElement);
export { FeatureGatingPageElement };