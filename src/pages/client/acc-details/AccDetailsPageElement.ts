/**
 * AccDetailsPageElement.ts — pages/client/acc-details/
 *
 * 6 tabs: Bank Details, Company Details, Address, Reg Details (READ-ONLY),
 * Team Members & Role, History.
 *
 * !!! REG DETAILS — NO EDIT FORM EXISTS !!!
 *   The Reg Details tab has no edit form — not just hidden, but non-existent.
 *   The code simply does not contain an edit form for this tab. Registration
 *   details are permanent and never editable through this screen.
 *
 * !!! BANKING FIELD MASKING !!!
 *   Account/routing numbers are partially obscured after entry, showing only
 *   the last 4 digits with a reveal toggle. Implements the Part 7 deferred
 *   recommendation.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { teamService } from '../../../services';
import type { TeamMember } from '../../../core/entities/TeamMember';
import { formatBankField } from '../../../utils/bankFieldMask';

const TABS = ['bank', 'company', 'address', 'reg', 'team', 'history'] as const;
type Tab = (typeof TABS)[number];

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .tabs { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--color-border); margin-bottom: var(--space-6); flex-wrap: wrap; }
  .tab { padding: var(--space-2) var(--space-4); border: none; background: none; cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--color-text-muted); border-bottom: 2px solid transparent; }
  .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  .tab-content { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .form-group { margin-bottom: var(--space-3); }
  .form-label { font-size: var(--font-size-xs); color: var(--color-text-muted); display: block; margin-bottom: var(--space-1); }
  .form-input { width: 100%; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-text-primary); }
  .form-input.readonly { background: var(--color-surface-2); color: var(--color-text-muted); cursor: default; }
  .field-row { display: flex; align-items: center; gap: var(--space-2); }
  .reveal-btn { padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-xs); color: var(--color-text-primary); white-space: nowrap; }
  .btn { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: var(--color-primary-foreground); border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .btn.secondary { background: var(--color-bg); color: var(--color-text-primary); border: 1px solid var(--color-border); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); font-size: var(--font-size-sm); }
  th { font-weight: var(--font-weight-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--font-size-xs); }
  .owner-badge { background: var(--color-primary); color: var(--color-primary-foreground); padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); }
  .readonly-notice { font-size: var(--font-size-xs); color: var(--color-text-muted); font-style: italic; margin-bottom: var(--space-3); }
`;

class AccDetailsPageElement extends BaseComponent {
  private activeTab: Tab = 'bank';
  private bankDetails = { accountNumber: '12345678901234', routingNumber: '021000021', bankName: 'VispriscaAds Banking Partner', accountName: 'VispriscaAds Inc.' };
  private companyDetails = { legalName: 'VispriscaAds Inc.', taxId: '•••••••90', industry: 'Advertising & Marketing', website: 'www.vispriscaads.example' };
  private addressDetails = { street: '123 Market Street', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' };
  private regDetails = { registrationNumber: 'REG-2018-XYZ123', dateOfIncorporation: '2018-03-15', jurisdiction: 'Mumbai, India', panNumber: 'ABCDE1234F' };
  private teamMembers: TeamMember[] = [];
  private revealAccountNumber = false;
  private revealRoutingNumber = false;
  private _isLoading = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    void this.loadTeamMembers();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadTeamMembers(): Promise<void> {
    this._isLoading = true;
    this.rerender();
    try {
      this.teamMembers = await teamService.listMembers('client-1');
    } catch {
      // Use defaults
    }
    this._isLoading = false;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const tab = target.closest('[data-tab]');
    if (tab) {
      this.activeTab = tab.getAttribute('data-tab') as Tab;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="reveal-account"]')) {
      this.revealAccountNumber = !this.revealAccountNumber;
      this.rerender();
      return;
    }
    if (target.closest('[data-action="reveal-routing"]')) {
      this.revealRoutingNumber = !this.revealRoutingNumber;
      this.rerender();
      return;
    }
  };

  private renderTabContent(): string {
    switch (this.activeTab) {
      case 'bank': return this.renderBankTab();
      case 'company': return this.renderCompanyTab();
      case 'address': return this.renderAddressTab();
      case 'reg': return this.renderRegTab();
      case 'team': return this.renderTeamTab();
      case 'history': return this.renderHistoryTab();
      default: return '';
    }
  }

  private renderBankTab(): string {
    return `
      <div class="form-group">
        <label class="form-label">Bank Name</label>
        <input class="form-input" type="text" value="${this.bankDetails.bankName}" readonly />
      </div>
      <div class="form-group">
        <label class="form-label">Account Holder Name</label>
        <input class="form-input" type="text" value="${this.bankDetails.accountName}" readonly />
      </div>
      <div class="form-group">
        <label class="form-label">Account Number</label>
        <div class="field-row">
          <input class="form-input" type="text" value="${formatBankField(this.bankDetails.accountNumber, this.revealAccountNumber)}" readonly />
          <button class="reveal-btn" data-action="reveal-account" type="button">${this.revealAccountNumber ? 'Hide' : 'Reveal'}</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Routing Number</label>
        <div class="field-row">
          <input class="form-input" type="text" value="${formatBankField(this.bankDetails.routingNumber, this.revealRoutingNumber)}" readonly />
          <button class="reveal-btn" data-action="reveal-routing" type="button">${this.revealRoutingNumber ? 'Hide' : 'Reveal'}</button>
        </div>
      </div>
    `;
  }

  private renderCompanyTab(): string {
    return `
      <div class="form-group"><label class="form-label">Legal Name</label><input class="form-input" type="text" value="${this.companyDetails.legalName}" /></div>
      <div class="form-group"><label class="form-label">Tax ID</label><input class="form-input" type="text" value="${this.companyDetails.taxId}" /></div>
      <div class="form-group"><label class="form-label">Industry</label><input class="form-input" type="text" value="${this.companyDetails.industry}" /></div>
      <div class="form-group"><label class="form-label">Website</label><input class="form-input" type="text" value="${this.companyDetails.website}" /></div>
      <button class="btn" type="button">Save Changes</button>
    `;
  }

  private renderAddressTab(): string {
    return `
      <div class="form-group"><label class="form-label">Street</label><input class="form-input" type="text" value="${this.addressDetails.street}" /></div>
      <div class="form-group"><label class="form-label">City</label><input class="form-input" type="text" value="${this.addressDetails.city}" /></div>
      <div class="form-group"><label class="form-label">State/Province</label><input class="form-input" type="text" value="${this.addressDetails.state}" /></div>
      <div class="form-group"><label class="form-label">Postal Code</label><input class="form-input" type="text" value="${this.addressDetails.postalCode}" /></div>
      <div class="form-group"><label class="form-label">Country</label><input class="form-input" type="text" value="${this.addressDetails.country}" /></div>
      <button class="btn" type="button">Save Changes</button>
    `;
  }

  /** Reg Details tab — READ-ONLY. No edit form exists. */
  private renderRegTab(): string {
    return `
      <p class="readonly-notice">Registration details are permanent and cannot be edited.</p>
      <div class="form-group"><label class="form-label">Registration Number</label><input class="form-input readonly" type="text" value="${this.regDetails.registrationNumber}" readonly /></div>
      <div class="form-group"><label class="form-label">Date of Incorporation</label><input class="form-input readonly" type="text" value="${this.regDetails.dateOfIncorporation}" readonly /></div>
      <div class="form-group"><label class="form-label">Jurisdiction</label><input class="form-input readonly" type="text" value="${this.regDetails.jurisdiction}" readonly /></div>
      <div class="form-group"><label class="form-label">PAN Number</label><input class="form-input readonly" type="text" value="${this.regDetails.panNumber}" readonly /></div>
    `;
  }

  private renderTeamTab(): string {
    return `<team-members-table client-id="client-1"></team-members-table>`;
  }

  private renderHistoryTab(): string {
    return `
      <table>
        <thead><tr><th>Date</th><th>Action</th><th>Actor</th></tr></thead>
        <tbody>
          <tr><td>${new Date().toLocaleDateString()}</td><td>Profile updated</td><td>Client User</td></tr>
          <tr><td>${new Date(Date.now() - 86400000).toLocaleDateString()}</td><td>Banking details updated</td><td>Client User</td></tr>
        </tbody>
      </table>
    `;
  }

  protected renderTemplate(): string {
    if (this._isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    const tabsHtml = TABS.map((t) => {
      const labels: Record<Tab, string> = { bank: 'Bank Details', company: 'Company Details', address: 'Address', reg: 'Reg Details', team: 'Team Members', history: 'History' };
      return `<button class="tab ${this.activeTab === t ? 'active' : ''}" data-tab="${t}" type="button">${labels[t]}</button>`;
    }).join('');
    return html`
      <h1 class="page-title">Account Details</h1>
      <div class="tabs">${SafeHtmlString.trusted(tabsHtml)}</div>
      <div class="tab-content">${SafeHtmlString.trusted(this.renderTabContent())}</div>
    `;
  }
}

ComponentRegistry.register('acc-details-page', AccDetailsPageElement);
export { AccDetailsPageElement };