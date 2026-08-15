/**
 * SafeHtml.test.ts — unit tests for platform/rendering/SafeHtml.ts.
 */
import { describe, it, expect } from 'vitest';
import { escapeHtml, html, SafeHtmlString, render } from '../../../platform/rendering/SafeHtml';

describe('escapeHtml', () => {
  it('escapes &', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });
  it('escapes <', () => {
    expect(escapeHtml('a<b')).toBe('a&lt;b');
  });
  it('escapes >', () => {
    expect(escapeHtml('a>b')).toBe('a&gt;b');
  });
  it('escapes "', () => {
    expect(escapeHtml('a"b')).toBe('a&quot;b');
  });
  it("escapes '", () => {
    expect(escapeHtml("a'b")).toBe('a&#39;b');
  });
  it('escapes all five in combination', () => {
    expect(escapeHtml('<a href="x" onclick=\'y\'>&</a>')).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });
});

describe('html tagged template', () => {
  it('auto-escapes a script-tag attempt', () => {
    const evil = '<script>alert(1)</script>';
    const out = html`<p>${evil}</p>`;
    expect(out).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    expect(out).not.toContain('<script>');
  });
  it('escapes plain interpolated values', () => {
    expect(html`<p>${'a&b'}</p>`).toBe('<p>a&amp;b</p>');
  });
  it('inserts SafeHtmlString values verbatim without double-escaping', () => {
    const safe = SafeHtmlString.trusted('<b>hi</b>');
    expect(html`<div>${safe}</div>`).toBe('<div><b>hi</b></div>');
  });
  it('composes an html-templated string inside another via SafeHtmlString without double-escaping', () => {
    const inner = html`<b>${'hi'}</b>`;
    const outer = html`<div>${SafeHtmlString.trusted(inner)}</div>`;
    expect(outer).toBe('<div><b>hi</b></div>');
  });
  it('renders null and undefined as empty', () => {
    expect(html`<p>${null}${undefined}</p>`).toBe('<p></p>');
  });
});

describe('render', () => {
  it('sets innerHTML on the container', () => {
    const el = document.createElement('div');
    render(el, html`<span>${'hi'}</span>`);
    expect(el.innerHTML).toBe('<span>hi</span>');
  });
});