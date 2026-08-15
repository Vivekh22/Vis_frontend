/**
 * VideoCreativeBuilder.ts — pages/client/creatives/builders/
 *
 * Two-panel layout: form left, live preview right.
 * Fields: Name, Aspect ratio, Upload, End Card, Interstitial/Rewarded
 * checkboxes, Click/Impression URLs.
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
  .preview-video { width: 100%; border-radius: var(--radius-sm); background: var(--color-surface-2); }
  .field-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .field-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .field-input, .field-select { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: var(--font-body); background: var(--color-bg); color: var(--color-text-primary); }
  .checkbox-row { display: flex; align-items: center; gap: var(--space-2); }
  .upload-btn { padding: var(--space-2) var(--space-4); border: 1px dashed var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); text-align: center; color: var(--color-text-muted); background: var(--color-bg); display: block; }
  .submit-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); align-self: flex-start; }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

class VideoCreativeBuilder extends BaseComponent {
  private name = '';
  private aspectRatio = '16:9';
  private videoUrl = '';
  private endCardUrl = '';
  private isInterstitial = false;
  private isRewarded = false;
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
    if (field === 'name') this.name = (target as HTMLInputElement).value;
    else if (field === 'clickUrl') this.clickUrl = (target as HTMLInputElement).value;
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const field = target.getAttribute('data-field');
    if (!field) return;
    if (field === 'aspectRatio') {
      this.aspectRatio = target.value;
    } else if (field === 'video' && target.files?.[0]) {
      this.videoUrl = `mock://uploads/${encodeURIComponent(target.files[0].name)}`;
    } else if (field === 'endCard' && target.files?.[0]) {
      this.endCardUrl = `mock://uploads/${encodeURIComponent(target.files[0].name)}`;
    } else if (field === 'interstitial') {
      this.isInterstitial = target.checked;
    } else if (field === 'rewarded') {
      this.isRewarded = target.checked;
    }
    this.rerender();
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="submit"]')) {
      this.emit('creative-submit', { name: this.name, format: 'video', assetUrl: this.videoUrl, aspectRatio: this.aspectRatio, endCardUrl: this.endCardUrl, isInterstitial: this.isInterstitial, isRewarded: this.isRewarded, clickUrl: this.clickUrl });
    }
  };

  private get isValid(): boolean {
    return this.name.trim().length > 0 && this.videoUrl.length > 0;
  }

  protected renderTemplate(): string {
    const ratioStyle = this.aspectRatio === '9:16' ? 'max-width:200px;' : 'max-width:400px;';
    return html`
      <div class="builder-layout">
        <div class="form-panel">
          <div class="field-group">
            <label class="field-label">Creative Name</label>
            <input type="text" class="field-input" data-field="name" value="${this.name}" placeholder="My Video Creative">
          </div>
          <div class="field-group">
            <label class="field-label">Aspect Ratio</label>
            <select class="field-select" data-field="aspectRatio">
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:3">4:3</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Upload Video</label>
            <label class="upload-btn">Choose Video<input type="file" data-field="video" accept="video/*" style="display:none;"></label>
            ${this.videoUrl ? `<p style="font-size:var(--font-size-xs);color:var(--color-text-muted);">${this.videoUrl}</p>` : ''}
          </div>
          <div class="field-group">
            <label class="field-label">End Card (Image)</label>
            <label class="upload-btn">Choose End Card<input type="file" data-field="endCard" accept="image/*" style="display:none;"></label>
            ${this.endCardUrl ? `<p style="font-size:var(--font-size-xs);color:var(--color-text-muted);">${this.endCardUrl}</p>` : ''}
          </div>
          <div class="checkbox-row">
            <input type="checkbox" data-field="interstitial" id="interstitial" ${this.isInterstitial ? 'checked' : ''}>
            <label for="interstitial" style="font-size:var(--font-size-sm);">Interstitial</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" data-field="rewarded" id="rewarded" ${this.isRewarded ? 'checked' : ''}>
            <label for="rewarded" style="font-size:var(--font-size-sm);">Rewarded</label>
          </div>
          <div class="field-group">
            <label class="field-label">Click URL</label>
            <input type="text" class="field-input" data-field="clickUrl" value="${this.clickUrl}" placeholder="https://...">
          </div>
          <button class="submit-btn" data-action="submit" type="button" ${this.isValid ? '' : 'disabled'}>Submit for Approval</button>
        </div>
        <div class="preview-panel">
          <p class="preview-title">Live Preview</p>
          ${this.videoUrl ? `<video class="preview-video" style="${ratioStyle}" src="${this.videoUrl}" controls></video>` : '<p style="color:var(--color-text-muted);font-size:var(--font-size-sm);">Upload a video to preview</p>'}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('video-creative-builder', VideoCreativeBuilder);
export { VideoCreativeBuilder };