import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../../platform/rendering/SafeHtml';
import { CreativeFormData, StepComponent } from '../creative-wizard-types';
import '../../../../../components/form-fields/TextFieldElement';
import '../../../../../components/form-fields/SelectFieldElement';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .form-row {
    display: flex;
    gap: var(--space-4);
  }
  .form-row > * {
    flex: 1;
  }
`;

class StepCreativeBasic extends BaseComponent implements StepComponent {
  private _data!: CreativeFormData;

  set data(val: CreativeFormData) {
    this._data = val;
    this.rerender();
  }
  get data(): CreativeFormData {
    return this._data;
  }

  get isValid(): boolean {
    return !!(this._data.creativeName && this._data.advertiserName && this._data.category);
  }

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('value-changed', this.handleInput as EventListener);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('value-changed', this.handleInput as EventListener);
  }

  private handleInput = (e: CustomEvent) => {
    const target = e.target as HTMLElement;
    const field = target.getAttribute('name') as keyof CreativeFormData;
    if (field) {
      (this._data as any)[field] = e.detail;
      this.dispatchEvent(new CustomEvent('step-data-changed', { bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('step-validity-changed', { bubbles: true, composed: true }));
    }
  };

  protected renderTemplate(): string {
    if (!this._data) return '';
    return html`
      <div class="step-content">
        <text-field
          name="creativeName"
          label="Creative Name *"
          placeholder="e.g., Summer Sale Banner"
          value="${this._data.creativeName}"
          required
        ></text-field>
        
        <text-field
          name="advertiserName"
          label="Advertiser Name *"
          placeholder="e.g., Acme Corp"
          value="${this._data.advertiserName}"
          required
        ></text-field>

        <div class="form-row">
          <select-field
            name="category"
            label="Category *"
            value="${this._data.category}"
            options="${JSON.stringify([
              {value: '', label: 'Select Category'},
              {value: 'retail', label: 'Retail'},
              {value: 'finance', label: 'Finance'},
              {value: 'gaming', label: 'Gaming'},
              {value: 'travel', label: 'Travel'}
            ])}"
          ></select-field>

          <select-field
            name="platform"
            label="Platform"
            value="${this._data.platform}"
            options="${JSON.stringify([
              {value: 'All', label: 'All Platforms'},
              {value: 'iOS', label: 'iOS'},
              {value: 'Android', label: 'Android'},
              {value: 'Web', label: 'Web'}
            ])}"
          ></select-field>
        </div>

        <select-field
          name="language"
          label="Language"
          value="${this._data.language}"
          options="${JSON.stringify([
            {value: 'English', label: 'English'},
            {value: 'Spanish', label: 'Spanish'},
            {value: 'French', label: 'French'}
          ])}"
        ></select-field>
      </div>
    `;
  }
}

ComponentRegistry.register('step-creative-basic', StepCreativeBasic);
export { StepCreativeBasic };
