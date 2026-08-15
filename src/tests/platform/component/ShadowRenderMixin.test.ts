/**
 * ShadowRenderMixin.test.ts — unit tests for platform/component/ShadowRenderMixin.ts.
 */
import { describe, it, expect } from 'vitest';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';

describe('injectStyles', () => {
  it('adds a working <style> tag into the ShadowRoot', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    injectStyles(shadow, '.x { color: red; }');
    const style = shadow.querySelector('style');
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain('.x');
  });
});

describe('injectGlobalTokens', () => {
  it('injects a <style> containing the design tokens into the ShadowRoot', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    injectGlobalTokens(shadow);
    const style = shadow.querySelector('style');
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain('--color-primary');
  });

  it('injects a <style> containing the theme variables into the ShadowRoot', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    injectGlobalTokens(shadow);
    const style = shadow.querySelector('style');
    expect(style?.textContent).toContain('[data-theme="dark"]');
  });
});