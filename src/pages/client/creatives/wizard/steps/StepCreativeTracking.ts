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

class StepCreativeTracking extends BaseComponent implements StepComponent {
  private _data!: CreativeFormData;

  set data(val: CreativeFormData) {
    this._data = val;
    this.rerender();
  }
  get data(): CreativeFormData {
    return this._data;
  }

  get isValid(): boolean {
    return true; // Tracking fields are optional
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
          name="clickTracker"
          label="Click Tracker URL"
          placeholder="https://..."
          value="${this._data.clickTracker}"
        ></text-field>
        
        <text-field
          name="impressionTracker"
          label="Impression Tracker URL"
          placeholder="https://..."
          value="${this._data.impressionTracker}"
        ></text-field>

        <text-field
          name="verificationTag"
          label="3rd Party Verification Tag"
          placeholder="<script>..."
          value="${this._data.verificationTag}"
        ></text-field>
      </div>
    `;
  }
}

ComponentRegistry.register('step-creative-tracking', StepCreativeTracking);
export { StepCreativeTracking };
