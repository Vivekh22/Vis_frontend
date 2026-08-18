// @ts-nocheck
/**
 * LoadingStateElement.test.ts — tests for the loading state component.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { LoadingStateElement } from '../../../components/loading-state/LoadingStateElement';
import '../../../components/loading-state/LoadingStateElement';

describe('LoadingStateElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a spinner by default', () => {
    const el = document.createElement('loading-state') as LoadingStateElement;
    document.body.appendChild(el);
    const spinner = el.shadowRoot!.querySelector('.spinner');
    expect(spinner).not.toBeNull();
  });

  it('renders a skeleton chart when variant=skeleton, shape=chart', () => {
    const el = document.createElement('loading-state') as LoadingStateElement;
    document.body.appendChild(el);
    el.variant = 'skeleton';
    el.shape = 'chart';
    const skeleton = el.shadowRoot!.querySelector('.skeleton-chart');
    expect(skeleton).not.toBeNull();
  });

  it('renders a skeleton card when shape=card', () => {
    const el = document.createElement('loading-state') as LoadingStateElement;
    document.body.appendChild(el);
    el.variant = 'skeleton';
    el.shape = 'card';
    const skeleton = el.shadowRoot!.querySelector('.skeleton-card');
    expect(skeleton).not.toBeNull();
  });

  it('renders skeleton table rows when shape=table-rows', () => {
    const el = document.createElement('loading-state') as LoadingStateElement;
    document.body.appendChild(el);
    el.variant = 'skeleton';
    el.shape = 'table-rows';
    const rows = el.shadowRoot!.querySelectorAll('.skeleton-row');
    expect(rows.length).toBe(5);
  });

  it('renders a spinner when variant=spinner', () => {
    const el = document.createElement('loading-state') as LoadingStateElement;
    document.body.appendChild(el);
    el.variant = 'spinner';
    const spinner = el.shadowRoot!.querySelector('.spinner');
    expect(spinner).not.toBeNull();
    const skeleton = el.shadowRoot!.querySelector('.skeleton');
    expect(skeleton).toBeNull();
  });
});