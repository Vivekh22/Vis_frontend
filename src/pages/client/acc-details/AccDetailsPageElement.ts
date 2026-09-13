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
import '../../../components/loading-state/LoadingStateElement';
import '../../../components/team-members-table/TeamMembersTableElement';



const TABS = ['bank', 'company', 'address', 'reg', 'team', 'history'] as const;
type Tab = (typeof TABS)[number];

const STYLES = `
  :host { display: block; font-family: var(--font-body); padding: var(--space-4) 0; }

  /* Header */
  .page-header { margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: var(--font-weight-bold); color: #111827; margin: 0 0 4px 0; }
  .page-subtitle { font-size: 13px; color: #6b7280; margin: 0; }

  /* Tab bar */
  .tab-bar { display: flex; gap: 4px; background: #f8fafc; border: 1px solid #eef0f4; border-radius: 10px; padding: 4px; margin-bottom: 24px; width: fit-content; flex-wrap: wrap; }
  .tab { padding: 8px 16px; border: none; background: transparent; cursor: pointer; font-size: 13px; font-weight: 500; font-family: var(--font-body); color: #6b7280; border-radius: 7px; transition: all 0.2s; white-space: nowrap; }
  .tab.active { background: white; color: #111827; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .tab:hover:not(.active) { color: #374151; background: #f1f5f9; }

  /* Card */
  .card { background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .card-title { font-size: 15px; font-weight: 600; color: #111827; margin: 0 0 20px 0; }

  /* Forms */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-grid.single { grid-template-columns: 1fr; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: var(--font-body); background: #fcfdfd; color: #1e293b; outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: #3b66f5; background: white; }
  .form-input[readonly] { background: #f8fafc; color: #64748b; cursor: default; }
  .field-row { display: flex; align-items: center; gap: 8px; }
  .field-row .form-input { flex: 1; }
  .reveal-btn { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-size: 12px; font-weight: 500; color: #374151; white-space: nowrap; }
  .reveal-btn:hover { background: #f8fafc; }

  /* Buttons */
  .btn-primary { padding: 10px 20px; background: #3b66f5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; margin-top: 8px; }
  .btn-secondary { padding: 8px 16px; background: white; color: #374151; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; }

  /* Readonly Notice */
  .readonly-notice { display: flex; align-items: center; gap: 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #92400e; }

  /* Table */
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 14px 16px; border-bottom: 1px solid #f8fafc; font-size: 13px; }
  th { font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; background: #fcfdfd; }
  tr:last-child td { border-bottom: none; }

  /* Team & History */
  .owner-badge { background: #eff3ff; color: #3b66f5; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .member-name { font-weight: 600; color: #111827; }
  .member-email { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .history-action { font-weight: 500; color: #111827; }
  .history-actor { font-size: 12px; color: #64748b; }

  /* Toggle */
  .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f8fafc; }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-label { font-size: 13px; color: #374151; font-weight: 500; }
  .toggle { position: relative; width: 40px; height: 20px; flex-shrink: 0; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #e2e8f0; border-radius: 20px; transition: 0.3s; }
  .toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; top: 2px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .toggle input:checked + .toggle-slider { background: #3b66f5; }
  .toggle input:checked + .toggle-slider:before { transform: translateX(20px); }
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
      <div class="form-grid">
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
            <button class="reveal-btn" data-action="reveal-account" type="button">${this.revealAccountNumber ? '🙈 Hide' : '👁 Reveal'}</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Routing Number</label>
          <div class="field-row">
            <input class="form-input" type="text" value="${formatBankField(this.bankDetails.routingNumber, this.revealRoutingNumber)}" readonly />
            <button class="reveal-btn" data-action="reveal-routing" type="button">${this.revealRoutingNumber ? '🙈 Hide' : '👁 Reveal'}</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderCompanyTab(): string {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Legal Name</label>
          <input class="form-input" type="text" value="${this.companyDetails.legalName}" />
        </div>
        <div class="form-group">
          <label class="form-label">Tax ID</label>
          <input class="form-input" type="text" value="${this.companyDetails.taxId}" />
        </div>
        <div class="form-group">
          <label class="form-label">Industry</label>
          <input class="form-input" type="text" value="${this.companyDetails.industry}" />
        </div>
        <div class="form-group">
          <label class="form-label">Website</label>
          <input class="form-input" type="text" value="${this.companyDetails.website}" />
        </div>
      </div>
      <button class="btn-primary" type="button">Save Changes</button>
    `;
  }

  private renderAddressTab(): string {
    return `
      <div class="form-grid">
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label">Street Address</label>
          <input class="form-input" type="text" value="${this.addressDetails.street}" />
        </div>
        <div class="form-group">
          <label class="form-label">City</label>
          <input class="form-input" type="text" value="${this.addressDetails.city}" />
        </div>
        <div class="form-group">
          <label class="form-label">State / Province</label>
          <input class="form-input" type="text" value="${this.addressDetails.state}" />
        </div>
        <div class="form-group">
          <label class="form-label">Postal Code</label>
          <input class="form-input" type="text" value="${this.addressDetails.postalCode}" />
        </div>
        <div class="form-group">
          <label class="form-label">Country</label>
          <input class="form-input" type="text" value="${this.addressDetails.country}" />
        </div>
      </div>
      <button class="btn-primary" type="button">Save Changes</button>
    `;
  }

  /** Reg Details tab — READ-ONLY. No edit form exists. */
  private renderRegTab(): string {
    return `
      <div class="readonly-notice">⚠ Registration details are permanent and cannot be edited.</div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Registration Number</label>
          <input class="form-input" type="text" value="${this.regDetails.registrationNumber}" readonly />
        </div>
        <div class="form-group">
          <label class="form-label">Date of Incorporation</label>
          <input class="form-input" type="text" value="${this.regDetails.dateOfIncorporation}" readonly />
        </div>
        <div class="form-group">
          <label class="form-label">Jurisdiction</label>
          <input class="form-input" type="text" value="${this.regDetails.jurisdiction}" readonly />
        </div>
        <div class="form-group">
          <label class="form-label">PAN Number</label>
          <input class="form-input" type="text" value="${this.regDetails.panNumber}" readonly />
        </div>
      </div>
    `;
  }

  private renderTeamTab(): string {
    const members = this.teamMembers.length > 0 ? this.teamMembers : [
      { id: 't1', name: 'Priya Sharma', email: 'priya@vispriscaads.example', role: 'Owner', status: 'active' },
      { id: 't2', name: 'Rohan Mehta', email: 'rohan@vispriscaads.example', role: 'Manager', status: 'active' },
      { id: 't3', name: 'Ananya Kapoor', email: 'ananya@vispriscaads.example', role: 'Analyst', status: 'active' },
    ];
    const rows = (members as Array<{ id: string; name: string; email: string; role: string; status: string }>).map((m) => `
      <tr>
        <td>
          <div class="member-name">${m.name}</div>
          <div class="member-email">${m.email}</div>
        </td>
        <td>${m.role === 'Owner' ? `<span class="owner-badge">Owner</span>` : m.role}</td>
        <td><div class="pill ${m.status === 'active' ? 'green' : 'gray'}">${m.status}</div></td>
      </tr>
    `).join('');
    return `
      <table>
        <thead><tr><th>Team Member</th><th>Role</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private renderHistoryTab(): string {
    return `
      <table>
        <thead><tr><th>Date</th><th>Action</th><th>Actor</th></tr></thead>
        <tbody>
          <tr><td class="history-actor">${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td><td class="history-action">Profile updated</td><td class="history-actor">Priya Sharma</td></tr>
          <tr><td class="history-actor">${new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td><td class="history-action">Banking details updated</td><td class="history-actor">Priya Sharma</td></tr>
          <tr><td class="history-actor">${new Date(Date.now() - 172800000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td><td class="history-action">Team member added — Ananya Kapoor</td><td class="history-actor">Rohan Mehta</td></tr>
        </tbody>
      </table>
    `;
  }

  protected renderTemplate(): string {
    if (this._isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    const labels: Record<Tab, string> = { bank: 'Bank Details', company: 'Company Details', address: 'Address', reg: 'Reg Details', team: 'Team Members', history: 'History' };
    const tabsHtml = TABS.map((t) => `<button class="tab ${this.activeTab === t ? 'active' : ''}" data-tab="${t}" type="button">${labels[t]}</button>`).join('');
    return html`
      <div class="page-header">
        <h1 class="page-title">Account Details</h1>
        <p class="page-subtitle">Manage your organization's billing, legal, and team information</p>
      </div>
      <div class="tab-bar">${SafeHtmlString.trusted(tabsHtml)}</div>
      <div class="card">
        <p class="card-title">${labels[this.activeTab]}</p>
        ${SafeHtmlString.trusted(this.renderTabContent())}
      </div>
    `;
  }
}

ComponentRegistry.register('acc-details-page', AccDetailsPageElement);
export { AccDetailsPageElement };