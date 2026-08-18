// @ts-nocheck
/**
 * InvoicesBillingPageElement.test.ts — tests/pages/client/invoices-billing/
 *
 * !!! MARGIN ABSENCE AUDIT !!!
 * Asserts that no margin field appears in the rendered output.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InvoicesBillingPageElement } from '../../../../pages/client/invoices-billing/InvoicesBillingPageElement';

vi.mock('../../../../services', () => ({
  invoiceService: {
    listInvoices: vi.fn().mockResolvedValue([]),
    getOutstandingTotal: vi.fn().mockResolvedValue({ toDisplayString: () => '0.00 USD', getAmountMinorUnits: () => 0 }),
    getNextAutoInvoiceDate: vi.fn().mockResolvedValue(new Date('2026-09-01')),
    requestCustomStatement: vi.fn().mockResolvedValue({}),
    emailInvoice: vi.fn().mockResolvedValue(undefined),
  },
}));

import '../../../../pages/client/invoices-billing/InvoicesBillingPageElement';

describe('InvoicesBillingPageElement — Margin Absence', () => {
  let el: InvoicesBillingPageElement;

  beforeEach(() => {
    el = document.createElement('invoices-billing-page') as InvoicesBillingPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Invoices & Billing');
  });

  it('renders summary bar with outstanding and next invoice date', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.summary-bar')).not.toBeNull();
  });

  it('renders invoice table with correct headers', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const ths = el.shadowRoot!.querySelectorAll('th');
    const texts = Array.from(ths).map((th: Element) => th.textContent ?? '');
    expect(texts).toContain('Invoice #');
    expect(texts).toContain('Billing Period');
    expect(texts).toContain('Amount');
    expect(texts).toContain('Status');
  });

  it('renders Request Custom Statement button', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('[data-action="toggle-statement"]')).not.toBeNull();
  });

  it('rendered HTML does not contain the word "margin"', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const html = el.shadowRoot!.innerHTML.toLowerCase();
    expect(html).not.toContain('margin');
  });
});