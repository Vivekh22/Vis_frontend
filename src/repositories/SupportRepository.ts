/**
 * SupportRepository.ts — repositories/
 *
 * Real implementation of SupportRepository.
 *
 * !!! INTERNAL NOTES ABSENCE !!!
 * The SupportTicketDto has no internalNotes field. The mapping function
 * does not map any internalNotes field. Internal notes are never fetched
 * from the API for the client role.
 */
import { SupportTicket } from '../core/entities/SupportTicket';
import type { SupportTicketStatus } from '../core/enums/SupportTicketStatus';
import type { SupportTicketCategory } from '../core/enums/SupportTicketCategory';
import type { SupportTicketPriority } from '../core/enums/SupportTicketPriority';
import type { CreateTicketData, AddReplyData, SupportRepository as ISupportRepository } from '../services/SupportService';
import { ApiClient } from './ApiClient';

interface TicketMessageDto {
  id: string; authorId: string; authorName: string; body: string;
  createdAt: string; isFromClient: boolean;
}
interface SupportTicketDto {
  id: string; clientId: string; subject: string; category: SupportTicketCategory;
  status: SupportTicketStatus; priority: SupportTicketPriority; createdAt: string;
  linkedCampaignId?: string; linkedCreativeId?: string; messages: TicketMessageDto[];
}

function mapDtoToTicket(dto: SupportTicketDto): SupportTicket {
  const ticket = new SupportTicket(
    dto.id, dto.clientId, dto.subject, dto.category, dto.status, dto.priority,
    new Date(dto.createdAt), dto.linkedCampaignId, dto.linkedCreativeId,
  );
  for (const msg of dto.messages ?? []) {
    ticket.addMessage({
      id: msg.id, authorId: msg.authorId, authorName: msg.authorName,
      body: msg.body, createdAt: new Date(msg.createdAt), isFromClient: msg.isFromClient,
    });
  }
  return ticket;
}

export class SupportRepository implements ISupportRepository {
  constructor(private readonly api: ApiClient) {}

  async findAll(clientId: string): Promise<SupportTicket[]> {
    const dtos = await this.api.get<SupportTicketDto[]>(`/api/support/tickets?clientId=${encodeURIComponent(clientId)}`);
    return dtos.map(mapDtoToTicket);
  }

  async findById(id: string): Promise<SupportTicket | null> {
    const dto = await this.api.get<SupportTicketDto>(`/api/support/tickets/${encodeURIComponent(id)}`);
    return mapDtoToTicket(dto);
  }

  async create(data: CreateTicketData): Promise<SupportTicket> {
    const dto = await this.api.post<SupportTicketDto>('/api/support/tickets', {
      clientId: data.clientId, subject: data.subject, category: data.category,
      priority: data.priority, body: data.body,
      linkedCampaignId: data.linkedCampaignId, linkedCreativeId: data.linkedCreativeId,
    });
    return mapDtoToTicket(dto);
  }

  async addReply(data: AddReplyData): Promise<SupportTicket> {
    const dto = await this.api.post<SupportTicketDto>(`/api/support/tickets/${encodeURIComponent(data.ticketId)}/replies`, {
      authorId: data.authorId, authorName: data.authorName, body: data.body, isFromClient: data.isFromClient,
    });
    return mapDtoToTicket(dto);
  }

  async updateStatus(id: string, status: SupportTicketStatus): Promise<void> {
    await this.api.patch<void>(`/api/support/tickets/${encodeURIComponent(id)}/status`, { status });
  }
}