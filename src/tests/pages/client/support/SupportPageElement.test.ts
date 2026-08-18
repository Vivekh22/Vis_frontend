// @ts-nocheck
/**
 * SupportPageElement.test.ts — tests/pages/client/support/
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupportPageElement } from '../../../../pages/client/support/SupportPageElement';

vi.mock('../../../../services', () => ({
  supportService: {
    listTickets: vi.fn().mockResolvedValue([]),
    getTicket: vi.fn().mockResolvedValue(null),
    createTicket: vi.fn().mockResolvedValue({}),
    addReply: vi.fn().mockResolvedValue({}),
  },
}));

import '../../../../pages/client/support/SupportPageElement';

// Stub rich-text-field
if (!customElements.get('rich-text-field')) {
  class MockRichText extends HTMLElement {
    getValue(): string { return ''; }
    setValue(_v: string): void {}
  }
  customElements.define('rich-text-field', MockRichText);
}

describe('SupportPageElement', () => {
  let el: SupportPageElement;

  beforeEach(() => {
    el = document.createElement('support-page') as SupportPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Support');
  });

  it('renders New Ticket button', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('[data-action="new-ticket"]')).not.toBeNull();
  });

  it('clicking New Ticket opens create modal', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const btn = el.shadowRoot!.querySelector('[data-action="new-ticket"]') as HTMLButtonElement;
    btn.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('.modal-overlay')).not.toBeNull();
  });

  it('create modal includes rich-text-field for body', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const btn = el.shadowRoot!.querySelector('[data-action="new-ticket"]') as HTMLButtonElement;
    btn.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('rich-text-field')).not.toBeNull();
  });
});