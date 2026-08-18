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
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); padding-bottom: var(--space-6); }
  .summary-bar { display: flex; gap: var(--space-6); padding-bottom: var(--space-6); }
  .summary-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); flex: 1; }
  .summary-label { font-size: var(--font-size-xs); text-transform: uppercase; color: var(--color-text-muted); padding-bottom: var(--space-1); }
  .summary-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
  .statement-section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); padding-bottom: var(--space-6); }
  .section-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); padding-bottom: var(--space-3); }
  .statement-form { display: flex; gap: var(--space-3); align-items: flex-end; flex-wrap: wrap; }
  .date-input { padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
  .btn { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .btn.primary { background: var(--color-primary); color: var(--color-primary-foreground); border: none; font-weight: var(--font-weight-semibold); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .status-paid { color: var(--color-success); font-weight: var(--font-weight-semibold); }
  .status-sent { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
  .status-overdue { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .status-draft { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
  .status-void { color: var(--color-text-muted); font-weight: var(--font-weight-semibold); }
  .invoice-table-container { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .print-view-container { padding-top: var(--space-6); }
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
        // Admin cross-client: fetch all invoices (no clientId filter)
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
    return `<div style="margin-bottom:var(--space-3);"><select class="btn" data-filter="client"><option value="">All Clients</option>${options}</select></div>`;
  }

  private statusClass(status: string): string {
    return `status-${status}`;
  }

  private renderInvoiceRows(): string {
    const filtered = this.crossClientMode && this.clientFilter
      ? this.invoices.filter((inv) => inv.clientId === this.clientFilter)
      : this.invoices;
    if (filtered.length === 0) {
      return '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted);">No invoices yet</td></tr>';
    }
    return filtered.map((inv) => `
      <tr>
        ${this.crossClientMode ? `<td>${inv.clientId}</td>` : ''}
        <td>${inv.id}</td>
        <td>${inv.billingPeriod ?? '—'}</td>
        <td>${inv.issueDate.toLocaleDateString()}</td>
        <td>${inv.dueDate.toLocaleDateString()}</td>
        <td>${inv.getAmount().toDisplayString()}</td>
        <td class="${this.statusClass(inv.status)}">${inv.status}</td>
        <td>
          <button class="btn" data-action="download-invoice" data-invoice-id="${inv.id}" type="button">Download</button>
          <button class="btn" data-action="email-invoice" data-invoice-id="${inv.id}" type="button">Email</button>
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
        <button class="btn" data-action="close-print-view" type="button">← Back to Invoices</button>
        <div class="print-view-container">
          <invoice-print-view></invoice-print-view>
        </div>
      `;
    }
    return html`
      <h1 class="page-title">Invoices & Billing</h1>
      <div class="summary-bar">
        <div class="summary-card">
          <p class="summary-label">Total Outstanding</p>
          <p class="summary-value">${this.outstandingTotal}</p>
        </div>
        <div class="summary-card">
          <p class="summary-label">Next Auto-Invoice Date</p>
          <p class="summary-value">${this.nextAutoInvoiceDate}</p>
        </div>
      </div>
      <div class="statement-section">
        <p class="section-title">Request Custom Statement</p>
        ${this.showStatementForm ? SafeHtmlString.trusted(`
          <div class="statement-form">
            <div>
              <label style="font-size:var(--font-size-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">Start Date</label>
              <input class="date-input" type="date" name="statement-start" value="${this.statementStartDate}" />
            </div>
            <div>
              <label style="font-size:var(--font-size-xs);color:var(--color-text-muted);display:block;margin-bottom:var(--space-1);">End Date</label>
              <input class="date-input" type="date" name="statement-end" value="${this.statementEndDate}" />
            </div>
            <button class="btn primary" data-action="request-statement" type="button">Generate</button>
          </div>
        `) : SafeHtmlString.trusted(html`<button class="btn" data-action="toggle-statement" type="button">+ Request Custom Statement</button>`)}
      </div>
      ${this.crossClientMode ? SafeHtmlString.trusted(this.renderClientFilter()) : ''}
      <div class="invoice-table-container">
        <table>
          <thead><tr>${this.crossClientMode ? '<th>Client</th>' : ''}<th>Invoice #</th><th>Billing Period</th><th>Issue Date</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${SafeHtmlString.trusted(this.renderInvoiceRows())}</tbody>
        </table>
      </div>
    `;
  }
}

ComponentRegistry.register('invoices-billing-page', InvoicesBillingPageElement);
export { InvoicesBillingPageElement };