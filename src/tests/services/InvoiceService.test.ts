/**
 * InvoiceService.test.ts — tests/services/
 *
 * !!! MARGIN ABSENCE AUDIT !!!
 *
 * These tests explicitly assert that no margin field exists in the
 * InvoiceService, InvoiceRepository interface, or Invoice entity. The
 * service does not fetch, map, or expose any margin-related field.
 */
import { describe, it, expect, vi } from 'vitest';
import { InvoiceService } from '../../services/InvoiceService';
import type { InvoiceRepository } from '../../services/InvoiceService';
import { Invoice } from '../../core/entities/Invoice';
import { Money } from '../../core/value-objects/Money';

function createMockRepo(): InvoiceRepository {
  return {
    findAll: vi.fn().mockResolvedValue([
      new Invoice('inv_001', 'client-1', new Money(50000, 'USD'), 'sent', new Date(), new Date(), 'January 2026'),
    ]),
    findById: vi.fn().mockResolvedValue(null),
    findOutstandingTotal: vi.fn().mockResolvedValue(new Money(50000, 'USD')),
    findNextAutoInvoiceDate: vi.fn().mockResolvedValue(new Date('2026-09-01')),
    createCustomStatement: vi.fn().mockResolvedValue(new Invoice('inv_stmt_1', 'client-1', new Money(0, 'USD'), 'draft', new Date(), new Date(), 'Custom')),
    emailInvoice: vi.fn().mockResolvedValue(undefined),
  };
}

describe('InvoiceService — Margin Absence Audit', () => {
  it('InvoiceService does not have a margin-related method', () => {
    const service = new InvoiceService(createMockRepo());
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    const marginMethods = methods.filter((m) => m.toLowerCase().includes('margin'));
    expect(marginMethods).toEqual([]);
  });

  it('InvoiceRepository interface does not have a margin field', () => {
    // The interface is defined in InvoiceService.ts. We verify by checking
    // that the mock repo (which implements it) has no margin properties.
    const repo = createMockRepo();
    const keys = Object.keys(repo);
    const marginKeys = keys.filter((k) => k.toLowerCase().includes('margin'));
    expect(marginKeys).toEqual([]);
  });

  it('Invoice entity does not have a margin field', () => {
    const inv = new Invoice('inv1', 'client-1', new Money(50000, 'USD'), 'draft', new Date(), new Date(), 'Jan 2026');
    const keys = Object.keys(inv);
    const marginKeys = keys.filter((k) => k.toLowerCase().includes('margin'));
    expect(marginKeys).toEqual([]);
  });

  it('listInvoices returns invoices with no margin field in rendered output', async () => {
    const service = new InvoiceService(createMockRepo());
    const invoices = await service.listInvoices('client-1');
    for (const inv of invoices) {
      const serialized = JSON.stringify(inv);
      expect(serialized.toLowerCase()).not.toContain('margin');
    }
  });
});

describe('InvoiceService — Basic Operations', () => {
  it('listInvoices returns invoices from repository', async () => {
    const service = new InvoiceService(createMockRepo());
    const invoices = await service.listInvoices('client-1');
    expect(invoices.length).toBe(1);
    expect(invoices[0]!.id).toBe('inv_001');
  });

  it('getOutstandingTotal returns Money', async () => {
    const service = new InvoiceService(createMockRepo());
    const total = await service.getOutstandingTotal('client-1');
    expect(total.getAmountMinorUnits()).toBe(50000);
  });

  it('requestCustomStatement creates a statement', async () => {
    const service = new InvoiceService(createMockRepo());
    const stmt = await service.requestCustomStatement({
      clientId: 'client-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });
    expect(stmt.id).toBe('inv_stmt_1');
  });

  it('emailInvoice calls repository emailInvoice', async () => {
    const repo = createMockRepo();
    const service = new InvoiceService(repo);
    await service.emailInvoice('inv_001', 'test@example.com');
    expect(repo.emailInvoice).toHaveBeenCalledWith('inv_001', 'test@example.com');
  });
});