import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../../platform/rendering/SafeHtml';
import { CreativeFormData, StepComponent } from '../creative-wizard-types';
import '../../../../../components/form-fields/TextFieldElement';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
`;

class StepCreativeAdDetails extends BaseComponent implements StepComponent {
  private _data!: CreativeFormData;

  set data(val: CreativeFormData) {
    this._data = val;
    this.rerender();
  }
  get data(): CreativeFormData {
    return this._data;
  }

  get isValid(): boolean {
    return !!(this._data.headline && this._data.destinationUrl);
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
          name="headline"
          label="Headline *"
          placeholder="Enter a catchy headline"
          value="${this._data.headline}"
          required
        ></text-field>
        
        <text-field
          name="description"
          label="Description"
          placeholder="Provide more context (optional)"
          value="${this._data.description}"
        ></text-field>

        <text-field
          name="ctaText"
          label="Call To Action"
          placeholder="e.g., Learn More, Buy Now"
          value="${this._data.ctaText}"
        ></text-field>

        <text-field
          name="destinationUrl"
          label="Destination URL *"
          placeholder="https://..."
          value="${this._data.destinationUrl}"
          required
        ></text-field>
      </div>
    `;
  }
}

ComponentRegistry.register('step-creative-ad-details', StepCreativeAdDetails);
export { StepCreativeAdDetails };
