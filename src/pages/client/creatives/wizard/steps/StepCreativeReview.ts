import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../../platform/rendering/SafeHtml';
import { CreativeFormData, StepComponent } from '../creative-wizard-types';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .summary-section {
    background: var(--color-surface-2);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }
  .summary-title {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--space-2);
  }
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }
  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .summary-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }
  .summary-value {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    word-break: break-all;
  }
`;

class StepCreativeReview extends BaseComponent implements StepComponent {
  private _data!: CreativeFormData;

  set data(val: CreativeFormData) {
    this._data = val;
    this.rerender();
  }
  get data(): CreativeFormData {
    return this._data;
  }

  get isValid(): boolean {
    return true; // Review step itself doesn't have validation
  }

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected renderTemplate(): string {
    if (!this._data) return '';
    return html`
      <div class="step-content">
        <div class="summary-section">
          <h4 class="summary-title">Basic Details</h4>
          <div class="summary-grid">
            <div class="summary-item"><span class="summary-label">Name</span><span class="summary-value">${this._data.creativeName || '-'}</span></div>
            <div class="summary-item"><span class="summary-label">Advertiser</span><span class="summary-value">${this._data.advertiserName || '-'}</span></div>
            <div class="summary-item"><span class="summary-label">Category</span><span class="summary-value">${this._data.category || '-'}</span></div>
            <div class="summary-item"><span class="summary-label">Platform</span><span class="summary-value">${this._data.platform || '-'}</span></div>
          </div>
        </div>
        
        <div class="summary-section">
          <h4 class="summary-title">Ad Configuration</h4>
          <div class="summary-grid">
            <div class="summary-item"><span class="summary-label">Format</span><span class="summary-value">${this._data.format || '-'}</span></div>
            <div class="summary-item"><span class="summary-label">Headline</span><span class="summary-value">${this._data.headline || '-'}</span></div>
            <div class="summary-item" style="grid-column: 1 / -1;"><span class="summary-label">Destination URL</span><span class="summary-value">${this._data.destinationUrl || '-'}</span></div>
          </div>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('step-creative-review', StepCreativeReview);
export { StepCreativeReview };
