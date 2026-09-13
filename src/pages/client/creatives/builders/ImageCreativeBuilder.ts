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
  .builder-layout { display: flex; gap: 24px; min-height: 400px; align-items: stretch; justify-content: center; }
  @media (max-width: 768px) { .builder-layout { flex-direction: column; } }
  .form-panel { flex: 1; max-width: 500px; display: flex; flex-direction: column; gap: 16px; }
  .preview-panel { flex: 1; max-width: 400px; background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; }
  .preview-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 16px 0; }
  .preview-img { max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .preview-empty { display: flex; align-items: center; justify-content: center; flex: 1; border: 1px dashed #e2e8f0; border-radius: 6px; background: #f8fafc; color: #94a3b8; font-size: 13px; font-weight: 500; }
  .field-group { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; }
  .field-input, .field-textarea { box-sizing: border-box; width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: white; color: #111827; outline: none; transition: border-color 0.2s; }
  .field-input:focus, .field-textarea:focus { border-color: #3b66f5; }
  .field-textarea { min-height: 80px; resize: vertical; font-family: var(--font-mono); font-size: 12px; }
  .upload-btn { padding: 16px; border: 1px dashed #cbd5e1; border-radius: 8px; cursor: pointer; font-size: 13px; text-align: center; color: #64748b; background: #f8fafc; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px; font-weight: 500; }
  .upload-btn:hover { border-color: #3b66f5; background: #eff3ff; color: #3b66f5; }
  .submit-btn { padding: 10px 24px; background: #3b66f5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; align-self: flex-start; transition: background 0.15s; margin-top: 8px; }
  .submit-btn:hover:not(:disabled) { background: #2d55e0; }
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
          ${this.assetUrl ? `<img class="preview-img" src="${this.assetUrl}" alt="${this.name}">` : '<div class="preview-empty">Upload an image to preview</div>'}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('image-creative-builder', ImageCreativeBuilder);
export { ImageCreativeBuilder };