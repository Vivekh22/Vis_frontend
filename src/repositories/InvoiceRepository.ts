/**
 * InvoiceRepository.ts — repositories/
 *
 * Real implementation of InvoiceRepository. Calls the invoice API endpoints
 * and maps DTOs to Invoice entities.
 *
 * !!! MARGIN ABSENCE !!!
 * The InvoiceDto has no margin field. The mapping function does not map
 * any margin field. Margin is never fetched from the API.
 */
import { Invoice } from '../core/entities/Invoice';
import type { InvoiceStatus } from '../core/entities/Invoice';
import { Money } from '../core/value-objects/Money';
import type { InvoiceFilter, CustomStatementRequest, InvoiceRepository as IInvoiceRepository } from '../services/InvoiceService';
import { ApiClient } from './ApiClient';

interface MoneyDto { amountMinorUnits: number; currency: string; }
interface InvoiceDto {
  id: string; clientId: string; amountMinorUnits: number; currency: string;
  status: InvoiceStatus; issueDate: string; dueDate: string; billingPeriod?: string;
}

export function mapDtoToInvoice(dto: InvoiceDto): Invoice {
  return new Invoice(
    dto.id, dto.clientId, new Money(dto.amountMinorUnits, dto.currency),
    dto.status, new Date(dto.issueDate), new Date(dto.dueDate), dto.billingPeriod,
  );
}

export class InvoiceRepository implements IInvoiceRepository {
  constructor(private readonly api: ApiClient) {}

  async findAll(filter?: InvoiceFilter): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (filter?.clientId) params.set('clientId', filter.clientId);
    if (filter?.status) params.set('status', filter.status);
    const query = params.toString();
    const dtos = await this.api.get<InvoiceDto[]>(`/api/invoices${query ? `?${query}` : ''}`);
    return dtos.map(mapDtoToInvoice);
  }

  async findById(id: string): Promise<Invoice | null> {
    const dto = await this.api.get<InvoiceDto>(`/api/invoices/${encodeURIComponent(id)}`);
    return mapDtoToInvoice(dto);
  }

  async findOutstandingTotal(clientId: string): Promise<Money> {
    const dto = await this.api.get<MoneyDto>(`/api/invoices/${encodeURIComponent(clientId)}/outstanding`);
    return new Money(dto.amountMinorUnits, dto.currency);
  }

  async findNextAutoInvoiceDate(clientId: string): Promise<Date | null> {
    const dto = await this.api.get<{ date: string | null }>(`/api/invoices/${encodeURIComponent(clientId)}/next-auto`);
    return dto.date ? new Date(dto.date) : null;
  }

  async createCustomStatement(request: CustomStatementRequest): Promise<Invoice> {
    const dto = await this.api.post<InvoiceDto>(`/api/invoices/custom-statement`, {
      clientId: request.clientId,
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
    });
    return mapDtoToInvoice(dto);
  }

  async emailInvoice(id: string, email: string): Promise<void> {
    await this.api.post<void>(`/api/invoices/${encodeURIComponent(id)}/email`, { email });
  }
}