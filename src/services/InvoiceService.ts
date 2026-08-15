/**
 * InvoiceService.ts — services/
 *
 * Orchestrates invoice listing, custom statement requests, and email
 * delivery. Uses the existing Invoice entity from Part 3.
 *
 * !!! MARGIN ABSENCE AUDIT !!!
 *
 * This service does NOT fetch, map, or expose any margin-related field.
 * The Invoice entity has no margin field. The InvoiceRepository interface
 * has no margin field. The DTO has no margin field. Margin is a platform-
 * wide prohibited concept in the client-facing billing module — it is
 * never computed, stored, or displayed. This is a hard rule from the
 * original spec documents.
 *
 * PDF APPROACH — INTERIM:
 *   Invoice "download" generates a structured print-friendly HTML view
 *   (InvoicePrintViewElement) rather than a binary PDF. The browser's
 *   native print-to-PDF handles the conversion. Real PDF generation is
 *   a backend concern for later — this frontend has no PDF library
 *   (zero-dependency principle) and no backend yet.
 */
import type { Invoice } from '../core/entities/Invoice';
import { Money } from '../core/value-objects/Money';

export interface InvoiceFilter {
  clientId?: string;
  status?: string;
}

export interface CustomStatementRequest {
  clientId: string;
  startDate: Date;
  endDate: Date;
}

export interface InvoiceRepository {
  findAll(filter?: InvoiceFilter): Promise<Invoice[]>;
  findById(id: string): Promise<Invoice | null>;
  findOutstandingTotal(clientId: string): Promise<Money>;
  findNextAutoInvoiceDate(clientId: string): Promise<Date | null>;
  createCustomStatement(request: CustomStatementRequest): Promise<Invoice>;
  emailInvoice(id: string, email: string): Promise<void>;
}

export class InvoiceService {
  constructor(private readonly invoiceRepo: InvoiceRepository) {}

  async listInvoices(clientId: string): Promise<Invoice[]> {
    return await this.invoiceRepo.findAll({ clientId });
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    return await this.invoiceRepo.findById(id);
  }

  async getOutstandingTotal(clientId: string): Promise<Money> {
    return await this.invoiceRepo.findOutstandingTotal(clientId);
  }

  async getNextAutoInvoiceDate(clientId: string): Promise<Date | null> {
    return await this.invoiceRepo.findNextAutoInvoiceDate(clientId);
  }

  async requestCustomStatement(request: CustomStatementRequest): Promise<Invoice> {
    return await this.invoiceRepo.createCustomStatement(request);
  }

  async emailInvoice(id: string, email: string): Promise<void> {
    await this.invoiceRepo.emailInvoice(id, email);
  }
}