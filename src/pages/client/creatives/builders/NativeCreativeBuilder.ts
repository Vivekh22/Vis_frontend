/**
 * NativeCreativeBuilder.ts — pages/client/creatives/builders/
 *
 * Two-panel layout: form left, live preview right.
 * Fields: Name, Image, Logo, Description, Title, CTA, Click/Impression URLs.
 * Preview assembles into a real native ad unit layout (not a raw image dump).
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
  .native-ad { max-width: 400px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .native-img { width: 100%; height: 160px; object-fit: cover; background: #f8fafc; }
  .native-body { padding: 16px; display: flex; gap: 12px; }
  .native-logo { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: #f8fafc; }
  .native-content { flex: 1; }
  .native-headline { font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 4px; }
  .native-desc { font-size: 11px; color: #6b7280; margin: 0 0 8px; }
  .native-cta { display: inline-block; padding: 6px 12px; background: #3b66f5; color: white; border-radius: 6px; font-size: 11px; font-weight: 600; }
  .field-group { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; }
  .field-input, .field-textarea { box-sizing: border-box; width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: white; color: #111827; outline: none; transition: border-color 0.2s; }
  .field-input:focus, .field-textarea:focus { border-color: #3b66f5; }
  .field-textarea { min-height: 60px; resize: vertical; font-size: 12px; }
  .upload-btn { padding: 16px; border: 1px dashed #cbd5e1; border-radius: 8px; cursor: pointer; font-size: 13px; text-align: center; color: #64748b; background: #f8fafc; transition: all 0.2s; display: block; font-weight: 500; }
  .upload-btn:hover { border-color: #3b66f5; background: #eff3ff; color: #3b66f5; }
  .submit-btn { padding: 10px 24px; background: #3b66f5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; align-self: flex-start; transition: background 0.15s; margin-top: 8px; }
  .submit-btn:hover:not(:disabled) { background: #2d55e0; }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

class NativeCreativeBuilder extends BaseComponent {
  private name = '';
  private imageUrl = '';
  private logoUrl = '';
  private headline = '';
  private description = '';
  private cta = 'Learn More';
  private clickUrl = '';

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
    else if (field === 'title') this.headline = value;
    else if (field === 'description') this.description = value;
    else if (field === 'cta') this.cta = value;
    else if (field === 'clickUrl') this.clickUrl = value;
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const field = target.getAttribute('data-field');
    if (!field || !target.files?.[0]) return;
    const url = `mock://uploads/${encodeURIComponent(target.files[0].name)}`;
    if (field === 'image') this.imageUrl = url;
    else if (field === 'logo') this.logoUrl = url;
    this.rerender();
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="submit"]')) {
      this.emit('creative-submit', { name: this.name, format: 'native', assetUrl: this.imageUrl, title: this.headline, description: this.description, cta: this.cta, clickUrl: this.clickUrl });
    }
  };

  private get isValid(): boolean {
    return this.name.trim().length > 0 && this.imageUrl.length > 0 && this.headline.trim().length > 0;
  }

  protected renderTemplate(): string {
    return html`
      <div class="builder-layout">
        <div class="form-panel">
          <div class="field-group">
            <label class="field-label">Creative Name</label>
            <input type="text" class="field-input" data-field="name" value="${this.name}" placeholder="My Native Creative">
          </div>
          <div class="field-group">
            <label class="field-label">Main Image</label>
            <label class="upload-btn">Choose Image<input type="file" data-field="image" accept="image/*" style="display:none;"></label>
          </div>
          <div class="field-group">
            <label class="field-label">Logo</label>
            <label class="upload-btn">Choose Logo<input type="file" data-field="logo" accept="image/*" style="display:none;"></label>
          </div>
          <div class="field-group">
            <label class="field-label">Title</label>
            <input type="text" class="field-input" data-field="title" value="${this.title}" placeholder="Ad headline">
          </div>
          <div class="field-group">
            <label class="field-label">Description</label>
            <textarea class="field-textarea" data-field="description" placeholder="Ad body text">${this.description}</textarea>
          </div>
          <div class="field-group">
            <label class="field-label">Call-to-Action</label>
            <input type="text" class="field-input" data-field="cta" value="${this.cta}">
          </div>
          <div class="field-group">
            <label class="field-label">Click URL</label>
            <input type="text" class="field-input" data-field="clickUrl" value="${this.clickUrl}" placeholder="https://...">
          </div>
          <button class="submit-btn" data-action="submit" type="button" ${this.isValid ? '' : 'disabled'}>Submit for Approval</button>
        </div>
        <div class="preview-panel">
          <p class="preview-title">Live Preview</p>
          <div class="native-ad">
            ${this.imageUrl ? `<img class="native-img" src="${this.imageUrl}" alt="">` : '<div class="native-img"></div>'}
            <div class="native-body">
              ${this.logoUrl ? `<img class="native-logo" src="${this.logoUrl}" alt="">` : '<div class="native-logo"></div>'}
              <div class="native-content">
                <p class="native-headline">${this.headline || 'Headline'}</p>
                <p class="native-desc">${this.description || 'Description text'}</p>
                <span class="native-cta">${this.cta}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('native-creative-builder', NativeCreativeBuilder);
export { NativeCreativeBuilder };