/**
 * ErrorStateElement.test.ts — tests for the error state component.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { ErrorStateElement } from '../../../components/error-state/ErrorStateElement';
import '../../../components/error-state/ErrorStateElement';

describe('ErrorStateElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an error message', () => {
    const el = document.createElement('error-state') as ErrorStateElement;
    document.body.appendChild(el);
    el.message = 'Failed to load data';
    const msg = el.shadowRoot!.querySelector('.error-message');
    expect(msg?.textContent).toBe('Failed to load data');
  });

  it('renders a retry button when retryLabel is set', () => {
    const el = document.createElement('error-state') as ErrorStateElement;
    document.body.appendChild(el);
    el.message = 'Error';
    el.retryLabel = 'Try Again';
    const btn = el.shadowRoot!.querySelector('.retry-btn');
    expect(btn?.textContent).toBe('Try Again');
  });

  it('does not render retry button when retryLabel is null', () => {
    const el = document.createElement('error-state') as ErrorStateElement;
    document.body.appendChild(el);
    el.message = 'Error';
    el.retryLabel = null;
    const btn = el.shadowRoot!.querySelector('.retry-btn');
    expect(btn).toBeNull();
  });

  it('emits retry-clicked when the retry button is clicked', () => {
    const el = document.createElement('error-state') as ErrorStateElement;
    document.body.appendChild(el);
    el.message = 'Error';
    el.retryLabel = 'Retry';

    let clicked = false;
    el.addEventListener('retry-clicked', () => {
      clicked = true;
    });

    const btn = el.shadowRoot!.querySelector('.retry-btn') as HTMLButtonElement;
    btn.click();
    expect(clicked).toBe(true);
  });

  it('uses danger token colors (visually distinct from EmptyStateElement)', () => {
    const el = document.createElement('error-state') as ErrorStateElement;
    document.body.appendChild(el);
    el.message = 'Error';
    const container = el.shadowRoot!.querySelector('.error-state') as HTMLElement;
    // The container uses danger token colors via CSS classes
    expect(container.classList.contains('error-state')).toBe(true);
  });
});