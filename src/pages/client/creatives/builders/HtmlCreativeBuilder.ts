/**
 * HtmlCreativeBuilder.ts — pages/client/creatives/builders/
 *
 * SECURITY-CRITICAL: iframe sandbox configuration
 *
 * The preview iframe uses sandbox="allow-scripts" — this allows the
 * creative's JavaScript to execute (HTML5 banners typically contain
 * animation/interaction scripts) but does NOT include allow-same-origin.
 *
 * Why allow-same-origin is excluded:
 *   If a client pastes malicious HTML containing scripts, and the iframe
 *   has both allow-scripts AND allow-same-origin, the script could access
 *   the parent page's cookies, localStorage, and DOM. This is a real XSS
 *   vector — not theoretical. By omitting allow-same-origin, the iframe
 *   is given a unique opaque origin that cannot access the parent page.
 *
 * Why allow-scripts is included:
 *   HTML5 creatives legitimately need JavaScript for animation and
 *   interaction. Without it, most HTML creatives would render as static
 *   broken shells. The preview would be useless.
 *
 * What is NOT included:
 *   - allow-same-origin (prevents parent page access — the critical one)
 *   - allow-forms (prevents form submission from creative)
 *   - allow-popups (prevents opening new windows from the preview)
 *   - allow-top-navigation (prevents redirecting the parent page)
 *
 * The iframe content is set via srcdoc, which is rendered as a unique
 * origin when allow-same-origin is absent. This is the correct, safe
 * configuration for rendering untrusted HTML.
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
  .field-group { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; }
  .field-input, .field-textarea, .field-select { box-sizing: border-box; width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: white; color: #111827; outline: none; transition: border-color 0.2s; }
  .field-input:focus, .field-textarea:focus, .field-select:focus { border-color: #3b66f5; }
  .field-textarea { min-height: 160px; resize: vertical; font-family: var(--font-mono); font-size: 12px; }
  .preview-frame { width: 100%; height: 300px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .submit-btn { padding: 10px 24px; background: #3b66f5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; align-self: flex-start; transition: background 0.15s; margin-top: 8px; }
  .submit-btn:hover:not(:disabled) { background: #2d55e0; }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .security-note { font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 8px; }
`;

class HtmlCreativeBuilder extends BaseComponent {
  private name = '';
  private size = '300x250';
  private code = '';
  private clickUrl = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('input', this.handleInput);
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('input', this.handleInput);
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (!field) return;
    const value = (target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
    if (field === 'name') this.name = value;
    else if (field === 'size') this.size = value;
    else if (field === 'code') this.code = value;
    else if (field === 'clickUrl') this.clickUrl = value;
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="submit"]')) {
      this.emit('creative-submit', { name: this.name, format: 'html', code: this.code, clickUrl: this.clickUrl });
    }
  };

  private get isValid(): boolean {
    return this.name.trim().length > 0 && this.code.trim().length > 0;
  }

  protected renderTemplate(): string {
    const previewDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;}</style></head><body>${this.code}</body></html>`;
    return html`
      <div class="builder-layout">
        <div class="form-panel">
          <div class="field-group">
            <label class="field-label">Creative Name</label>
            <input type="text" class="field-input" data-field="name" value="${this.name}" placeholder="My HTML Creative">
          </div>
          <div class="field-group">
            <label class="field-label">Creative Size</label>
            <select class="field-select" data-field="size" value="${this.size}">
              <option value="300x250">300×250 (Medium Rectangle)</option>
              <option value="728x90">728×90 (Leaderboard)</option>
              <option value="160x600">160×600 (Wide Skyscraper)</option>
              <option value="320x50">320×50 (Mobile Banner)</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">HTML Code</label>
            <textarea class="field-textarea" data-field="code" placeholder="Paste your HTML creative code here...">${this.code}</textarea>
          </div>
          <div class="field-group">
            <label class="field-label">Click URL</label>
            <input type="text" class="field-input" data-field="clickUrl" value="${this.clickUrl}" placeholder="https://...">
          </div>
          <button class="submit-btn" data-action="submit" type="button" ${this.isValid ? '' : 'disabled'}>Submit for Approval</button>
          <p class="security-note">Preview is sandboxed (allow-scripts only). Scripts run but cannot access parent page.</p>
        </div>
        <div class="preview-panel">
          <p class="preview-title">Live Preview</p>
          <iframe class="preview-frame" sandbox="allow-scripts" srcdoc="${previewDoc}"></iframe>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('html-creative-builder', HtmlCreativeBuilder);
export { HtmlCreativeBuilder };