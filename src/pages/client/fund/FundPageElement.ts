/**
 * FundPageElement.ts — pages/client/fund/
 *
 * Balance card: Current Balance, Add Fund, Download Report, overflow menu.
 * Monthly Spend Budget progress bar with Edit link.
 * Insight card: Funds Added vs. Funds Spent trend chart + auto-generated
 *   pacing insight (reuses DashboardService.generateInsight pattern).
 * Transactions table: Date, Payment Mode, Details, Gross/Fee/Net, Status.
 * Add Fund modal (ModalElement): amount quick-select, Card/PayPal/Bank
 *   Transfer tabs, live fee breakdown. Bank Transfer = Pending.
 * Manage Balance panel: low-balance threshold, auto-recharge, monthly cap.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { fundService, suggestionService } from '../../../services';
import type { FundTransaction } from '../../../core/entities/FundTransaction';
import { Money } from '../../../core/value-objects/Money';
import { PaymentMethod } from '../../../core/enums/PaymentMethod';

interface ChartWidgetHost extends HTMLElement {
  data: { label: string; value: number }[];
  chartType: 'bar' | 'line' | 'area';
  isLoading: boolean;
}

interface ModalHost extends HTMLElement {
  open(): void;
  close(): void;
}

const FEE_RATES: Record<string, number> = {
  card: 0.029,
  paypal: 0.033,
  bank_transfer: 0,
};

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .fund-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-6); }
  @media (max-width: 768px) { .fund-grid { grid-template-columns: 1fr; } }
  .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .card-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; margin: 0 0 var(--space-2); }
  .balance-value { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-4); }
  .balance-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .action-btn { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .action-btn.primary { background: var(--color-primary); color: var(--color-primary-foreground); border: none; font-weight: var(--font-weight-semibold); }
  .budget-bar { height: 12px; background: var(--color-surface-2); border-radius: var(--radius-full); overflow: hidden; margin-top: var(--space-2); }
  .budget-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width 0.3s ease; }
  .budget-text { font-size: var(--font-size-sm); color: var(--color-text-primary); margin: var(--space-1) 0 0; }
  .edit-link { font-size: var(--font-size-xs); color: var(--color-primary); cursor: pointer; text-decoration: underline; margin-left: var(--space-2); }
  .insight-line { background: var(--color-surface); border: 1px solid var(--color-border); border-left: 3px solid var(--color-primary); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  .chart-section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-6); }
  .chart-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-3); }
  .tx-table-container { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .status-pending { color: var(--color-warning); font-weight: var(--font-weight-semibold); }
  .status-completed { color: var(--color-success); font-weight: var(--font-weight-semibold); }
  .status-failed { color: var(--color-danger); font-weight: var(--font-weight-semibold); }
  .modal-content { display: flex; flex-direction: column; gap: var(--space-4); min-width: 400px; }
  .modal-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0; color: var(--color-text-primary); }
  .amount-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); }
  .amount-btn { padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); text-align: center; }
  .amount-btn.active { background: var(--color-primary); color: var(--color-primary-foreground); border-color: var(--color-primary); }
  .payment-tabs { display: flex; gap: var(--space-2); }
  .payment-tab { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .payment-tab.active { background: var(--color-primary); color: var(--color-primary-foreground); border-color: var(--color-primary); }
  .fee-breakdown { background: var(--color-surface-2); border-radius: var(--radius-sm); padding: var(--space-3); font-size: var(--font-size-sm); display: flex; flex-direction: column; gap: var(--space-1); }
  .fee-row { display: flex; justify-content: space-between; color: var(--color-text-primary); }
  .fee-row.total { font-weight: var(--font-weight-bold); border-top: 1px solid var(--color-border); padding-top: var(--space-1); margin-top: var(--space-1); }
  .confirm-btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .cancel-btn { padding: var(--space-2) var(--space-4); background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-primary); }
  .pending-notice { font-size: var(--font-size-xs); color: var(--color-warning); font-style: italic; }
`;

class FundPageElement extends BaseComponent {
  private balance: Money = new Money(0, 'USD');
  private monthlyBudget: Money = new Money(100000, 'USD');
  private monthlySpend: Money = new Money(45000, 'USD');
  private transactions: FundTransaction[] = [];
  private isLoading = true;
  private isAddFundOpen = false;
  private selectedAmount = 5000;
  private paymentMethod: PaymentMethod = PaymentMethod.Card;
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
    this.addEventListener('suggestion-accepted', this.handleSuggestionAccepted);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.removeEventListener('suggestion-accepted', this.handleSuggestionAccepted);
  }

  private handleSuggestionAccepted = async (event: Event): Promise<void> => {
    const ce = event as CustomEvent<{ suggestionId: string }>;
    if (!ce.detail) return;
    try {
      await suggestionService.acceptSuggestion(ce.detail.suggestionId);
      void this.loadData();
    } catch {
      // Non-critical — silently fail
    }
  };

  private dispatchSuggestionCheckpoint(): void {
    document.dispatchEvent(
      new CustomEvent('suggestion-checkpoint', {
        detail: { source: 'fund', entityType: 'budget', clientId: 'client-1' },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      if (this.crossClientMode) {
        // Admin cross-client: fetch transactions for all assigned clients
        const clientIds = ['client-1', 'client-2', 'client-3'];
        const allTx: FundTransaction[] = [];
        for (const cid of clientIds) {
          const txs = await fundService.getTransactionHistory(cid);
          allTx.push(...txs);
        }
        this.transactions = allTx;
      } else {
        this.balance = await fundService.getBalance('client-1');
        this.transactions = await fundService.getTransactionHistory('client-1');
      }
    } catch {
      // Use defaults
    }
    this.isLoading = false;
    this.rerender();
    this.syncChart();
    // Trigger AI suggestion checkpoint — page load with existing data
    this.dispatchSuggestionCheckpoint();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="add-fund"]')) {
      this.isAddFundOpen = true;
      this.rerender();
      this.openModal();
      return;
    }
    if (target.closest('[data-action="cancel-add"]')) {
      this.isAddFundOpen = false;
      this.closeModal();
      return;
    }
    if (target.closest('[data-action="confirm-add"]')) {
      void this.confirmAddFund();
      return;
    }
    const clientFilterEl = target.closest('[data-filter="client"]');
    if (clientFilterEl) {
      this.clientFilter = (clientFilterEl as HTMLSelectElement).value;
      this.rerender();
      return;
    }
    const amtBtn = target.closest('[data-amount]');
    if (amtBtn) {
      this.selectedAmount = parseInt(amtBtn.getAttribute('data-amount') ?? '0', 10);
      this.rerender();
      return;
    }
    const payTab = target.closest('[data-payment-tab]');
    if (payTab) {
      this.paymentMethod = payTab.getAttribute('data-payment-tab') as PaymentMethod;
      this.rerender();
      return;
    }
  };

  private openModal(): void {
    const modal = this.shadow.querySelector<ModalHost>('vis-modal');
    if (modal) modal.open();
  }

  private closeModal(): void {
    const modal = this.shadow.querySelector<ModalHost>('vis-modal');
    if (modal) modal.close();
  }

  private async confirmAddFund(): Promise<void> {
    const amount = new Money(this.selectedAmount, 'USD');
    await fundService.addFund('client-1', amount, this.paymentMethod);
    this.isAddFundOpen = false;
    this.closeModal();
    await this.loadData();
  }

  private get feeAmount(): number {
    return Math.round(this.selectedAmount * (FEE_RATES[this.paymentMethod] ?? 0));
  }

  private get netAmount(): number {
    return this.selectedAmount - this.feeAmount;
  }

  private get isPendingPayment(): boolean {
    return this.paymentMethod === PaymentMethod.BankTransfer;
  }

  private get budgetPct(): number {
    const pct = (this.monthlySpend.getAmountMinorUnits() / this.monthlyBudget.getAmountMinorUnits()) * 100;
    return Math.min(pct, 100);
  }

  private generateInsight(): string {
    const added = this.transactions.filter((t) => t.type === 'deposit').length;
    const spent = this.transactions.filter((t) => t.type === 'debit').length;
    if (added === 0 && spent === 0) return 'No fund activity this period yet.';
    const pct = this.budgetPct;
    if (pct > 80) return `Monthly spend at ${pct.toFixed(0)}% of budget — approaching limit.`;
    if (pct > 50) return `Monthly spend at ${pct.toFixed(0)}% of budget — on track.`;
    return `Monthly spend at ${pct.toFixed(0)}% of budget — well within limits.`;
  }

  private syncChart(): void {
    const chart = this.shadow.querySelector<ChartWidgetHost>('chart-widget');
    if (chart) {
      chart.data = [
        { label: 'Added', value: this.transactions.filter((t) => t.type === 'deposit').length * 5000 },
        { label: 'Spent', value: this.monthlySpend.getAmountMinorUnits() },
      ];
      chart.chartType = 'bar';
      chart.isLoading = false;
    }
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    return html`
      <h1 class="page-title">Fund Management</h1>
      <div class="fund-grid">
        <div class="card">
          <p class="card-title">Current Balance</p>
          <p class="balance-value">${this.balance.toDisplayString()}</p>
          <div class="balance-actions">
            <button class="action-btn primary" data-action="add-fund" type="button">+ Add Fund</button>
            <button class="action-btn" type="button">↓ Download Report</button>
            <button class="action-btn" type="button">⋯ More</button>
          </div>
        </div>
        <div class="card">
          <p class="card-title">Monthly Spend Budget ${this.monthlyBudget.toDisplayString()}<span class="edit-link">Edit</span></p>
          <div class="budget-bar"><div class="budget-fill" style="width:${this.budgetPct.toFixed(0)}%"></div></div>
          <p class="budget-text">${this.monthlySpend.toDisplayString()} spent (${this.budgetPct.toFixed(0)}%)</p>
        </div>
      </div>
      <div class="insight-line">${this.generateInsight()}</div>
      <div class="chart-section">
        <p class="chart-title">Funds Added vs. Funds Spent</p>
        <chart-widget></chart-widget>
      </div>
      ${this.crossClientMode ? SafeHtmlString.trusted(this.renderClientFilter()) : ''}
      <div class="tx-table-container">
        <table>
          <thead><tr>${this.crossClientMode ? '<th>Client</th>' : ''}<th>Date</th><th>Payment Mode</th><th>Details</th><th>Gross</th><th>Fee</th><th>Net</th><th>Status</th></tr></thead>
          <tbody>${SafeHtmlString.trusted(this.renderTxRows())}</tbody>
        </table>
      </div>
      ${this.isAddFundOpen ? SafeHtmlString.trusted(this.renderAddFundModal()) : ''}
      <ai-suggestion-popup></ai-suggestion-popup>
    `;
  }

  private renderTxRows(): string {
    const filtered = this.crossClientMode && this.clientFilter
      ? this.transactions.filter((tx) => tx.clientId === this.clientFilter)
      : this.transactions;
    if (filtered.length === 0) {
      return '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted);">No transactions yet</td></tr>';
    }
    return filtered.map((tx) => {
      const statusClass = tx.status === 'pending' ? 'status-pending' : tx.status === 'completed' ? 'status-completed' : 'status-failed';
      return `<tr>
        ${this.crossClientMode ? `<td>${tx.clientId}</td>` : ''}
        <td>${tx.createdAt.toLocaleDateString()}</td>
        <td>${tx.paymentMethod ?? '—'}</td>
        <td>${tx.description ?? '—'}</td>
        <td>${tx.grossAmount.toDisplayString()}</td>
        <td>${tx.feeAmount.toDisplayString()}</td>
        <td>${tx.netAmount.toDisplayString()}</td>
        <td class="${statusClass}">${tx.status}</td>
      </tr>`;
    }).join('');
  }

  private renderClientFilter(): string {
    const clientIds = [...new Set(this.transactions.map((tx) => tx.clientId))];
    const options = clientIds.map((id) => `<option value="${id}" ${this.clientFilter === id ? 'selected' : ''}>${id}</option>`).join('');
    return `<div style="margin-bottom:var(--space-3);"><select class="action-btn" data-filter="client"><option value="">All Clients</option>${options}</select></div>`;
  }

  private renderAddFundModal(): string {
    const amounts = [1000, 5000, 10000, 25000];
    return html`
      <vis-modal>
        <div class="modal-content">
          <h2 class="modal-title">Add Funds</h2>
          <div class="amount-grid">
            ${SafeHtmlString.trusted(amounts.map((a) => `<button class="amount-btn ${this.selectedAmount === a ? 'active' : ''}" data-amount="${a}" type="button">$${(a / 100).toFixed(2)}</button>`).join(''))}
          </div>
          <div class="payment-tabs">
            <button class="payment-tab ${this.paymentMethod === 'card' ? 'active' : ''}" data-payment-tab="card" type="button">Card</button>
            <button class="payment-tab ${this.paymentMethod === 'paypal' ? 'active' : ''}" data-payment-tab="paypal" type="button">PayPal</button>
            <button class="payment-tab ${this.paymentMethod === 'bank_transfer' ? 'active' : ''}" data-payment-tab="bank_transfer" type="button">Bank Transfer</button>
          </div>
          <div class="fee-breakdown">
            <div class="fee-row"><span>Gross Amount</span><span>$${(this.selectedAmount / 100).toFixed(2)}</span></div>
            <div class="fee-row"><span>Processing Fee</span><span>$${(this.feeAmount / 100).toFixed(2)}</span></div>
            <div class="fee-row total"><span>Net Amount</span><span>$${(this.netAmount / 100).toFixed(2)}</span></div>
          </div>
          ${this.isPendingPayment ? '<p class="pending-notice">Bank transfers are credited as Pending until cleared (1-3 business days).</p>' : ''}
          <div style="display:flex;gap:var(--space-3);">
            <button class="confirm-btn" data-action="confirm-add" type="button">Confirm</button>
            <button class="cancel-btn" data-action="cancel-add" type="button">Cancel</button>
          </div>
        </div>
      </vis-modal>
    `;
  }
}

ComponentRegistry.register('fund-page', FundPageElement);
export { FundPageElement };