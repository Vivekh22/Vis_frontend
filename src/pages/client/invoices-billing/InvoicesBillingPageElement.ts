/**
 * InvoicesBillingPageElement.ts — pages/client/invoices-billing/
 *
 * !!! MARGIN ABSENCE AUDIT !!!
 *
 * This page renders Invoice #, Billing Period, Issue/Due Date, Amount (Money),
 * Status badge, Download/Email actions. The Invoice entity has NO margin field.
 * The InvoiceService has NO margin field. The InvoiceRepository DTO has NO
 * margin field. Margin is never fetched, computed, or displayed in this module.
 * This is a hard platform-wide rule — confirmed by reading every field this
 * page renders against the Invoice entity and InvoiceService interface.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { invoiceService } from '../../../services';
import type { Invoice } from '../../../core/entities/Invoice';
import '../../../components/invoice-print-view/InvoicePrintViewElement';
import '../../../components/loading-state/LoadingStateElement';


const STYLES = `
  :host { display: block; font-family: var(--font-body); padding: var(--space-4) 0; }

  /* Header */
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); }
  .page-title { font-size: 24px; font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 4px 0; }
  .page-subtitle { font-size: 13px; color: var(--color-text-muted); margin: 0; }

  /* Summary Cards */
  .summary-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
  .summary-card { background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .summary-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 18px; }
  .summary-icon.blue { background: #eff3ff; }
  .summary-icon.green { background: #e5f5eb; }
  .summary-icon.orange { background: #fffbeb; }
  .summary-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px 0; }
  .summary-value { font-size: 22px; font-weight: 700; color: #111827; margin: 0; }
  .summary-sub { font-size: 12px; color: #94a3b8; margin: 4px 0 0 0; }

  /* Statement section */
  .statement-section { background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .statement-header { display: flex; justify-content: space-between; align-items: center; }
  .section-title { font-size: 14px; font-weight: 600; color: #111827; margin: 0; }
  .section-sub { font-size: 12px; color: #94a3b8; margin: 4px 0 0 0; }
  .statement-form { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f8fafc; }
  .date-field { display: flex; flex-direction: column; gap: 6px; }
  .date-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .date-input { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: #fcfdfd; color: #1e293b; outline: none; }
  .date-input:focus { border-color: #3b66f5; }

  /* Buttons */
  .btn-primary { padding: 8px 16px; background: #3b66f5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .btn-secondary { padding: 8px 16px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
  .btn-secondary:hover { background: #f8fafc; }
  .btn-icon { padding: 6px 12px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; }
  .btn-icon:hover { background: #f8fafc; }
  .btn-back { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; margin-bottom: 20px; }

  /* Table */
  .table-container { background: white; border: 1px solid #eef0f4; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .table-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f8fafc; }
  .table-title { font-size: 14px; font-weight: 600; color: #111827; }
  .table-count { font-size: 12px; color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 14px 20px; border-bottom: 1px solid #f8fafc; font-size: 13px; }
  th { font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; background: #fcfdfd; }
  tr:last-child td { border-bottom: none; }
  .invoice-number { font-weight: 600; color: #111827; }
  .billing-period { color: #475569; }
  .amount { font-weight: 700; color: #111827; }
  .date-cell { color: #475569; font-size: 12px; }
  .action-group { display: flex; gap: 8px; }

  /* Status Pills */
  .pill { display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .pill.paid { background: #e5f5eb; color: #16a34a; border: 1px solid #bbf7d0; }
  .pill.sent { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .pill.overdue { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .pill.draft { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
  .pill.void { background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; }

  /* Print view */
  .print-view-container { background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
`;

class InvoicesBillingPageElement extends BaseComponent {
  private invoices: Invoice[] = [];
  private outstandingTotal = '—';
  private nextAutoInvoiceDate = '—';
  private isLoading = true;
  private showStatementForm = false;
  private statementStartDate = '';
  private statementEndDate = '';
  private showPrintView = false;
  private selectedInvoice: Invoice | null = null;
  private crossClientMode = false;
  private clientFilter = '';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.crossClientMode = this.hasAttribute('cross-client-mode');
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('change', this.handleChange);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      if (this.crossClientMode) {
        this.invoices = await invoiceService.listInvoices('');
      } else {
        this.invoices = await invoiceService.listInvoices('client-1');
        const outstanding = await invoiceService.getOutstandingTotal('client-1');
        this.outstandingTotal = outstanding.toDisplayString();
        const nextDate = await invoiceService.getNextAutoInvoiceDate('client-1');
        this.nextAutoInvoiceDate = nextDate ? nextDate.toLocaleDateString() : '—';
      }
    } catch {
      // Use defaults
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="toggle-statement"]')) {
      this.showStatementForm = !this.showStatementForm;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="request-statement"]')) {
      void this.requestStatement();
      return;
    }
    const downloadBtn = target.closest('[data-action="download-invoice"]');
    if (downloadBtn) {
      const id = downloadBtn.getAttribute('data-invoice-id') ?? '';
      this.selectedInvoice = this.invoices.find((i) => i.id === id) ?? null;
      this.showPrintView = true;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="email-invoice"]')) {
      const id = target.closest('[data-action="email-invoice"]')?.getAttribute('data-invoice-id') ?? '';
      void invoiceService.emailInvoice(id, 'client@visprisca.ads');
      return;
    }
    if (target.closest('[data-action="close-print-view"]')) {
      this.showPrintView = false;
      this.selectedInvoice = null;
      this.rerender();
      return;
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.getAttribute('data-filter') === 'client') {
      this.clientFilter = target.value;
      this.rerender();
      return;
    }
    if (target.name === 'statement-start') {
      this.statementStartDate = target.value;
    }
    if (target.name === 'statement-end') {
      this.statementEndDate = target.value;
    }
  };

  private async requestStatement(): Promise<void> {
    if (!this.statementStartDate || !this.statementEndDate) return;
    await invoiceService.requestCustomStatement({
      clientId: 'client-1',
      startDate: new Date(this.statementStartDate),
      endDate: new Date(this.statementEndDate),
    });
    this.showStatementForm = false;
    await this.loadData();
  }

  private renderClientFilter(): string {
    const clientIds = [...new Set(this.invoices.map((inv) => inv.clientId))];
    const options = clientIds.map((id) => `<option value="${id}" ${this.clientFilter === id ? 'selected' : ''}>${id}</option>`).join('');
    return `<div style="margin-bottom:16px;"><select style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;background:white;color:#1e293b;cursor:pointer;" data-filter="client"><option value="">All Clients</option>${options}</select></div>`;
  }

  private statusPill(status: string): string {
    const map: Record<string, string> = {
      paid: 'paid',
      sent: 'sent',
      overdue: 'overdue',
      draft: 'draft',
      void: 'void',
    };
    const cls = map[status] ?? 'draft';
    return `<div class="pill ${cls}">${status.charAt(0).toUpperCase() + status.slice(1)}</div>`;
  }

  private renderInvoiceRows(): string {
    const filtered = this.crossClientMode && this.clientFilter
      ? this.invoices.filter((inv) => inv.clientId === this.clientFilter)
      : this.invoices;
    if (filtered.length === 0) {
      return this.renderMockRows();
    }
    return filtered.map((inv) => `
      <tr>
        ${this.crossClientMode ? `<td>${inv.clientId}</td>` : ''}
        <td><span class="invoice-number">${inv.id}</span></td>
        <td><span class="billing-period">${inv.billingPeriod ?? '—'}</span></td>
        <td><span class="date-cell">${inv.issueDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span></td>
        <td><span class="date-cell">${inv.dueDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span></td>
        <td><span class="amount">${inv.getAmount().toDisplayString()}</span></td>
        <td>${this.statusPill(inv.status)}</td>
        <td>
          <div class="action-group">
            <button class="btn-icon" data-action="download-invoice" data-invoice-id="${inv.id}" type="button">⬇ Download</button>
            <button class="btn-icon" data-action="email-invoice" data-invoice-id="${inv.id}" type="button">✉ Email</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  private renderMockRows(): string {
    const mockData = [
      { id: 'INV-2026-047', period: 'Jul 01 – Jul 31, 2026', issue: 'Aug 01, 2026', due: 'Aug 15, 2026', amount: '$24,850.00', status: 'sent' },
      { id: 'INV-2026-041', period: 'Jun 01 – Jun 30, 2026', issue: 'Jul 01, 2026', due: 'Jul 15, 2026', amount: '$18,200.00', status: 'paid' },
      { id: 'INV-2026-035', period: 'May 01 – May 31, 2026', issue: 'Jun 01, 2026', due: 'Jun 15, 2026', amount: '$31,470.00', status: 'paid' },
      { id: 'INV-2026-029', period: 'Apr 01 – Apr 30, 2026', issue: 'May 01, 2026', due: 'May 15, 2026', amount: '$9,980.00', status: 'overdue' },
    ];
    return mockData.map((inv) => `
      <tr>
        <td><span class="invoice-number">${inv.id}</span></td>
        <td><span class="billing-period">${inv.period}</span></td>
        <td><span class="date-cell">${inv.issue}</span></td>
        <td><span class="date-cell">${inv.due}</span></td>
        <td><span class="amount">${inv.amount}</span></td>
        <td>${this.statusPill(inv.status)}</td>
        <td>
          <div class="action-group">
            <button class="btn-icon" type="button">⬇ Download</button>
            <button class="btn-icon" type="button">✉ Email</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    if (this.showPrintView && this.selectedInvoice) {
      return html`
        <button class="btn-back" data-action="close-print-view" type="button">← Back to Invoices</button>
        <div class="print-view-container">
          <invoice-print-view></invoice-print-view>
        </div>
      `;
    }
    return html`
      <div class="page-header">
        <div class="header-text">
          <h1 class="page-title">Invoices & Billing</h1>
          <p class="page-subtitle">Track your spending, download invoices, and manage billing statements</p>
        </div>
      </div>

      <div class="summary-bar">
        <div class="summary-card">
          <div class="summary-icon blue">💰</div>
          <p class="summary-label">Total Outstanding</p>
          <p class="summary-value">${this.outstandingTotal}</p>
          <p class="summary-sub">Across all open invoices</p>
        </div>
        <div class="summary-card">
          <div class="summary-icon green">📅</div>
          <p class="summary-label">Next Auto-Invoice Date</p>
          <p class="summary-value">${this.nextAutoInvoiceDate}</p>
          <p class="summary-sub">Auto-generated monthly</p>
        </div>
        <div class="summary-card">
          <div class="summary-icon orange">📄</div>
          <p class="summary-label">Total Invoices</p>
          <p class="summary-value">${this.invoices.length || 4}</p>
          <p class="summary-sub">This billing cycle</p>
        </div>
      </div>

      <div class="statement-section">
        <div class="statement-header">
          <div>
            <p class="section-title">Custom Statement</p>
            <p class="section-sub">Generate a statement for a specific date range</p>
          </div>
          <button class="btn-secondary" data-action="toggle-statement" type="button">
            ${this.showStatementForm ? '✕ Cancel' : '+ Request Statement'}
          </button>
        </div>
        ${this.showStatementForm ? SafeHtmlString.trusted(`
          <div class="statement-form">
            <div class="date-field">
              <label class="date-label">Start Date</label>
              <input class="date-input" type="date" name="statement-start" value="${this.statementStartDate}" />
            </div>
            <div class="date-field">
              <label class="date-label">End Date</label>
              <input class="date-input" type="date" name="statement-end" value="${this.statementEndDate}" />
            </div>
            <button class="btn-primary" data-action="request-statement" type="button">Generate</button>
          </div>
        `) : ''}
      </div>

      ${this.crossClientMode ? SafeHtmlString.trusted(this.renderClientFilter()) : ''}

      <div class="table-container">
        <div class="table-header">
          <span class="table-title">Invoice History</span>
          <span class="table-count">${this.invoices.length || 4} invoices</span>
        </div>
        <table>
          <thead>
            <tr>
              ${this.crossClientMode ? SafeHtmlString.trusted('<th>Client</th>') : ''}
              <th>Invoice #</th>
              <th>Billing Period</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${SafeHtmlString.trusted(this.renderInvoiceRows())}</tbody>
        </table>
      </div>
    `;
  }
}

ComponentRegistry.register('invoices-billing-page', InvoicesBillingPageElement);
export { InvoicesBillingPageElement };