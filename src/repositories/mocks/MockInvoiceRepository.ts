/**
 * MockInvoiceRepository.ts — repositories/mocks/
 *
 * In-memory mock for InvoiceService. Seeds sample invoices.
 *
 * !!! MARGIN ABSENCE !!!
 * No margin field is stored, computed, or returned — confirmed by
 * the absence of any margin-related property in this class.
 */
import { Invoice } from '../../core/entities/Invoice';
import { Money } from '../../core/value-objects/Money';
import type { InvoiceFilter, CustomStatementRequest, InvoiceRepository } from '../../services/InvoiceService';

export class MockInvoiceRepository implements InvoiceRepository {
  private readonly invoices: Invoice[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date();
    const inv1 = new Invoice('inv_001', 'client-1', new Money(50000, 'USD'), 'sent', new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 15), 'Previous Month');
    const inv2 = new Invoice('inv_002', 'client-1', new Money(75000, 'USD'), 'paid', new Date(now.getFullYear(), now.getMonth() - 2, 1), new Date(now.getFullYear(), now.getMonth() - 1, 15), 'Two Months Ago');
    const inv3 = new Invoice('inv_003', 'client-1', new Money(30000, 'USD'), 'overdue', new Date(now.getFullYear(), now.getMonth() - 3, 1), new Date(now.getFullYear(), now.getMonth() - 2, 15), 'Three Months Ago');
    const inv4 = new Invoice('inv_004', 'client-1', new Money(10000, 'USD'), 'draft', new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 15), 'Current Month');
    this.invoices.push(inv1, inv2, inv3, inv4);
  }

  async findAll(filter?: InvoiceFilter): Promise<Invoice[]> {
    let results = [...this.invoices];
    if (filter?.clientId) {
      results = results.filter((i) => i.clientId === filter.clientId);
    }
    if (filter?.status) {
      results = results.filter((i) => i.status === filter.status);
    }
    return results;
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.invoices.find((i) => i.id === id) ?? null;
  }

  async findOutstandingTotal(_clientId: string): Promise<Money> {
    const outstanding = this.invoices
      .filter((i) => i.clientId === _clientId && (i.status === 'sent' || i.status === 'overdue'))
      .reduce((sum, inv) => sum + inv.getAmount().getAmountMinorUnits(), 0);
    return new Money(outstanding, 'USD');
  }

  async findNextAutoInvoiceDate(_clientId: string): Promise<Date | null> {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  async createCustomStatement(request: CustomStatementRequest): Promise<Invoice> {
    const inv = new Invoice(
      `inv_stmt_${Date.now().toString(36)}`,
      request.clientId,
      new Money(0, 'USD'),
      'draft',
      new Date(),
      new Date(request.endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      `Custom ${request.startDate.toLocaleDateString()} - ${request.endDate.toLocaleDateString()}`,
    );
    this.invoices.push(inv);
    return inv;
  }

  async emailInvoice(_id: string, _email: string): Promise<void> {
    // Mock: no-op
  }
}