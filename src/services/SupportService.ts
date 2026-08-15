/**
 * SupportService.ts — services/
 *
 * Orchestrates support ticket CRUD and threaded conversation.
 *
 * !!! INTERNAL NOTES — ADMIN/SUPER-ADMIN ONLY !!!
 *
 * The `includeInternalNotes` flag controls whether the repository populates
 * the SupportTicket.internalNotes field. It defaults to FALSE — the client-
 * facing SupportService.listTickets() never passes it, so internal notes
 * remain null for client requests. Only admin/super-admin code paths pass
 * `includeInternalNotes: true`, making the Admin Support view the ONE place
 * this client-hidden field becomes visible.
 */
import type { SupportTicket } from '../core/entities/SupportTicket';
import type { SupportTicketStatus } from '../core/enums/SupportTicketStatus';
import type { SupportTicketPriority } from '../core/enums/SupportTicketPriority';
import type { SupportTicketCategory } from '../core/enums/SupportTicketCategory';

export interface CreateTicketData {
  clientId: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  body: string;
  linkedCampaignId?: string;
  linkedCreativeId?: string;
}

export interface AddReplyData {
  ticketId: string;
  authorId: string;
  authorName: string;
  body: string;
  isFromClient: boolean;
}

export interface SupportRepository {
  findAll(clientId: string, includeInternalNotes?: boolean): Promise<SupportTicket[]>;
  findById(id: string): Promise<SupportTicket | null>;
  create(data: CreateTicketData): Promise<SupportTicket>;
  addReply(data: AddReplyData): Promise<SupportTicket>;
  updateStatus(id: string, status: SupportTicketStatus): Promise<void>;
}

export class SupportService {
  constructor(private readonly supportRepo: SupportRepository) {}

  async listTickets(clientId: string, includeInternalNotes?: boolean): Promise<SupportTicket[]> {
    return await this.supportRepo.findAll(clientId, includeInternalNotes);
  }

  async getTicket(id: string): Promise<SupportTicket | null> {
    return await this.supportRepo.findById(id);
  }

  async createTicket(data: CreateTicketData): Promise<SupportTicket> {
    return await this.supportRepo.create(data);
  }

  async addReply(data: AddReplyData): Promise<SupportTicket> {
    return await this.supportRepo.addReply(data);
  }

  async resolveTicket(id: string): Promise<void> {
    await this.supportRepo.updateStatus(id, 'resolved' as SupportTicketStatus);
  }
}