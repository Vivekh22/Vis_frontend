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
  .builder-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
  @media (max-width: 768px) { .builder-layout { grid-template-columns: 1fr; } }
  .form-panel { display: flex; flex-direction: column; gap: var(--space-4); }
  .preview-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .preview-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); color: var(--color-text-primary); }
  .native-ad { max-width: 400px; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
  .native-img { width: 100%; height: 160px; object-fit: cover; background: var(--color-surface-2); }
  .native-body { padding: var(--space-3); display: flex; gap: var(--space-3); }
  .native-logo { width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0; background: var(--color-surface-2); }
  .native-content { flex: 1; }
  .native-headline { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-1); }
  .native-desc { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0 0 var(--space-2); }
  .native-cta { display: inline-block; padding: var(--space-1) var(--space-3); background: var(--color-primary); color: var(--color-primary-foreground); border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
  .field-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .field-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .field-input, .field-textarea { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: var(--font-body); background: var(--color-bg); color: var(--color-text-primary); }
  .field-textarea { min-height: 60px; resize: vertical; }
  .upload-btn { padding: var(--space-2) var(--space-4); border: 1px dashed var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); text-align: center; color: var(--color-text-muted); background: var(--color-bg); display: block; }
  .submit-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); align-self: flex-start; }
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