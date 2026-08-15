/**
 * ImageCreativeBuilder.ts — pages/client/creatives/builders/
 *
 * Two-panel layout: form left, live preview right.
 * Fields: Name, Upload, Click URL, Impression URL(s) or 3rd-party tag.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../platform/rendering/SafeHtml';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .builder-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
  @media (max-width: 768px) { .builder-layout { grid-template-columns: 1fr; } }
  .form-panel { display: flex; flex-direction: column; gap: var(--space-4); }
  .preview-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .preview-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); color: var(--color-text-primary); }
  .preview-img { max-width: 100%; height: auto; border-radius: var(--radius-sm); }
  .field-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .field-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .field-input { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: var(--font-body); background: var(--color-bg); color: var(--color-text-primary); }
  .field-textarea { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: var(--font-mono); min-height: 80px; resize: vertical; background: var(--color-bg); color: var(--color-text-primary); }
  .upload-btn { padding: var(--space-2) var(--space-4); border: 1px dashed var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); text-align: center; color: var(--color-text-muted); background: var(--color-bg); }
  .submit-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); align-self: flex-start; }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

class ImageCreativeBuilder extends BaseComponent {
  private name = '';
  private assetUrl = '';
  private clickUrl = '';
  private impressionUrl = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('input', this.handleInput);
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('change', this.handleChange);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('input', this.handleInput);
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (!field) return;
    const value = (target as HTMLInputElement | HTMLTextAreaElement).value;
    if (field === 'name') this.name = value;
    else if (field === 'clickUrl') this.clickUrl = value;
    else if (field === 'impressionUrl') this.impressionUrl = value;
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.getAttribute('data-field') === 'file') {
      const file = target.files?.[0];
      if (file) {
        this.assetUrl = `mock://uploads/${encodeURIComponent(file.name)}`;
        this.rerender();
      }
    }
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="submit"]')) {
      this.emit('creative-submit', { name: this.name, format: 'image', assetUrl: this.assetUrl, clickUrl: this.clickUrl });
    }
  };

  private get isValid(): boolean {
    return this.name.trim().length > 0 && this.assetUrl.length > 0;
  }

  protected renderTemplate(): string {
    return html`
      <div class="builder-layout">
        <div class="form-panel">
          <div class="field-group">
            <label class="field-label">Creative Name</label>
            <input type="text" class="field-input" data-field="name" value="${this.name}" placeholder="My Image Creative">
          </div>
          <div class="field-group">
            <label class="field-label">Upload Image</label>
            <label class="upload-btn">
              Choose File
              <input type="file" data-field="file" accept="image/*" style="display:none;">
            </label>
            ${this.assetUrl ? `<p style="font-size:var(--font-size-xs);color:var(--color-text-muted);">${this.assetUrl}</p>` : ''}
          </div>
          <div class="field-group">
            <label class="field-label">Click URL</label>
            <input type="text" class="field-input" data-field="clickUrl" value="${this.clickUrl}" placeholder="https://...">
          </div>
          <div class="field-group">
            <label class="field-label">Impression URL(s) / 3rd-Party Tag</label>
            <textarea class="field-textarea" data-field="impressionUrl" placeholder="https://impression.tracker.com/...">${this.impressionUrl}</textarea>
          </div>
          <button class="submit-btn" data-action="submit" type="button" ${this.isValid ? '' : 'disabled'}>Submit for Approval</button>
        </div>
        <div class="preview-panel">
          <p class="preview-title">Live Preview</p>
          ${this.assetUrl ? `<img class="preview-img" src="${this.assetUrl}" alt="${this.name}">` : '<p style="color:var(--color-text-muted);font-size:var(--font-size-sm);">Upload an image to preview</p>'}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('image-creative-builder', ImageCreativeBuilder);
export { ImageCreativeBuilder };