/**
 * StepAdDomain.ts — Step 2 of campaign wizard.
 *
 * Search existing domain or create new; App Bundle vs Website radio-card
 * selector. App Bundle reveals an "Enable SKAD Network" checkbox conditionally.
 */
import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../../platform/rendering/SafeHtml';
import type { StepComponent } from '../campaign-wizard-types';
import type { CampaignFormData } from '../campaign-wizard-types';
import { isNotEmpty } from '../../../../../utils/validators';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-content { display: flex; flex-direction: column; gap: var(--space-4); max-width: 800px; }
  .field { display: flex; flex-direction: column; gap: var(--space-1); }
  .field-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
  .field-input {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    background: var(--color-bg);
  }
  .top-actions { display: flex; gap: var(--space-4); align-items: center; }
  .search-input-wrapper { position: relative; flex: 1; }
  .search-input-wrapper svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); }
  .search-input-wrapper input { width: 100%; padding-left: 36px; }
  .btn-create-new {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: 600;
  }
  .btn-create-new.active { border-color: var(--color-primary); color: var(--color-primary); }
  .radio-group { display: flex; gap: var(--space-4); align-items: center; margin-top: var(--space-4); }
  .radio-card {
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    flex: 1;
    min-height: 120px;
  }
  .radio-card.active { border-color: var(--color-primary); background: var(--color-surface-2); }
  .radio-card-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); text-transform: uppercase; }
  .checkbox-field { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-4); }
  .checkbox-field input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--color-primary); }
  .helper-text { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-top: var(--space-2); font-weight: 600; }
  .or-divider { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-muted); }
`;

class StepAdDomain extends BaseComponent implements StepComponent {
  private _data: CampaignFormData | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: CampaignFormData) {
    this._data = value;
    this.rerender();
  }

  protected onMount(): void {
    this.shadow.addEventListener('change', this.handleChange);
    this.shadow.addEventListener('input', this.handleChange);
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('change', this.handleChange);
    this.shadow.removeEventListener('input', this.handleChange);
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (!field || !this._data) return;
    const value = (target as HTMLInputElement).value;
    const checked = (target as HTMLInputElement).checked;
    const newData = { ...this._data, [field]: field === 'enableSkadNetwork' ? checked : value };
    this._data = newData;
    this.emitDataChanged(newData);
    this.emitValidity(this.isValid(newData));
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const radio = target.closest('[data-domain-mode]');
    if (!radio || !this._data) return;
    const mode = radio.getAttribute('data-domain-mode') as 'app_bundle' | 'website';
    if (mode && mode !== this._data.domainMode) {
      const newData = { ...this._data, domainMode: mode, enableSkadNetwork: mode === 'app_bundle' ? this._data.enableSkadNetwork : false };
      this._data = newData;
      this.rerender();
      this.emitDataChanged(newData);
      this.emitValidity(this.isValid(newData));
    }
  };

  private emitDataChanged(data: CampaignFormData): void {
    this.emit('step-data-changed', { data });
  }

  private emitValidity(isValid: boolean): void {
    this.emit('step-validity-changed', { isValid });
  }

  private isValid(data: CampaignFormData): boolean {
    if (data.domainMode === 'create_new') {
      return false; // Still need to select app bundle or website inside create_new
    }
    return isNotEmpty(data.searchDomain) || isNotEmpty(data.domain) || data.domainMode !== undefined;
  }

  protected renderTemplate(): string {
    if (!this._data) return '';
    const d = this._data;
    return html`
      <div class="step-content">
        <div class="top-actions">
          <div class="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="field-input" data-field="searchDomain" value="${d.searchDomain}" placeholder="SEARCH EXISTING DOMAIN">
          </div>
          <button class="btn-create-new ${['app_bundle', 'website'].includes(d.domainMode) ? 'active' : ''}" type="button" data-domain-mode="create_new">+ CREATE NEW</button>
        </div>

        ${['app_bundle', 'website', 'create_new'].includes(d.domainMode) ? SafeHtmlString.trusted(`
          <div class="radio-group">
            <div class="radio-card ${d.domainMode === 'app_bundle' ? 'active' : ''}" data-domain-mode="app_bundle">
              <div class="radio-card-label">APP BUNDLE</div>
            </div>
            <span class="or-divider">OR</span>
            <div class="radio-card ${d.domainMode === 'website' ? 'active' : ''}" data-domain-mode="website">
              <div class="radio-card-label">WEBSITE</div>
            </div>
          </div>
        `) : ''}

        ${d.domainMode === 'app_bundle' ? SafeHtmlString.trusted(this.renderSkadCheckbox(d.enableSkadNetwork)) : ''}
        
        <div class="helper-text">
          IF APP BUNDLE IS SELECTED THEN ONLY SKAD IS SELECTED
        </div>
      </div>
    `;
  }

  private renderSkadCheckbox(checked: boolean): string {
    return html`
      <div class="checkbox-field">
        <input type="checkbox" data-field="enableSkadNetwork" id="skad" ${checked ? 'checked' : ''}>
        <label for="skad" class="field-label" style="font-weight: 600; text-transform: uppercase;">ENABLE SKAD NETWORK</label>
      </div>
    `;
  }
}

ComponentRegistry.register('step-ad-domain', StepAdDomain);
export { StepAdDomain };