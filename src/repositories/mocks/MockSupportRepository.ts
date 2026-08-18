/**
 * MockSupportRepository.ts — repositories/mocks/
 *
 * In-memory mock for SupportService.
 *
 * !!! INTERNAL NOTES — ADMIN/SUPER-ADMIN ONLY !!!
 * When includeInternalNotes=true is passed to findAll(), the mock
 * populates ticket.internalNotes with admin-only commentary. When
 * false (default), internalNotes remains null — the client view
 * never sees it.
 */
import { SupportTicket } from '../../core/entities/SupportTicket';
import type { TicketMessage } from '../../core/entities/SupportTicket';
import type { SupportTicketStatus } from '../../core/enums/SupportTicketStatus';
import type { CreateTicketData, AddReplyData, SupportRepository } from '../../services/SupportService';

export class MockSupportRepository implements SupportRepository {
  private readonly tickets: SupportTicket[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    const t1 = new SupportTicket('tkt_001', 'client-1', 'Campaign not delivering', 'campaign', 'in_progress', 'high', new Date(Date.now() - 3 * 86400000), 'camp_001');
    t1.addMessage({ id: 'msg_001', authorId: 'u1', authorName: 'Client User', body: 'My campaign is not getting impressions.', createdAt: new Date(Date.now() - 3 * 86400000), isFromClient: true });
    t1.addMessage({ id: 'msg_002', authorId: 'support1', authorName: 'Support Agent', body: 'We are investigating the delivery issue.', createdAt: new Date(Date.now() - 2 * 86400000), isFromClient: false });
    this.tickets.push(t1);

    const t2 = new SupportTicket('tkt_002', 'client-1', 'Invoice question', 'billing', 'resolved', 'medium', new Date(Date.now() - 7 * 86400000));
    t2.addMessage({ id: 'msg_003', authorId: 'u1', authorName: 'Client User', body: 'Can I get a copy of last month invoice?', createdAt: new Date(Date.now() - 7 * 86400000), isFromClient: true });
    this.tickets.push(t2);
  }

  async findAll(clientId: string, includeInternalNotes?: boolean): Promise<SupportTicket[]> {
    const results = this.tickets.filter((t) => t.clientId === clientId);
    // Removed internalNotes logic as the property no longer exists
    return results;
  }

  async findById(id: string): Promise<SupportTicket | null> {
    return this.tickets.find((t) => t.id === id) ?? null;
  }

  async create(data: CreateTicketData): Promise<SupportTicket> {
    const ticket = new SupportTicket(
      `tkt_${Date.now().toString(36)}`,
      data.clientId,
      data.subject,
      data.category,
      'open',
      data.priority,
      new Date(),
      data.linkedCampaignId,
      data.linkedCreativeId,
    );
    ticket.addMessage({
      id: `msg_${Date.now().toString(36)}`,
      authorId: 'u1',
      authorName: 'Client User',
      body: data.body,
      createdAt: new Date(),
      isFromClient: true,
    });
    this.tickets.push(ticket);
    return ticket;
  }

  async addReply(data: AddReplyData): Promise<SupportTicket> {
    const ticket = this.tickets.find((t) => t.id === data.ticketId);
    if (!ticket) throw new Error(`Ticket not found: ${data.ticketId}`);
    const msg: TicketMessage = {
      id: `msg_${Date.now().toString(36)}`,
      authorId: data.authorId,
      authorName: data.authorName,
      body: data.body,
      createdAt: new Date(),
      isFromClient: data.isFromClient,
    };
    ticket.addMessage(msg);
    return ticket;
  }

  async updateStatus(id: string, status: SupportTicketStatus): Promise<void> {
    const ticket = this.tickets.find((t) => t.id === id);
    if (!ticket) return;
    if (status === 'resolved') ticket.resolve();
    if (status === 'closed') ticket.close();
  }
}