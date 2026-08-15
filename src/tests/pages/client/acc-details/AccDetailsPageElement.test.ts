/**
 * AccDetailsPageElement.test.ts — tests/pages/client/acc-details/
 *
 * Tests banking field masking (reveal toggle) and Reg Details read-only.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AccDetailsPageElement } from '../../../../pages/client/acc-details/AccDetailsPageElement';

vi.mock('../../../../services', () => ({
  teamService: {
    listMembers: vi.fn().mockResolvedValue([]),
  },
}));

import '../../../../pages/client/acc-details/AccDetailsPageElement';

describe('AccDetailsPageElement', () => {
  let el: AccDetailsPageElement;

  beforeEach(() => {
    el = document.createElement('acc-details-page') as AccDetailsPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Account Details');
  });

  it('renders all 6 tabs', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const tabs = el.shadowRoot!.querySelectorAll('.tab');
    expect(tabs.length).toBe(6);
    const texts = Array.from(tabs).map((t: Element) => t.textContent);
    expect(texts).toContain('Bank Details');
    expect(texts).toContain('Company Details');
    expect(texts).toContain('Address');
    expect(texts).toContain('Reg Details');
    expect(texts).toContain('Team Members');
    expect(texts).toContain('History');
  });

  it('Bank Details tab shows masked account number by default', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const bankTab = Array.from(el.shadowRoot!.querySelectorAll('.tab')).find((t: Element) => t.textContent === 'Bank Details') as HTMLElement;
    bankTab.click();
    await new Promise((r) => setTimeout(r, 10));
    const inputs = el.shadowRoot!.querySelectorAll('input[readonly]');
    const accountInput = Array.from(inputs).find((i: Element) => (i as HTMLInputElement).value.includes('•'));
    expect(accountInput).toBeTruthy();
  });

  it('Bank Details tab has reveal toggle for account number', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const bankTab = Array.from(el.shadowRoot!.querySelectorAll('.tab')).find((t: Element) => t.textContent === 'Bank Details') as HTMLElement;
    bankTab.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('[data-action="reveal-account"]')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('[data-action="reveal-routing"]')).not.toBeNull();
  });

  it('Reg Details tab has no edit form — all inputs are readonly', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const regTab = Array.from(el.shadowRoot!.querySelectorAll('.tab')).find((t: Element) => t.textContent === 'Reg Details') as HTMLElement;
    regTab.click();
    await new Promise((r) => setTimeout(r, 10));
    const inputs = el.shadowRoot!.querySelectorAll('.tab-content input');
    inputs.forEach((input) => {
      expect(input.hasAttribute('readonly')).toBe(true);
    });
  });

  it('Reg Details tab shows read-only notice', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const regTab = Array.from(el.shadowRoot!.querySelectorAll('.tab')).find((t: Element) => t.textContent === 'Reg Details') as HTMLElement;
    regTab.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('.readonly-notice')).not.toBeNull();
  });
});