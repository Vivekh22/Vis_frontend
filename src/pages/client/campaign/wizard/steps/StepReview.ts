/**
 * StepReview.ts — Step 6 of campaign wizard.
 *
 * Full summary card with Edit-links back to each step, "Launch Campaign"
 * button. On launch, calls CampaignService.createCampaign() then
 * submitForApproval() — campaign status becomes pending_approval.
 */
import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../../platform/rendering/SafeHtml';
import type { StepComponent } from '../campaign-wizard-types';
import type { CampaignFormData } from '../campaign-wizard-types';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .review-content { display: flex; flex-direction: column; gap: var(--space-4); max-width: 800px; }
  .summary-section {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }
  .summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-2);
  }
  .summary-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0; }
  .edit-link {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: var(--font-size-xs);
    text-decoration: underline;
  }
  .summary-row { display: flex; gap: var(--space-2); font-size: var(--font-size-sm); padding: var(--space-1) 0; }
  .summary-key { color: var(--color-text-muted); min-width: 120px; }
  .summary-val { color: var(--color-text-primary); }
  .launch-btn {
    padding: var(--space-3) var(--space-6);
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }
  .launch-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .launch-notice { font-size: var(--font-size-xs); color: var(--color-text-muted); }
`;

class StepReview extends BaseComponent implements StepComponent {
  private _data: CampaignFormData | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: CampaignFormData) {
    this._data = value;
    this.rerender();
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    // Always valid — review step has no input requirements.
    this.emit('step-validity-changed', { isValid: true });
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="launch"]')) {
      this.emit('launch-campaign', { data: this._data });
    }
  };

  protected renderTemplate(): string {
    if (!this._data) return '';
    const d = this._data;
    return html`
      <div class="review-content">
        <div class="summary-section">
          <div class="summary-header">
            <p class="summary-title">Campaign Info</p>
            <button class="edit-link" data-edit-step="0" type="button">Edit</button>
          </div>
          <div class="summary-row"><span class="summary-key">Name:</span><span class="summary-val">${d.name || '—'}</span></div>
          <div class="summary-row"><span class="summary-key">Time Zone:</span><span class="summary-val">${d.timeZone}</span></div>
          <div class="summary-row"><span class="summary-key">Schedule:</span><span class="summary-val">${d.runAllTime ? 'Run All Time' : 'Scheduled'}</span></div>
        </div>
        <div class="summary-section">
          <div class="summary-header">
            <p class="summary-title">Ad Domain</p>
            <button class="edit-link" data-edit-step="1" type="button">Edit</button>
          </div>
          <div class="summary-row"><span class="summary-key">Domain:</span><span class="summary-val">${d.domain || '—'}</span></div>
          <div class="summary-row"><span class="summary-key">Type:</span><span class="summary-val">${d.domainMode === 'app_bundle' ? 'App Bundle' : 'Website'}</span></div>
          ${d.domainMode === 'app_bundle' && d.enableSkadNetwork ? SafeHtmlString.trusted('<div class="summary-row"><span class="summary-key">SKAD:</span><span class="summary-val">Enabled</span></div>') : ''}
        </div>
        <div class="summary-section">
          <div class="summary-header">
            <p class="summary-title">Budget & Targeting</p>
            <button class="edit-link" data-edit-step="2" type="button">Edit</button>
          </div>
          <div class="summary-row"><span class="summary-key">Platforms:</span><span class="summary-val">${d.platforms.join(', ') || '—'}</span></div>
          <div class="summary-row"><span class="summary-key">Budget:</span><span class="summary-val">$${d.budget}</span></div>
          <div class="summary-row"><span class="summary-key">Bid:</span><span class="summary-val">$${d.bid}</span></div>
        </div>
        <div class="summary-section">
          <div class="summary-header">
            <p class="summary-title">Targeting</p>
            <button class="edit-link" data-edit-step="3" type="button">Edit</button>
          </div>
          <div class="summary-row"><span class="summary-key">Geo:</span><span class="summary-val">${d.geoCountries || '—'}</span></div>
          <div class="summary-row"><span class="summary-key">Devices:</span><span class="summary-val">${d.deviceOs.join(', ') || '—'}</span></div>
        </div>
        <div class="summary-section">
          <div class="summary-header">
            <p class="summary-title">Bid Multiplier</p>
            <button class="edit-link" data-edit-step="4" type="button">Edit</button>
          </div>
          <div class="summary-row"><span class="summary-key">Rules:</span><span class="summary-val">${d.bidMultiplierRules.length} rule(s)</span></div>
        </div>
        <div>
          <button class="launch-btn" data-action="launch" type="button">Launch Campaign</button>
          <p class="launch-notice">Campaign will be submitted for approval (pending_approval). It does NOT go live immediately.</p>
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('step-review', StepReview);
export { StepReview };