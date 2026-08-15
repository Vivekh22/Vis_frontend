/**
 * NotFoundHandler.test.ts — unit tests for platform/router/NotFoundHandler.ts.
 */
import { describe, it, expect } from 'vitest';
import { renderNotFound } from '../../../platform/router/NotFoundHandler';

describe('renderNotFound', () => {
  it('renders a styled 404 view into the container', () => {
    const el = document.createElement('div');
    renderNotFound(el);
    expect(el.textContent).toContain('404');
    expect(el.textContent).toContain('not found');
    expect(el.querySelector('style')).not.toBeNull();
    expect(el.querySelector('.nf-root')).not.toBeNull();
  });
});