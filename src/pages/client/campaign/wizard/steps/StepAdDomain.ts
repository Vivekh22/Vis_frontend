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
  }
  .radio-group { display: flex; gap: var(--space-3); }
  .radio-card {
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    flex: 1;
  }
  .radio-card.active { border-color: var(--color-primary); background: var(--color-surface-2); }
  .radio-card-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .checkbox-field { display: flex; align-items: center; gap: var(--space-2); }
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
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('change', this.handleChange);
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
    return isNotEmpty(data.domain);
  }

  protected renderTemplate(): string {
    if (!this._data) return '';
    const d = this._data;
    return html`
      <div class="step-content">
        <div class="field">
          <label class="field-label" for="domain">Ad Domain</label>
          <input type="text" class="field-input" data-field="domain" id="domain" value="${d.domain}" placeholder="Search or enter domain">
        </div>
        <div class="field">
          <label class="field-label">Domain Type</label>
          <div class="radio-group">
            <div class="radio-card ${d.domainMode === 'app_bundle' ? 'active' : ''}" data-domain-mode="app_bundle">
              <div class="radio-card-label">App Bundle</div>
            </div>
            <div class="radio-card ${d.domainMode === 'website' ? 'active' : ''}" data-domain-mode="website">
              <div class="radio-card-label">Website</div>
            </div>
          </div>
        </div>
        ${d.domainMode === 'app_bundle' ? SafeHtmlString.trusted(this.renderSkadCheckbox(d.enableSkadNetwork)) : ''}
      </div>
    `;
  }

  private renderSkadCheckbox(checked: boolean): string {
    return html`
      <div class="checkbox-field">
        <input type="checkbox" data-field="enableSkadNetwork" id="skad" ${checked ? 'checked' : ''}>
        <label for="skad" class="field-label">Enable SKAD Network</label>
      </div>
    `;
  }
}

ComponentRegistry.register('step-ad-domain', StepAdDomain);
export { StepAdDomain };