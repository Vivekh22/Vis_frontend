/**
 * EmptyStateElement.test.ts — tests for the empty state component.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { EmptyStateElement } from '../../../components/empty-state/EmptyStateElement';
import '../../../components/empty-state/EmptyStateElement';

describe('EmptyStateElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a message', () => {
    const el = document.createElement('empty-state') as EmptyStateElement;
    document.body.appendChild(el);
    el.message = 'No campaigns found';
    const msg = el.shadowRoot!.querySelector('.empty-message');
    expect(msg?.textContent).toBe('No campaigns found');
  });

  it('renders an icon when iconName is set', () => {
    const el = document.createElement('empty-state') as EmptyStateElement;
    document.body.appendChild(el);
    el.message = 'Empty';
    el.iconName = '📭';
    const icon = el.shadowRoot!.querySelector('.empty-icon');
    expect(icon?.textContent).toBe('📭');
  });

  it('does not render icon when iconName is null', () => {
    const el = document.createElement('empty-state') as EmptyStateElement;
    document.body.appendChild(el);
    el.message = 'Empty';
    el.iconName = null;
    const icon = el.shadowRoot!.querySelector('.empty-icon');
    expect(icon).toBeNull();
  });

  it('renders an action button when actionLabel is set', () => {
    const el = document.createElement('empty-state') as EmptyStateElement;
    document.body.appendChild(el);
    el.message = 'No team members';
    el.actionLabel = 'Invite Team Member';
    const btn = el.shadowRoot!.querySelector('.empty-action');
    expect(btn?.textContent).toBe('Invite Team Member');
  });

  it('emits action-clicked when the action button is clicked', () => {
    const el = document.createElement('empty-state') as EmptyStateElement;
    document.body.appendChild(el);
    el.message = 'Empty';
    el.actionLabel = 'Add Item';

    let clicked = false;
    el.addEventListener('action-clicked', () => {
      clicked = true;
    });

    const btn = el.shadowRoot!.querySelector('.empty-action') as HTMLButtonElement;
    btn.click();
    expect(clicked).toBe(true);
  });

  it('does not render action button when actionLabel is null', () => {
    const el = document.createElement('empty-state') as EmptyStateElement;
    document.body.appendChild(el);
    el.message = 'Empty';
    el.actionLabel = null;
    const btn = el.shadowRoot!.querySelector('.empty-action');
    expect(btn).toBeNull();
  });
});