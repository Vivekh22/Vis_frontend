/**
 * StepCampaignPreferences.ts — pages/client/registration/steps/
 *
 * Step 3 of the registration wizard. Multi-select CPM/CPC/CPI/CPA toggleable chips.
 * At least one must be selected for the step to be valid.
 *
 * Emits:
 *   step-data-changed   { data: Partial<RegistrationFormData> }
 *   step-validity-changed { isValid: boolean }
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import type { RegistrationFormData, StepComponent } from '../registration-types';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .step-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-6); }
  .chip-grid { display: flex; flex-wrap: wrap; gap: var(--space-3); }
  .chip {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    background: var(--color-bg);
    color: var(--color-text-primary);
    font-family: var(--font-body);
    user-select: none;
  }
  .chip--selected {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border-color: var(--color-primary);
  }
`;

const OPTIONS = ['CPM', 'CPC', 'CPI', 'CPA'] as const;

class StepCampaignPreferences extends BaseComponent implements StepComponent {
  private _data: RegistrationFormData = { pricingModels: [] } as unknown as RegistrationFormData;
  private _isValid = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: RegistrationFormData) {
    this._data = { ...value, pricingModels: [...(value.pricingModels ?? [])] };
    this._isValid = this._data.pricingModels.length > 0;
    if (this.isConnected) this.rerender();
  }
  public get data(): RegistrationFormData { return this._data; }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    // Emit initial state
    this.emit('step-data-changed', { data: { pricingModels: this._data.pricingModels } });
    this.emit('step-validity-changed', { isValid: this._isValid });
  }
  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const chip = target.closest('[data-pricing-model]') as HTMLElement | null;
    if (!chip) return;
    const model = chip.getAttribute('data-pricing-model')!;
    const models = new Set(this._data.pricingModels);
    if (models.has(model)) models.delete(model);
    else models.add(model);
    this._data.pricingModels = Array.from(models);
    this._isValid = this._data.pricingModels.length > 0;
    this.rerender();
    this.emit('step-data-changed', { data: { pricingModels: this._data.pricingModels } });
    this.emit('step-validity-changed', { isValid: this._isValid });
  };

  protected renderTemplate(): string {
    const chips = OPTIONS.map((opt) => {
      const selected = this._data.pricingModels.includes(opt);
      const cls = selected ? 'chip chip--selected' : 'chip';
      return `<button type="button" class="${cls}" data-pricing-model="${opt}">${opt}</button>`;
    }).join('');
    return html`
      <h2 class="step-title">Campaign Preferences</h2>
      <p class="step-subtitle">Select your preferred pricing models (choose at least one).</p>
      <div class="chip-grid">${SafeHtmlString.trusted(chips)}</div>
    `;
  }
}

ComponentRegistry.register('step-campaign-preferences', StepCampaignPreferences);
export { StepCampaignPreferences };