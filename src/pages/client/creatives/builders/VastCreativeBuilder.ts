/**
 * VastCreativeBuilder.ts — pages/client/creatives/builders/
 *
 * Two-panel layout: form left, live preview right.
 * Fields: Name, VAST tag/XML, End Card, Click URL, Interstitial/Rewarded.
 *
 * "Test VAST Tag" validator: performs a CLIENT-SIDE XML well-formedness
 * check only. This is intentionally NOT full VAST spec validation —
 * that belongs server-side. The client-side check uses DOMParser to
 * detect malformed XML (unclosed tags, bad entities). This scope
 * boundary is documented here and in the test.
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
  .preview-xml { font-family: var(--font-mono); font-size: 11px; color: #374151; white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow-y: auto; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
  .preview-empty { display: flex; align-items: center; justify-content: center; flex: 1; border: 1px dashed #e2e8f0; border-radius: 6px; background: #f8fafc; color: #94a3b8; font-size: 13px; font-weight: 500; }
  .field-group { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; }
  .field-input, .field-textarea { box-sizing: border-box; width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: white; color: #111827; outline: none; transition: border-color 0.2s; }
  .field-input:focus, .field-textarea:focus { border-color: #3b66f5; }
  .field-textarea { min-height: 120px; resize: vertical; font-family: var(--font-mono); font-size: 12px; }
  .checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #111827; }
  .test-btn { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: white; cursor: pointer; font-size: 11px; font-weight: 600; color: #475569; transition: all 0.2s; }
  .test-btn:hover { background: #f8fafc; border-color: #94a3b8; }
  .test-result { font-size: 11px; margin-top: 4px; font-weight: 500; }
  .test-result.ok { color: #16a34a; }
  .test-result.fail { color: #dc2626; }
  .submit-btn { padding: 10px 24px; background: #3b66f5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; align-self: flex-start; transition: background 0.15s; margin-top: 8px; }
  .submit-btn:hover:not(:disabled) { background: #2d55e0; }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

class VastCreativeBuilder extends BaseComponent {
  private name = '';
  private vastXml = '';
  private endCardUrl = '';
  private clickUrl = '';
  private isInterstitial = false;
  private isRewarded = false;
  private testResult: { ok: boolean; message: string } | null = null;

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
    else if (field === 'vastXml') { this.vastXml = (target as HTMLTextAreaElement).value; this.testResult = null; }
    else if (field === 'clickUrl') this.clickUrl = (target as HTMLInputElement).value;
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const field = target.getAttribute('data-field');
    if (!field) return;
    if (field === 'interstitial') this.isInterstitial = target.checked;
    else if (field === 'rewarded') this.isRewarded = target.checked;
    this.rerender();
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="test"]')) {
      this.testVastTag();
    } else if (target.closest('[data-action="submit"]')) {
      this.emit('creative-submit', { name: this.name, format: 'vast', vastXml: this.vastXml, endCardUrl: this.endCardUrl, clickUrl: this.clickUrl, isInterstitial: this.isInterstitial, isRewarded: this.isRewarded });
    }
  };

  /**
   * Client-side XML well-formedness check using DOMParser.
   * Scope boundary: This checks XML PARSE errors only — it does NOT
   * validate VAST spec compliance (required elements, ad structure,
   * media file URIs, etc.). Full VAST validation belongs server-side.
   */
  private testVastTag(): void {
    if (this.vastXml.trim().length === 0) {
      this.testResult = { ok: false, message: 'VAST tag is empty' };
      this.rerender();
      return;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.vastXml, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      this.testResult = { ok: false, message: 'XML parse error: ' + parseError.textContent?.slice(0, 100) };
    } else {
      this.testResult = { ok: true, message: 'XML is well-formed (VAST spec validation is server-side)' };
    }
    this.rerender();
  }

  private get isValid(): boolean {
    return this.name.trim().length > 0 && this.vastXml.trim().length > 0;
  }

  protected renderTemplate(): string {
    return html`
      <div class="builder-layout">
        <div class="form-panel">
          <div class="field-group">
            <label class="field-label">Creative Name</label>
            <input type="text" class="field-input" data-field="name" value="${this.name}" placeholder="My VAST Creative">
          </div>
          <div class="field-group">
            <label class="field-label">VAST Tag / XML</label>
            <textarea class="field-textarea" data-field="vastXml" placeholder="<VAST version='3.0'>...</VAST>">${this.vastXml}</textarea>
            <button class="test-btn" data-action="test" type="button">Test VAST Tag</button>
            ${this.testResult ? `<p class="test-result ${this.testResult.ok ? 'ok' : 'fail'}">${this.testResult.message}</p>` : ''}
          </div>
          <div class="field-group">
            <label class="field-label">End Card URL (Image or HTML)</label>
            <input type="text" class="field-input" data-field="endCard" value="${this.endCardUrl}" placeholder="https://...">
          </div>
          <div class="field-group">
            <label class="field-label">Click URL</label>
            <input type="text" class="field-input" data-field="clickUrl" value="${this.clickUrl}" placeholder="https://...">
          </div>
          <div class="checkbox-row">
            <input type="checkbox" data-field="interstitial" id="interstitial" ${this.isInterstitial ? 'checked' : ''}>
            <label for="interstitial">Interstitial</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" data-field="rewarded" id="rewarded" ${this.isRewarded ? 'checked' : ''}>
            <label for="rewarded">Rewarded</label>
          </div>
          <button class="submit-btn" data-action="submit" type="button" ${this.isValid ? '' : 'disabled'}>Submit for Approval</button>
        </div>
        <div class="preview-panel">
          <p class="preview-title">XML Preview</p>
          ${this.vastXml ? `<div class="preview-xml">${this.vastXml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : '<div class="preview-empty">Enter VAST tag to preview</div>'}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('vast-creative-builder', VastCreativeBuilder);
export { VastCreativeBuilder };