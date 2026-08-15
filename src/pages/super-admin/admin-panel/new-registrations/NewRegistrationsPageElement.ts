/**
 * NewRegistrationsPageElement.ts — pages/super-admin/admin-panel/new-registrations/
 *
 * !!! SOLE ACCOUNT-CREATION ENTRY POINT !!!
 *
 * This page is the ONLY entry point that creates a new Client account.
 * No other code path in the entire app can create a Client. The
 * approveRegistration() call in the review screen is the single
 * account-creation action in the frontend.
 *
 * Table: Company Name, Contact Name, Submitted Date, Requested Campaign
 * Types, Status — with unread badge for pending items.
 *
 * Row click opens the full review screen: submitted details, Base
 * Margin input (pre-filled from Platform Settings' default, editable),
 * Type-Specific Margin inputs (one per selected campaign type),
 * Approve / Reject / Request More Info actions.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { registrationService } from '../../../../services';
import { Percentage } from '../../../../core/value-objects/Percentage';
import type { Registration } from '../../../../core/entities/Registration';
import type { TypeSpecificMargin } from '../../../../core/entities/Registration';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); color: var(--color-text-primary); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  tr { cursor: pointer; }
  tr:hover { background: var(--color-bg); }
  .unread-badge { background: var(--color-primary); color: var(--color-primary-foreground); border-radius: var(--radius-full); padding: 2px 8px; font-size: var(--font-size-xs); margin-left: var(--space-2); }
  .review-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-6); margin-top: var(--space-4); }
  .review-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0 0 var(--space-4); }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4); }
  .detail-item { font-size: var(--font-size-sm); }
  .detail-label { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); display: block; margin-bottom: var(--space-1); }
  .margin-section { margin-bottom: var(--space-4); }
  .margin-section-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-2); }
  .margin-input-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
  .margin-input { width: 80px; padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
  .margin-label { font-size: var(--font-size-sm); min-width: 160px; }
  .actions { display: flex; gap: var(--space-2); margin-top: var(--space-4); }
  .btn { padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); cursor: pointer; border: 1px solid transparent; }
  .btn-approve { background: var(--color-success); color: #fff; }
  .btn-reject { background: var(--color-danger); color: #fff; }
  .btn-info { background: var(--color-surface); color: var(--color-text-primary); border-color: var(--color-border); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .status-badge { font-size: var(--font-size-xs); padding: 2px 8px; border-radius: var(--radius-full); }
  .status-pending { background: var(--color-warning); color: #fff; }
  .status-approved { background: var(--color-success); color: #fff; }
  .status-rejected { background: var(--color-danger); color: #fff; }
  .status-info_requested { background: var(--color-secondary); color: var(--color-text-primary); }
`;

class NewRegistrationsPageElement extends BaseComponent {
  private registrations: Registration[] = [];
  private selectedRegistration: Registration | null = null;
  private baseMarginValue = 15;
  private typeSpecificMargins: Map<string, number> = new Map();
  private actionNote = '';
  private isLoading = true;
  private error: string | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      this.registrations = await registrationService.getPendingRegistrations();
    } catch {
      // Use empty list
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const row = target.closest('[data-registration-id]');
    if (row) {
      const id = row.getAttribute('data-registration-id');
      if (id) {
        void this.openReview(id);
      }
      return;
    }
    if (target.closest('[data-action="approve"]')) {
      void this.approveRegistration();
      return;
    }
    if (target.closest('[data-action="reject"]')) {
      void this.rejectRegistration();
      return;
    }
    if (target.closest('[data-action="request-info"]')) {
      void this.requestMoreInfo();
      return;
    }
    if (target.closest('[data-action="back"]')) {
      this.selectedRegistration = null;
      this.rerender();
      return;
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (!field) return;
    const value = (target as HTMLInputElement).value;
    if (field === 'baseMargin') {
      this.baseMarginValue = parseFloat(value) || 0;
    } else if (field === 'actionNote') {
      this.actionNote = value;
    } else if (field.startsWith('tsm_')) {
      const campaignType = field.substring(4);
      this.typeSpecificMargins.set(campaignType, parseFloat(value) || 0);
    }
  };

  private async openReview(id: string): Promise<void> {
    const reg = await registrationService.getRegistration(id);
    if (!reg) return;
    this.selectedRegistration = reg;
    // Pre-fill base margin from Platform Settings' default
    try {
      const defaultMargin = await registrationService.getDefaultBaseMargin();
      this.baseMarginValue = defaultMargin.getValue();
    } catch {
      this.baseMarginValue = 15;
    }
    this.typeSpecificMargins.clear();
    for (const ct of reg.requestedCampaignTypes) {
      this.typeSpecificMargins.set(ct, this.baseMarginValue);
    }
    this.actionNote = '';
    this.error = null;
    this.rerender();
  }

  private async approveRegistration(): Promise<void> {
    if (!this.selectedRegistration) return;
    if (this.actionNote.trim().length < 10) {
      this.error = 'A note of at least 10 characters is required.';
      this.rerender();
      return;
    }
    try {
      const baseMargin = new Percentage(this.baseMarginValue);
      const typeSpecificMargins: TypeSpecificMargin[] = [];
      for (const [ct, val] of this.typeSpecificMargins) {
        typeSpecificMargins.push({ campaignType: ct, margin: new Percentage(val) });
      }
      await registrationService.approveRegistration(
        this.selectedRegistration.id,
        baseMargin,
        typeSpecificMargins,
      );
      this.selectedRegistration = null;
      await this.loadData();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to approve registration.';
      this.rerender();
    }
  }

  private async rejectRegistration(): Promise<void> {
    if (!this.selectedRegistration) return;
    if (this.actionNote.trim().length < 10) {
      this.error = 'A note of at least 10 characters is required.';
      this.rerender();
      return;
    }
    try {
      await registrationService.rejectRegistration(this.selectedRegistration.id, this.actionNote);
      this.selectedRegistration = null;
      await this.loadData();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to reject registration.';
      this.rerender();
    }
  }

  private async requestMoreInfo(): Promise<void> {
    if (!this.selectedRegistration) return;
    if (this.actionNote.trim().length < 10) {
      this.error = 'A note of at least 10 characters is required.';
      this.rerender();
      return;
    }
    try {
      await registrationService.requestMoreInfo(this.selectedRegistration.id, this.actionNote);
      this.selectedRegistration = null;
      await this.loadData();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to request more info.';
      this.rerender();
    }
  }

  private renderReviewPanel(): string {
    const reg = this.selectedRegistration;
    if (!reg) return '';
    const tsmInputs = reg.requestedCampaignTypes.map((ct) => {
      const val = this.typeSpecificMargins.get(ct) ?? this.baseMarginValue;
      return html`
        <div class="margin-input-row">
          <span class="margin-label">${ct}</span>
          <input class="margin-input" type="number" min="0" max="100" step="0.1" value="${val}" data-field="tsm_${ct}" />
          <span>%</span>
        </div>
      `;
    }).join('');
    return html`
      <div class="review-panel">
        <h2 class="review-title">Review: ${reg.companyName}</h2>
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">Company</span>${reg.companyName}</div>
          <div class="detail-item"><span class="detail-label">Contact</span>${reg.contactName}</div>
          <div class="detail-item"><span class="detail-label">Email</span>${reg.contactEmail}</div>
          <div class="detail-item"><span class="detail-label">Submitted</span>${reg.submittedAt.toLocaleDateString()}</div>
          <div class="detail-item"><span class="detail-label">Campaign Types</span>${reg.requestedCampaignTypes.join(', ')}</div>
          <div class="detail-item"><span class="detail-label">Status</span><span class="status-badge status-${reg.status}">${reg.status}</span></div>
        </div>
        <div class="margin-section">
          <p class="margin-section-title">Base Margin (pre-filled from Platform Settings default)</p>
          <div class="margin-input-row">
            <span class="margin-label">Base Margin</span>
            <input class="margin-input" type="number" min="0" max="100" step="0.1" value="${this.baseMarginValue}" data-field="baseMargin" />
            <span>%</span>
          </div>
        </div>
        <div class="margin-section">
          <p class="margin-section-title">Type-Specific Margins</p>
          ${SafeHtmlString.trusted(tsmInputs)}
        </div>
        <div class="margin-section">
          <p class="margin-section-title">Action Note (required, min 10 chars)</p>
          <textarea data-field="actionNote" rows="3" style="width:100%;padding:var(--space-2);border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:var(--font-size-sm);resize:vertical;">${this.actionNote}</textarea>
        </div>
        ${this.error ? SafeHtmlString.trusted(`<p style="color:var(--color-danger);font-size:var(--font-size-sm);">${this.error}</p>`) : ''}
        <div class="actions">
          <button class="btn btn-approve" data-action="approve" type="button">Approve & Create Client</button>
          <button class="btn btn-reject" data-action="reject" type="button">Reject</button>
          <button class="btn btn-info" data-action="request-info" type="button">Request More Info</button>
          <button class="btn btn-info" data-action="back" type="button">Back to List</button>
        </div>
      </div>
    `;
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    if (this.selectedRegistration) {
      return html`<h1 class="page-title">New Registrations</h1>${SafeHtmlString.trusted(this.renderReviewPanel())}`;
    }
    const rows = this.registrations.map((reg) => html`
      <tr data-registration-id="${reg.id}">
        <td>${reg.companyName}${reg.status === 'pending' ? '<span class="unread-badge">New</span>' : ''}</td>
        <td>${reg.contactName}</td>
        <td>${reg.submittedAt.toLocaleDateString()}</td>
        <td>${reg.requestedCampaignTypes.join(', ')}</td>
        <td><span class="status-badge status-${reg.status}">${reg.status}</span></td>
      </tr>
    `).join('');
    return html`
      <h1 class="page-title">New Registrations</h1>
      <table>
        <thead><tr><th>Company Name</th><th>Contact Name</th><th>Submitted Date</th><th>Requested Campaign Types</th><th>Status</th></tr></thead>
        <tbody>${SafeHtmlString.trusted(rows)}</tbody>
      </table>
    `;
  }
}

ComponentRegistry.register('super-admin-new-registrations', NewRegistrationsPageElement);
export { NewRegistrationsPageElement };