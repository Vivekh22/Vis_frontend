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
  .builder-layout { display: flex; gap: 24px; min-height: 400px; align-items: stretch; justify-content: center; }
  @media (max-width: 768px) { .builder-layout { flex-direction: column; } }
  .form-panel { flex: 1; max-width: 500px; display: flex; flex-direction: column; gap: 16px; }
  .preview-panel { flex: 1; max-width: 400px; background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; }
  .preview-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 16px 0; }
  .preview-video { width: 100%; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background: black; }
  .preview-empty { display: flex; align-items: center; justify-content: center; flex: 1; border: 1px dashed #e2e8f0; border-radius: 6px; background: #f8fafc; color: #94a3b8; font-size: 13px; font-weight: 500; }
  .field-group { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; }
  .field-input, .field-select { box-sizing: border-box; width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: white; color: #111827; outline: none; transition: border-color 0.2s; }
  .field-input:focus, .field-select:focus { border-color: #3b66f5; }
  .checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #111827; }
  .upload-btn { padding: 16px; border: 1px dashed #cbd5e1; border-radius: 8px; cursor: pointer; font-size: 13px; text-align: center; color: #64748b; background: #f8fafc; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px; font-weight: 500; }
  .upload-btn:hover { border-color: #3b66f5; background: #eff3ff; color: #3b66f5; }
  .submit-btn { padding: 10px 24px; background: #3b66f5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; align-self: flex-start; transition: background 0.15s; margin-top: 8px; }
  .submit-btn:hover:not(:disabled) { background: #2d55e0; }
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
            <label for="interstitial">Interstitial</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" data-field="rewarded" id="rewarded" ${this.isRewarded ? 'checked' : ''}>
            <label for="rewarded">Rewarded</label>
          </div>
          <div class="field-group">
            <label class="field-label">Click URL</label>
            <input type="text" class="field-input" data-field="clickUrl" value="${this.clickUrl}" placeholder="https://...">
          </div>
          <button class="submit-btn" data-action="submit" type="button" ${this.isValid ? '' : 'disabled'}>Submit for Approval</button>
        </div>
        <div class="preview-panel">
          <p class="preview-title">Live Preview</p>
          ${this.videoUrl ? `<video class="preview-video" style="${ratioStyle}" src="${this.videoUrl}" controls></video>` : '<div class="preview-empty">Upload a video to preview</div>'}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('video-creative-builder', VideoCreativeBuilder);
export { VideoCreativeBuilder };