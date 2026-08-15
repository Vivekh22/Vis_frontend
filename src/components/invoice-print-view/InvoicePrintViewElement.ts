/**
 * InvoicePrintViewElement.ts — components/invoice-print-view/
 *
 * INTERIM PDF APPROACH:
 *   This is a structured print-friendly HTML view — NOT a binary PDF.
 *   The browser's native print-to-PDF handles the conversion via
 *   window.print(). Real PDF generation is a backend concern for later;
 *   this frontend has no PDF library (zero-dependency principle).
 *
 * Layout: branded header, Bill-To block, line items table, Grand Total,
 *   Amount in Words, Payment Details with QR code placeholder, repeating
 *   footer.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html } from '../../platform/rendering/SafeHtml';
import type { Invoice } from '../../core/entities/Invoice';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .print-btn {
    padding: var(--space-2) var(--space-4); background: var(--color-primary);
    color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md);
    cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-4);
  }
  .invoice {
    max-width: 800px; margin: 0 auto; padding: var(--space-8);
    background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }
  .header { display: flex; justify-content: space-between; margin-bottom: var(--space-6); }
  .brand { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-primary); }
  .brand-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }
  .invoice-meta { text-align: right; font-size: var(--font-size-sm); color: var(--color-text-primary); }
  .invoice-no { font-weight: var(--font-weight-bold); }
  .bill-to { margin-bottom: var(--space-6); }
  .bill-to-label { font-size: var(--font-size-xs); text-transform: uppercase; color: var(--color-text-muted); margin-bottom: var(--space-1); }
  .bill-to-content { font-size: var(--font-size-sm); color: var(--color-text-primary); }
  .line-items { width: 100%; border-collapse: collapse; margin-bottom: var(--space-6); }
  .line-items th, .line-items td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  .line-items th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .grand-total { display: flex; justify-content: flex-end; margin-bottom: var(--space-6); }
  .grand-total-box { background: var(--color-surface-2); padding: var(--space-3) var(--space-4); border-radius: var(--radius-sm); text-align: right; }
  .grand-total-label { font-size: var(--font-size-sm); color: var(--color-text-muted); }
  .grand-total-value { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
  .amount-in-words { font-size: var(--font-size-xs); color: var(--color-text-muted); font-style: italic; margin-top: var(--space-1); }
  .payment-details { border-top: 1px solid var(--color-border); padding-top: var(--space-4); margin-bottom: var(--space-6); }
  .payment-details h4 { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-2); }
  .payment-details p { font-size: var(--font-size-xs); color: var(--color-text-primary); margin: var(--space-1) 0; }
  .qr-placeholder { width: 80px; height: 80px; background: var(--color-surface-2); border: 1px dashed var(--color-border); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); color: var(--color-text-muted); }
  .footer { border-top: 1px solid var(--color-border); padding-top: var(--space-3); font-size: var(--font-size-xs); color: var(--color-text-muted); text-align: center; }
  @media print { .print-btn { display: none; } }
`;

function amountInWords(amountMinorUnits: number, currency: string): string {
  const major = Math.floor(amountMinorUnits / 100);
  return `${major} ${currency} only`;
}

class InvoicePrintViewElement extends BaseComponent {
  private _invoice: Invoice | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set invoice(value: Invoice | null) {
    this._invoice = value;
    this.rerender();
  }

  public get invoice(): Invoice | null {
    return this._invoice;
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="print"]')) {
      window.print();
    }
  };

  protected renderTemplate(): string {
    if (!this._invoice) {
      return html`<p>No invoice selected.</p>`;
    }
    const inv = this._invoice;
    const amount = inv.getAmount();
    return html`
      <button class="print-btn" data-action="print" type="button">Print / Save as PDF</button>
      <div class="invoice">
        <div class="header">
          <div>
            <div class="brand">VispriscaAds</div>
            <div class="brand-sub">Programmatic Advertising Platform</div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-no">Invoice #${inv.id}</div>
            <div>Issue Date: ${inv.issueDate.toLocaleDateString()}</div>
            <div>Due Date: ${inv.dueDate.toLocaleDateString()}</div>
            ${inv.billingPeriod ? html`<div>Billing Period: ${inv.billingPeriod}</div>` : ''}
          </div>
        </div>
        <div class="bill-to">
          <div class="bill-to-label">Bill To</div>
          <div class="bill-to-content">
            Client: ${inv.clientId}<br />
            Account ID: ${inv.clientId}
          </div>
        </div>
        <table class="line-items">
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>Advertising Spend — ${inv.billingPeriod ?? 'Current Period'}</td><td>${amount.toDisplayString()}</td></tr>
          </tbody>
        </table>
        <div class="grand-total">
          <div class="grand-total-box">
            <div class="grand-total-label">Grand Total</div>
            <div class="grand-total-value">${amount.toDisplayString()}</div>
            <div class="amount-in-words">Amount in Words: ${amountInWords(amount.getAmountMinorUnits(), amount.getCurrency())}</div>
          </div>
        </div>
        <div class="payment-details">
          <h4>Payment Details</h4>
          <p>Bank: VispriscaAds Banking Partner</p>
          <p>Account Name: VispriscaAds Inc.</p>
          <p>Account Number: ••••••••1234</p>
          <p>Routing: •••••••567</p>
          <div class="qr-placeholder">QR Code</div>
        </div>
        <div class="footer">
          This is a system-generated invoice. For questions, contact support@vispriscaads.example.
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('invoice-print-view', InvoicePrintViewElement);
export { InvoicePrintViewElement };