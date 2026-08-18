// @ts-nocheck
/**
 * HtmlCreativeBuilder.test.ts — tests for pages/client/creatives/builders/.
 *
 * SECURITY-CRITICAL TEST: explicitly asserts the exact iframe sandbox
 * flag string. The sandbox attribute MUST be "allow-scripts" — NOT
 * "allow-scripts allow-same-origin" (which would let untrusted HTML
 * access the parent page's cookies and localStorage — a real XSS vector).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../../../../pages/client/creatives/builders/HtmlCreativeBuilder';


describe('HtmlCreativeBuilder', () => {
  let el: HtmlCreativeBuilder;

  beforeEach(() => {
    el = document.createElement('html-creative-builder') as HtmlCreativeBuilder;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders a two-panel layout (form + preview)', () => {
    expect(el.shadowRoot!.querySelector('.form-panel')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.preview-panel')).not.toBeNull();
  });

  it('renders an iframe for preview', () => {
    const iframe = el.shadowRoot!.querySelector('iframe');
    expect(iframe).not.toBeNull();
  });

  it('iframe sandbox is exactly "allow-scripts" — NOT allow-same-origin', () => {
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    const sandbox = iframe.getAttribute('sandbox');
    expect(sandbox).toBe('allow-scripts');
    expect(sandbox).not.toContain('allow-same-origin');
    expect(sandbox).not.toContain('allow-forms');
    expect(sandbox).not.toContain('allow-popups');
    expect(sandbox).not.toContain('allow-top-navigation');
  });

  it('submit button is disabled when name or code is empty', () => {
    const btn = el.shadowRoot!.querySelector('[data-action="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('iframe srcdoc contains the HTML code', () => {
    const codeInput = el.shadowRoot!.querySelector('[data-field="code"]') as HTMLTextAreaElement;
    codeInput.value = '<b>Test Content</b>';
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    el['rerender']();
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('srcdoc')).toContain('<b>Test Content</b>');
  });
});