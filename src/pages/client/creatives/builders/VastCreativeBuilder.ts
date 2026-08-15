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
  .builder-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
  @media (max-width: 768px) { .builder-layout { grid-template-columns: 1fr; } }
  .form-panel { display: flex; flex-direction: column; gap: var(--space-4); }
  .preview-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .preview-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-3); color: var(--color-text-primary); }
  .preview-xml { font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-text-primary); white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow-y: auto; }
  .field-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .field-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .field-input, .field-textarea { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-family: var(--font-mono); background: var(--color-bg); color: var(--color-text-primary); }
  .field-textarea { min-height: 120px; resize: vertical; }
  .checkbox-row { display: flex; align-items: center; gap: var(--space-2); }
  .test-btn { padding: var(--space-1) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-xs); font-family: var(--font-body); }
  .test-result { font-size: var(--font-size-xs); margin-top: var(--space-1); }
  .test-result.ok { color: var(--color-success); }
  .test-result.fail { color: var(--color-danger); }
  .submit-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); align-self: flex-start; }
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
            <input type="checkbox" data-field="interstitial" id="vast-interstitial" ${this.isInterstitial ? 'checked' : ''}>
            <label for="vast-interstitial" style="font-size:var(--font-size-sm);">Interstitial</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" data-field="rewarded" id="vast-rewarded" ${this.isRewarded ? 'checked' : ''}>
            <label for="vast-rewarded" style="font-size:var(--font-size-sm);">Rewarded</label>
          </div>
          <button class="submit-btn" data-action="submit" type="button" ${this.isValid ? '' : 'disabled'}>Submit for Approval</button>
        </div>
        <div class="preview-panel">
          <p class="preview-title">VAST XML Preview</p>
          ${this.vastXml ? `<div class="preview-xml">${this.vastXml}</div>` : '<p style="color:var(--color-text-muted);font-size:var(--font-size-sm);">Paste VAST XML to preview</p>'}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('vast-creative-builder', VastCreativeBuilder);
export { VastCreativeBuilder };