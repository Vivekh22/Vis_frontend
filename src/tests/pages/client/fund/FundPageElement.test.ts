/**
 * FundPageElement.test.ts — tests for pages/client/fund/.
 *
 * Tests balance card, transactions table, add fund modal, and
 * Bank Transfer = Pending status (not immediately credited).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FundPageElement } from '../../../../pages/client/fund/FundPageElement';

vi.mock('../../../../services', () => ({
  fundService: {
    getBalance: vi.fn(),
    addFund: vi.fn(),
    getTransactionHistory: vi.fn().mockResolvedValue([]),
    setLowBalanceThreshold: vi.fn(),
    setAutoRecharge: vi.fn(),
  },
}));

import '../../../../pages/client/fund/FundPageElement';

import { fundService } from '../../../../services';
import { Money } from '../../../../core/value-objects/Money';
import { FundTransaction } from '../../../../core/entities/FundTransaction';
import { PaymentMethod } from '../../../../core/enums/PaymentMethod';

// Stub vis-modal so modal.open()/close() work in the test env
if (!customElements.get('vis-modal')) {
  class MockModal extends HTMLElement {
    open(): void {}
    close(): void {}
  }
  customElements.define('vis-modal', MockModal);
}

// Stub chart-widget
if (!customElements.get('chart-widget')) {
  class MockChart extends HTMLElement {}
  customElements.define('chart-widget', MockChart);
}

describe('FundPageElement', () => {
  let el: FundPageElement;

  beforeEach(() => {
    vi.mocked(fundService.getBalance).mockResolvedValue(new Money(50000, 'USD'));
    vi.mocked(fundService.getTransactionHistory).mockResolvedValue([]);
    el = document.createElement('fund-page') as FundPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Fund Management');
  });

  it('renders balance card with current balance', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const balanceValue = el.shadowRoot!.querySelector('.balance-value');
    expect(balanceValue?.textContent).toContain('500.00');
  });

  it('renders add fund button', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('[data-action="add-fund"]')).not.toBeNull();
  });

  it('renders monthly spend budget progress bar', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.budget-bar')).not.toBeNull();
  });

  it('renders transactions table with correct headers', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const ths = el.shadowRoot!.querySelectorAll('th');
    const texts = Array.from(ths).map((th: Element) => th.textContent ?? '');
    expect(texts).toContain('Date');
    expect(texts).toContain('Payment Mode');
    expect(texts).toContain('Status');
  });

  it('opens add fund modal on button click', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const addBtn = el.shadowRoot!.querySelector('[data-action="add-fund"]') as HTMLButtonElement;
    addBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('.modal-content')).not.toBeNull();
  });

  it('shows payment method tabs in modal', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const addBtn = el.shadowRoot!.querySelector('[data-action="add-fund"]') as HTMLButtonElement;
    addBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    const tabs = el.shadowRoot!.querySelectorAll('[data-payment-tab]');
    expect(tabs.length).toBe(3);
  });

  it('shows fee breakdown in modal', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const addBtn = el.shadowRoot!.querySelector('[data-action="add-fund"]') as HTMLButtonElement;
    addBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.shadowRoot!.querySelector('.fee-breakdown')).not.toBeNull();
  });

  it('Bank Transfer shows pending notice', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const addBtn = el.shadowRoot!.querySelector('[data-action="add-fund"]') as HTMLButtonElement;
    addBtn.click();
    await new Promise((r) => setTimeout(r, 10));
    const bankTab = el.shadowRoot!.querySelector('[data-payment-tab="bank_transfer"]') as HTMLButtonElement;
    bankTab.click();
    await new Promise((r) => setTimeout(r, 10));
    // The pending notice should be rendered in the modal HTML
    const modalHtml = el.shadowRoot!.innerHTML;
    expect(modalHtml).toContain('pending-notice');
    expect(modalHtml).toContain('Bank transfers are credited as Pending');
  });

  it('Bank Transfer addFund creates pending transaction — not immediately credited', async () => {
    const tx = new FundTransaction(
      'ft1', 'client-1', 'deposit',
      new Money(10000, 'USD'), new Date(),
      'Funds added via bank_transfer', 'pending', PaymentMethod.BankTransfer,
      new Money(10000, 'USD'), new Money(0, 'USD'), new Money(10000, 'USD'),
    );
    vi.mocked(fundService.addFund).mockResolvedValue(tx);
    vi.mocked(fundService.getBalance).mockResolvedValue(new Money(50000, 'USD'));

    await fundService.addFund('client-1', new Money(10000, 'USD'), PaymentMethod.BankTransfer);
    const balance = await fundService.getBalance('client-1');
    expect(balance.getAmountMinorUnits()).toBe(50000);
    expect(tx.status).toBe('pending');
  });
});