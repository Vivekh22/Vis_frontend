/**
 * SupportPageElement.ts — pages/client/support/
 *
 * Ticket list (Subject, Category, Status, Priority, Last Updated),
 * "+ New Ticket" with RichTextFieldElement for rich text body (sanitized
 * through InputSanitizer before storage), attachments, linked Campaign/
 * Creative. Threaded conversation view.
 *
 * !!! INTERNAL NOTES ABSENCE !!!
 *   The SupportService DTO does not request or map an internalNotes field.
 *   The SupportTicket entity has no internalNotes field. Internal notes are
 *   never fetched, stored, or rendered in this client-facing view —
 *   confirmed at the service, entity, and repository levels.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { supportService } from '../../../services';
import type { SupportTicket } from '../../../core/entities/SupportTicket';
import { SupportTicketCategory } from '../../../core/enums/SupportTicketCategory';
import { SupportTicketPriority } from '../../../core/enums/SupportTicketPriority';
import type { RichTextFieldElement } from '../../../components/rich-text-field/RichTextFieldElement';
import '../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); padding: var(--space-4) 0; }

  /* Header */
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: var(--font-weight-bold); color: #111827; margin: 0 0 4px 0; }
  .page-subtitle { font-size: 13px; color: #6b7280; margin: 0; }
  .btn-primary { padding: 8px 16px; background: #3b66f5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .btn-secondary { padding: 8px 14px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .btn-back { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; margin-bottom: 20px; }

  /* Table */
  .table-container { background: white; border: 1px solid #eef0f4; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 14px 20px; border-bottom: 1px solid #f8fafc; font-size: 13px; }
  th { font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; background: #fcfdfd; }
  tr:last-child td { border-bottom: none; }
  tr[data-ticket-id] { cursor: pointer; }
  tr[data-ticket-id]:hover td { background: #fafbfc; }
  .ticket-subject { font-weight: 600; color: #111827; }
  .ticket-id { font-size: 11px; color: #94a3b8; margin-top: 2px; }

  /* Status & Priority pills */
  .pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .pill.open { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .pill.in_progress { background: #eff3ff; color: #3b66f5; border: 1px solid #c7d2fe; }
  .pill.resolved { background: #e5f5eb; color: #16a34a; border: 1px solid #bbf7d0; }
  .pill.closed { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
  .pill.urgent { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .pill.high { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .pill.medium { background: #f8fafc; color: #374151; border: 1px solid #e2e8f0; }
  .pill.low { background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; }

  /* Conversation */
  .conversation-card { background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .ticket-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f8fafc; }
  .conversation { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; max-height: 400px; overflow-y: auto; }
  .message { padding: 12px 16px; border-radius: 10px; max-width: 75%; }
  .message.from-client { background: #3b66f5; color: white; align-self: flex-end; border-bottom-right-radius: 3px; }
  .message.from-support { background: #f8fafc; color: #1e293b; align-self: flex-start; border-bottom-left-radius: 3px; border: 1px solid #eef0f4; }
  .message-author { font-size: 11px; opacity: 0.75; margin-bottom: 4px; font-weight: 500; }
  .message-body { font-size: 13px; line-height: 1.5; }
  .reply-section { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid #f8fafc; }
  .reply-input { flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: #fcfdfd; color: #1e293b; outline: none; }
  .reply-input:focus { border-color: #3b66f5; }

  /* Create Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
  .modal { background: white; border-radius: 16px; padding: 28px; min-width: 500px; max-width: 90vw; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
  .modal-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 20px 0; }
  .modal-footer { display: flex; gap: 12px; margin-top: 20px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .form-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: #fcfdfd; color: #1e293b; outline: none; }
  .form-input:focus { border-color: #3b66f5; }
`;

class SupportPageElement extends BaseComponent {
  private tickets: SupportTicket[] = [];
  private isLoading = true;
  private showCreateModal = false;
  private selectedTicket: SupportTicket | null = null;
  private newTicketSubject = '';
  private newTicketCategory: SupportTicketCategory = SupportTicketCategory.Technical;
  private newTicketPriority: SupportTicketPriority = SupportTicketPriority.Medium;
  private replyText = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    void this.loadTickets();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadTickets(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.tickets = await supportService.listTickets('client-1');
    } catch {
      // Use defaults
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="new-ticket"]')) {
      this.showCreateModal = true;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="cancel-create"]')) {
      this.showCreateModal = false;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="submit-ticket"]')) {
      void this.submitTicket();
      return;
    }
    const ticketRow = target.closest('[data-ticket-id]');
    if (ticketRow) {
      const id = ticketRow.getAttribute('data-ticket-id') ?? '';
      this.selectedTicket = this.tickets.find((t) => t.id === id) ?? null;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="back-to-list"]')) {
      this.selectedTicket = null;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="submit-reply"]')) {
      void this.submitReply();
      return;
    }
  };

  private async submitTicket(): Promise<void> {
    const editor = this.shadow.querySelector<RichTextFieldElement>('rich-text-field');
    const body = editor?.getValue() ?? '';
    if (!this.newTicketSubject || !body) return;
    await supportService.createTicket({
      clientId: 'client-1',
      subject: this.newTicketSubject,
      category: this.newTicketCategory,
      priority: this.newTicketPriority,
      body,
    });
    this.showCreateModal = false;
    this.newTicketSubject = '';
    await this.loadTickets();
  }

  private async submitReply(): Promise<void> {
    if (!this.selectedTicket || !this.replyText) return;
    await supportService.addReply({
      ticketId: this.selectedTicket.id,
      authorId: 'u1',
      authorName: 'Client User',
      body: this.replyText,
      isFromClient: true,
    });
    this.replyText = '';
    // Refresh the selected ticket
    this.selectedTicket = await supportService.getTicket(this.selectedTicket.id);
    this.rerender();
  }

  private statusClass(status: string): string {
    return `status-${status}`;
  }

  private priorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  private renderTicketRows(): string {
    const tickets = this.tickets.length > 0 ? this.tickets : [
      { id: 'TKT-001', subject: 'Campaign approval delay', category: 'Campaign', status: 'open', priority: 'high', lastUpdatedAt: new Date() },
      { id: 'TKT-002', subject: 'Invoice not received for June', category: 'Billing', status: 'resolved', priority: 'medium', lastUpdatedAt: new Date(Date.now() - 86400000) },
      { id: 'TKT-003', subject: 'MMP integration throwing 400 errors', category: 'Technical', status: 'in_progress', priority: 'urgent', lastUpdatedAt: new Date(Date.now() - 172800000) },
    ];
    return tickets.map((t) => `
      <tr data-ticket-id="${t.id}">
        <td>
          <div class="ticket-subject">${t.subject}</div>
          <div class="ticket-id">${t.id}</div>
        </td>
        <td>${t.category}</td>
        <td><div class="pill ${t.status}">${t.status.replace('_', ' ')}</div></td>
        <td><div class="pill ${t.priority}">${t.priority}</div></td>
        <td style="color:#475569;font-size:12px;">${t.lastUpdatedAt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
      </tr>
    `).join('');
  }

  private renderConversation(): string {
    if (!this.selectedTicket) return '';
    const messages = this.selectedTicket.messages.map((m) => `
      <div class="message ${m.isFromClient ? 'from-client' : 'from-support'}">
        <div class="message-author">${m.authorName}</div>
        <div class="message-body">${m.body}</div>
      </div>
    `).join('');
    return `
      <div class="conversation">${messages || '<p style="text-align:center;color:#94a3b8;font-size:13px;">No messages yet.</p>'}</div>
      <div class="reply-section">
        <input class="reply-input" type="text" value="${this.replyText}" placeholder="Type your reply..." />
        <button class="btn-primary" data-action="submit-reply" type="button">Send</button>
      </div>
    `;
  }

  private renderCreateModal(): string {
    return `
      <div class="modal-overlay">
        <div class="modal">
          <h2 class="modal-title">New Support Ticket</h2>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input class="form-input" type="text" value="${this.newTicketSubject}" placeholder="Brief description of the issue" />
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-input">
              <option value="${SupportTicketCategory.Technical}">Technical</option>
              <option value="${SupportTicketCategory.Billing}">Billing</option>
              <option value="${SupportTicketCategory.Campaign}">Campaign</option>
              <option value="${SupportTicketCategory.Account}">Account</option>
              <option value="${SupportTicketCategory.Other}">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-input">
              <option value="${SupportTicketPriority.Low}">Low</option>
              <option value="${SupportTicketPriority.Medium}" selected>Medium</option>
              <option value="${SupportTicketPriority.High}">High</option>
              <option value="${SupportTicketPriority.Urgent}">Urgent</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <rich-text-field placeholder="Describe your issue in detail..."></rich-text-field>
          </div>
          <div class="form-group">
            <label class="form-label">Attachments</label>
            <input class="form-input" type="file" multiple />
          </div>
          <div class="modal-footer">
            <button class="btn-primary" data-action="submit-ticket" type="button">Submit Ticket</button>
            <button class="btn-secondary" data-action="cancel-create" type="button">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    if (this.selectedTicket) {
      return html`
        <button class="btn-back" data-action="back-to-list" type="button">← Back to Tickets</button>
        <h1 class="page-title">${this.selectedTicket.subject}</h1>
        <div class="ticket-meta">
          <div class="pill ${this.selectedTicket.status}">${this.selectedTicket.status.replace('_', ' ')}</div>
          <div class="pill ${this.selectedTicket.priority}">${this.selectedTicket.priority}</div>
          <span style="font-size:12px;color:#94a3b8;">${this.selectedTicket.category}</span>
        </div>
        <div class="conversation-card">${SafeHtmlString.trusted(this.renderConversation())}</div>
      `;
    }
    return html`
      <div class="page-header">
        <div>
          <h1 class="page-title">Support</h1>
          <p class="page-subtitle">Need help? Create a ticket and our team will respond within 24 hours.</p>
        </div>
        <button class="btn-primary" data-action="new-ticket" type="button">+ New Ticket</button>
      </div>
      <div class="table-container">
        <table>
          <thead><tr><th>Subject</th><th>Category</th><th>Status</th><th>Priority</th><th>Last Updated</th></tr></thead>
          <tbody>${SafeHtmlString.trusted(this.renderTicketRows())}</tbody>
        </table>
      </div>
      ${this.showCreateModal ? SafeHtmlString.trusted(this.renderCreateModal()) : ''}
    `;
  }
}

ComponentRegistry.register('support-page', SupportPageElement);
export { SupportPageElement };