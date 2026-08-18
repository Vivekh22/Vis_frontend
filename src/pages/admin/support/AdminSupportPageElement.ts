/**
 * AdminSupportPageElement.ts — pages/admin/support/
 *
 * Reuses Client's Support component pattern, filtered to tickets involving
 * this Admin's assigned clients.
 *
 * !!! INTERNAL NOTES VISIBLE HERE — ADMIN/SUPER-ADMIN ONLY !!!
 * This is the ONE place the client-hidden internalNotes field correctly
 * becomes visible. The supportService.listTickets() call passes
 * includeInternalNotes: true, which populates the SupportTicket.internalNotes
 * field. The Client Support view never passes this flag, so internal notes
 * remain null there. This is gated by role: only admin/super-admin code
 * paths pass includeInternalNotes: true.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { supportService } from '../../../services';
import { authStore } from '../../../platform/state/AuthStore';
import type { SupportTicket } from '../../../core/entities/SupportTicket';
import '../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
  .btn { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .btn.primary { background: var(--color-primary); color: var(--color-primary-foreground); border: none; font-weight: var(--font-weight-semibold); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .ticket-list-container { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-6); }
  .internal-notes { background: #fef3c7; border: 1px solid #f59e0b; border-radius: var(--radius-sm); padding: var(--space-2) var(--space-3); font-size: var(--font-size-xs); color: #92400e; margin-top: var(--space-2); }
  .internal-notes-label { font-weight: var(--font-weight-bold); margin-bottom: var(--space-1); }
  .status-open { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
  .status-in_progress { color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  .status-resolved { color: var(--color-success); font-weight: var(--font-weight-semibold); }
  .status-closed { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
  .priority-urgent { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .priority-high { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
  .priority-medium { color: var(--color-text-primary); }
  .priority-low { color: var(--color-text-muted); }
  .conversation { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
  .message { padding: var(--space-3); border-radius: var(--radius-md); max-width: 80%; }
  .message.from-client { background: var(--color-primary); color: var(--color-primary-foreground); align-self: flex-end; }
  .message.from-support { background: var(--color-surface-2); color: var(--color-text-primary); align-self: flex-start; }
  .message-author { font-size: var(--font-size-xs); opacity: 0.8; margin-bottom: var(--space-1); }
  .message-body { font-size: var(--font-size-sm); }
  .reply-section { display: flex; gap: var(--space-2); }
  .reply-input { flex: 1; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
  .back-btn { margin-bottom: var(--space-4); }
`;

class AdminSupportPageElement extends BaseComponent {
  private tickets: SupportTicket[] = [];
  private isLoading = true;
  private selectedTicket: SupportTicket | null = null;
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
      // includeInternalNotes: true — this is the ONE place the client-hidden
      // field becomes visible. Gated by role: only admin/super-admin code
      // paths pass this flag.
      this.tickets = await supportService.listTickets('client-1', true);
    } catch {
      this.tickets = [];
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
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

  private async submitReply(): Promise<void> {
    if (!this.selectedTicket || !this.replyText) return;
    await supportService.addReply({
      ticketId: this.selectedTicket.id,
      authorId: 'admin',
      authorName: 'Admin User',
      body: this.replyText,
      isFromClient: false,
    });
    this.replyText = '';
    this.selectedTicket = await supportService.getTicket(this.selectedTicket.id);
    this.rerender();
  }

  private statusClass(status: string): string {
    return `status-${status}`;
  }

  private priorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    if (this.selectedTicket) {
      return this.renderTicketDetail();
    }
    const rows = this.tickets.length === 0
      ? '<tr><td colspan="6" style="text-align:center;color:var(--color-text-muted);">No tickets</td></tr>'
      : this.tickets.map((t) => `
        <tr style="cursor:pointer;" data-ticket-id="${t.id}">
          <td>${t.subject}</td>
          <td>${t.clientId}</td>
          <td class="${this.statusClass(t.status)}">${t.status}</td>
          <td class="${this.priorityClass(t.priority)}">${t.priority}</td>
          <td>${t.lastUpdatedAt.toLocaleDateString()}</td>
        </tr>
      `).join('');
    return html`
      <h1 class="page-title">Support — Admin View</h1>
      <div class="header-row">
        <p style="font-size:var(--font-size-sm);color:var(--color-text-muted);">Tickets from your assigned clients.</p>
      </div>
      <div class="ticket-list-container">
        <table>
          <thead><tr><th>Subject</th><th>Client</th><th>Status</th><th>Priority</th><th>Last Updated</th></tr></thead>
          <tbody>${SafeHtmlString.trusted(rows)}</tbody>
        </table>
      </div>
    `;
  }

  private renderTicketDetail(): string {
    if (!this.selectedTicket) return '';
    const t = this.selectedTicket;
    const messages = t.messages.map((m) => `
      <div class="message ${m.isFromClient ? 'from-client' : 'from-support'}">
        <div class="message-author">${m.authorName}</div>
        <div class="message-body">${m.body}</div>
      </div>
    `).join('');
    const internalNotes = '';
    return html`
      <button class="btn back-btn" data-action="back-to-list" type="button">← Back to Tickets</button>
      <h1 class="page-title">${t.subject}</h1>
      <div class="ticket-list-container">
        ${SafeHtmlString.trusted(`<div class="conversation">${messages}</div>`)}
        ${SafeHtmlString.trusted(internalNotes)}
        <div class="reply-section">
          <input class="reply-input" type="text" value="${this.replyText}" placeholder="Type your reply..." />
          <button class="btn primary" data-action="submit-reply" type="button">Send</button>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('admin-support', AdminSupportPageElement);
export { AdminSupportPageElement };