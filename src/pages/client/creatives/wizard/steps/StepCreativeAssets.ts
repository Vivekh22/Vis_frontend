import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../../platform/rendering/SafeHtml';
import { CreativeFormData, StepComponent, CreativeFormat } from '../creative-wizard-types';
import '../../../../../components/form-fields/TextFieldElement';

const FORMATS = [
  { id: 'image', label: 'Image', icon: '🖼️' },
  { id: 'video', label: 'Video', icon: '🎬' },
  { id: 'html', label: 'HTML5', icon: '⚡' },
  { id: 'vast', label: 'VAST', icon: '📡' },
  { id: 'native', label: 'Native', icon: '📰' },
];

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-3);
  }
  .format-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    cursor: pointer;
    transition: all 0.2s;
  }
  .format-card:hover {
    border-color: var(--color-primary-light);
  }
  .format-card.active {
    border-color: var(--color-primary);
    background: rgba(59, 102, 245, 0.05);
  }
  .format-icon {
    font-size: 24px;
    margin-bottom: var(--space-2);
  }
  .format-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
  .upload-area {
    margin-top: var(--space-4);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-6);
    text-align: center;
    background: var(--color-surface);
    cursor: pointer;
    transition: all 0.2s;
  }
  .upload-area:hover {
    border-color: var(--color-primary-light);
    background: rgba(59, 102, 245, 0.02);
  }
  .upload-icon {
    font-size: 32px;
    color: var(--color-text-muted);
    margin-bottom: var(--space-2);
  }
  .upload-text {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
    margin: 0 0 var(--space-1);
  }
  .upload-sub {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    margin: 0;
  }
`;

class StepCreativeAssets extends BaseComponent implements StepComponent {
  private _data!: CreativeFormData;

  set data(val: CreativeFormData) {
    this._data = val;
    this.rerender();
  }
  get data(): CreativeFormData {
    return this._data;
  }

  get isValid(): boolean {
    return !!(this._data.format && this._data.assetUrl);
  }

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    
    const formatCard = target.closest('.format-card');
    if (formatCard) {
      const format = formatCard.getAttribute('data-format') as CreativeFormat;
      this._data.format = format;
      this.dispatchEvent(new CustomEvent('step-data-changed', { bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent('step-validity-changed', { bubbles: true, composed: true }));
      this.rerender();
      return;
    }

    const uploadArea = target.closest('.upload-area');
    if (uploadArea) {
      // Simulate upload
      setTimeout(() => {
        this._data.assetUrl = 'https://picsum.photos/600/400';
        this.dispatchEvent(new CustomEvent('step-data-changed', { bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('step-validity-changed', { bubbles: true, composed: true }));
        this.rerender();
      }, 500);
    }
  };

  protected renderTemplate(): string {
    if (!this._data) return '';
    return html`
      <div class="step-content">
        <h4>Select Format</h4>
        <div class="format-grid">
          ${SafeHtmlString.trusted(FORMATS.map(f => `
            <div class="format-card ${this._data.format === f.id ? 'active' : ''}" data-format="${f.id}">
              <div class="format-icon">${f.icon}</div>
              <div class="format-label">${f.label}</div>
            </div>
          `).join(''))}
        </div>

        ${this._data.format ? SafeHtmlString.trusted(`
          <div class="upload-area">
            ${this._data.assetUrl ? `
              <div class="upload-icon">✅</div>
              <p class="upload-text">Asset Uploaded Successfully</p>
              <p class="upload-sub">Click to replace</p>
            ` : `
              <div class="upload-icon">☁️</div>
              <p class="upload-text">Click to upload ${this._data.format} asset</p>
              <p class="upload-sub">Supports JPG, PNG, GIF, MP4 (Max 10MB)</p>
            `}
          </div>
        `) : ''}
      </div>
    `;
  }
}

ComponentRegistry.register('step-creative-assets', StepCreativeAssets);
export { StepCreativeAssets };
