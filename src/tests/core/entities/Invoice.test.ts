import { describe, it, expect } from 'vitest';
import { Invoice } from '../../../core/entities/Invoice';
import { Money } from '../../../core/value-objects/Money';

describe('Invoice entity', () => {
  function makeInvoice() {
    return new Invoice('inv1', 'client-1', new Money(50000, 'USD'), 'draft', new Date('2026-01-01'), new Date('2026-02-01'));
  }

  it('constructs in draft status by default', () => {
    const inv = makeInvoice();
    expect(inv.status).toBe('draft');
    expect(inv.id).toBe('inv1');
    expect(inv.getAmount().getAmountMinorUnits()).toBe(50000);
  });

  it('can be marked sent from draft', () => {
    const inv = makeInvoice();
    inv.markSent();
    expect(inv.status).toBe('sent');
  });

  it('can be marked paid from sent', () => {
    const inv = makeInvoice();
    inv.markSent();
    inv.markPaid();
    expect(inv.status).toBe('paid');
  });

  it('can be marked overdue from sent', () => {
    const inv = makeInvoice();
    inv.markSent();
    inv.markOverdue();
    expect(inv.status).toBe('overdue');
  });

  it('cannot mark sent from paid', () => {
    const inv = makeInvoice();
    inv.markSent();
    inv.markPaid();
    expect(() => inv.markSent()).toThrow();
  });

  it('cannot void a paid invoice', () => {
    const inv = makeInvoice();
    inv.markSent();
    inv.markPaid();
    expect(() => inv.void()).toThrow();
  });

  it('can void a sent invoice', () => {
    const inv = makeInvoice();
    inv.markSent();
    inv.void();
    expect(inv.status).toBe('void');
  });
});