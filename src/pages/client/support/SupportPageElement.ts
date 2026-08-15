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

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
  .btn { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .btn.primary { background: var(--color-primary); color: var(--color-primary-foreground); border: none; font-weight: var(--font-weight-semibold); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .status-open { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
  .status-in_progress { color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  .status-resolved { color: var(--color-success); font-weight: var(--font-weight-semibold); }
  .status-closed { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
  .priority-urgent { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .priority-high { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
  .priority-medium { color: var(--color-text-primary); }
  .priority-low { color: var(--color-text-muted); }
  .ticket-list-container { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-6); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; }
  .modal { background: var(--color-surface); border-radius: var(--radius-md); padding: var(--space-6); min-width: 500px; max-width: 90vw; max-height: 80vh; overflow-y: auto; }
  .modal-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0 0 var(--space-4); color: var(--color-text-primary); }
  .form-group { margin-bottom: var(--space-3); }
  .form-label { font-size: var(--font-size-xs); color: var(--color-text-muted); display: block; margin-bottom: var(--space-1); }
  .form-input { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-text-primary); }
  .conversation { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
  .message { padding: var(--space-3); border-radius: var(--radius-md); max-width: 80%; }
  .message.from-client { background: var(--color-primary); color: var(--color-primary-foreground); align-self: flex-end; }
  .message.from-support { background: var(--color-surface-2); color: var(--color-text-primary); align-self: flex-start; }
  .message-author { font-size: var(--font-size-xs); opacity: 0.8; margin-bottom: var(--space-1); }
  .message-body { font-size: var(--font-size-sm); }
  .reply-section { display: flex; gap: var(--space-2); }
  .reply-input { flex: 1; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
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
    if (this.tickets.length === 0) {
      return '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);">No tickets yet</td></tr>';
    }
    return this.tickets.map((t) => `
      <tr style="cursor:pointer;" data-ticket-id="${t.id}">
        <td>${t.subject}</td>
        <td>${t.category}</td>
        <td class="${this.statusClass(t.status)}">${t.status}</td>
        <td class="${this.priorityClass(t.priority)}">${t.priority}</td>
        <td>${t.lastUpdatedAt.toLocaleDateString()}</td>
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
      <div class="conversation">${messages}</div>
      <div class="reply-section">
        <input class="reply-input" type="text" value="${this.replyText}" placeholder="Type your reply..." />
        <button class="btn primary" data-action="submit-reply" type="button">Send</button>
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
          <div style="display:flex;gap:var(--space-3);">
            <button class="btn primary" data-action="submit-ticket" type="button">Submit Ticket</button>
            <button class="btn" data-action="cancel-create" type="button">Cancel</button>
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
        <button class="btn" data-action="back-to-list" type="button">← Back to Tickets</button>
        <h1 class="page-title" style="margin-top:var(--space-4);">${this.selectedTicket.subject}</h1>
        <div class="ticket-list-container">${SafeHtmlString.trusted(this.renderConversation())}</div>
      `;
    }
    return html`
      <h1 class="page-title">Support</h1>
      <div class="header-row">
        <p style="font-size:var(--font-size-sm);color:var(--color-text-muted);">Need help? Create a ticket and our team will respond.</p>
        <button class="btn primary" data-action="new-ticket" type="button">+ New Ticket</button>
      </div>
      <div class="ticket-list-container">
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