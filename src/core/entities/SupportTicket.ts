/**
 * SupportTicket.ts — core/entities/
 *
 * Represents a client support ticket with threaded conversation.
 *
 * !!! INTERNAL NOTES — ADMIN/SUPER-ADMIN ONLY !!!
 *
 * The `internalNotes` field exists on this entity but is NEVER populated
 * for client-facing requests. The SupportRepository.findAll() accepts an
 * `includeInternalNotes` flag (default false) — when false, internalNotes
 * is left null. Only admin/super-admin code paths pass `includeInternalNotes:
 * true`, making the Admin Support view the ONE place this client-hidden
 * field becomes visible. The Client Support view never sees it.
 */
import type { SupportTicketStatus } from '../enums/SupportTicketStatus';
import type { SupportTicketPriority } from '../enums/SupportTicketPriority';
import type { SupportTicketCategory } from '../enums/SupportTicketCategory';

export interface TicketMessage {
  readonly id: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly isFromClient: boolean;
}

export class SupportTicket {
  private _status: SupportTicketStatus;
  private _priority: SupportTicketPriority;
  private readonly _messages: TicketMessage[] = [];
  private _internalNotes: string | null = null;

  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly subject: string,
    category: SupportTicketCategory,
    status: SupportTicketStatus,
    priority: SupportTicketPriority,
    public readonly createdAt: Date = new Date(),
    public readonly linkedCampaignId?: string,
    public readonly linkedCreativeId?: string,
  ) {
    this._status = status;
    this._priority = priority;
    this.category = category;
  }

  public category: SupportTicketCategory;

  public get status(): SupportTicketStatus {
    return this._status;
  }

  public get priority(): SupportTicketPriority {
    return this._priority;
  }

  public get messages(): readonly TicketMessage[] {
    return this._messages;
  }

  public get internalNotes(): string | null {
    return this._internalNotes;
  }

  public set internalNotes(value: string | null) {
    this._internalNotes = value;
  }

  public get lastUpdatedAt(): Date {
    if (this._messages.length === 0) return this.createdAt;
    const last = this._messages[this._messages.length - 1];
    return last ? last.createdAt : this.createdAt;
  }

  public addMessage(message: TicketMessage): void {
    this._messages.push(message);
    if (this._status === 'resolved' || this._status === 'closed') {
      this._status = 'in_progress';
    }
  }

  public resolve(): void {
    this._status = 'resolved';
  }

  public close(): void {
    this._status = 'closed';
  }

  public reopen(): void {
    if (this._status === 'closed') {
      this._status = 'open';
    }
  }
}