/**
 * StepBudgetTargeting.ts — Step 3 of campaign wizard.
 *
 * Platform checkboxes (App/Web/Desktop/CTV), Creative Type checklist,
 * Optimization multi-select (CPM/CPC/CPI/CPA chip pattern from Part 7),
 * numeric Budget/Bid fields (Money value object), Frequency settings,
 * and 4 toggles: Budget Pacing, Bid Shading, Impression Pacing, Auto
 * Exclusion, App Diversity.
 */
import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../../platform/rendering/SafeHtml';
import type { StepComponent } from '../campaign-wizard-types';
import type { CampaignFormData } from '../campaign-wizard-types';
import '../../../../../components/ai-suggestion/AiSuggestionPopupElement';


const PLATFORMS = ['App', 'Web', 'Desktop', 'CTV'];
const CREATIVE_TYPES = ['Banner', 'Video', 'Native', 'Interstitial'];
const OPT_GOALS = ['CPM', 'CPC', 'CPI', 'CPA'];

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-content { display: flex; flex-direction: column; gap: var(--space-4); max-width: 800px; }
  .field { display: flex; flex-direction: column; gap: var(--space-1); }
  .field-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
  .field-input {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
  }
  .checkbox-group { display: flex; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-2); }
  .checkbox-item { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-sm); font-weight: 600; text-transform: uppercase; }
  .checkbox-item input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--color-primary); }
  
  .row { display: flex; gap: var(--space-3); align-items: center; margin-bottom: var(--space-2); }
  .row-label { width: 220px; font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-primary); text-transform: uppercase; }
  
  .field-input, .field-select {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    background: var(--color-bg);
  }
  
  .radio-group { display: flex; gap: var(--space-4); align-items: center; flex: 1; }
  .radio-label { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-sm); text-transform: uppercase; cursor: pointer; }
  .radio-label input[type="radio"] { accent-color: var(--color-primary); }
  
  .interval-group { display: flex; align-items: center; gap: var(--space-2); flex: 1; }
  .interval-group input[type="number"] { width: 100px; }
  .interval-group span { font-size: var(--font-size-sm); font-weight: 600; text-transform: uppercase; }
`;

class StepBudgetTargeting extends BaseComponent implements StepComponent {
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
    this.shadow.addEventListener('change', this.handleChange);
    this.shadow.addEventListener('input', this.handleChange);
    this.shadow.addEventListener('click', this.handleClick);
    // Trigger AI suggestion checkpoint — form-step completion
    document.dispatchEvent(
      new CustomEvent('suggestion-checkpoint', {
        detail: { source: 'campaign-wizard', entityType: 'targeting', clientId: 'client-1' },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('change', this.handleChange);
    this.shadow.removeEventListener('input', this.handleChange);
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (!field || !this._data) return;
    const value = (target as HTMLInputElement).value;
    const checked = (target as HTMLInputElement).checked;
    
    let parsedValue: any = value;
    const numericFields = ['budget', 'dayBudget', 'bid', 'targetBids', 'dailyImpression', 'totalImpressionCap', 'frequencyCap', 'impressionIntervalPerUser'];
    if (numericFields.includes(field)) {
      parsedValue = Number(value);
    } else if (target.tagName.toLowerCase() === 'input' && (target as HTMLInputElement).type === 'checkbox') {
      parsedValue = checked;
    }

    if (field === 'platforms') {
      const platform = target.getAttribute('data-platform');
      if (platform) {
        const list = this._data.platforms || [];
        parsedValue = checked ? [...list, platform] : list.filter(p => p !== platform);
      }
    }

    const newData = {
      ...this._data,
      [field]: parsedValue,
    };
    this._data = newData;
    this.emitDataChanged(newData);
    this.emitValidity(this.isValid(newData));
  };

  private handleClick = (event: Event): void => {
    // Only handling generic clicks if needed, inputs are handled by handleChange
  };

  private emitDataChanged(data: CampaignFormData): void {
    this.emit('step-data-changed', { data });
  }

  private emitValidity(isValid: boolean): void {
    this.emit('step-validity-changed', { isValid });
  }

  private isValid(data: CampaignFormData): boolean {
    return data.platforms.length > 0 && data.budget > 0 && data.bid > 0;
  }

  protected renderTemplate(): string {
    if (!this._data) return '';
    const d = this._data;
    return html`
      <div class="step-content">
        <div class="checkbox-group">
          ${SafeHtmlString.trusted(PLATFORMS.map((p) => {
            const checked = d.platforms.includes(p);
            return `<label class="checkbox-label checkbox-item"><input type="checkbox" data-field="platforms" data-platform="${p}" ${checked ? 'checked' : ''}>${p}</label>`;
          }).join(''))}
        </div>
        
        <div class="row">
          <div class="row-label">Creative Type</div>
          <select class="field-select" data-field="creativeTypes">
            <option value="">SELECT ↓</option>
            ${SafeHtmlString.trusted(CREATIVE_TYPES.map(c => `<option value="${c}" ${d.creativeTypes.includes(c) ? 'selected' : ''}>${c}</option>`).join(''))}
          </select>
        </div>

        <div class="row">
          <div class="row-label">Optimization</div>
          <select class="field-select" data-field="optimizationGoals">
            <option value="">SELECT ↓</option>
            ${SafeHtmlString.trusted(OPT_GOALS.map(c => `<option value="${c}" ${d.optimizationGoals.includes(c) ? 'selected' : ''}>${c}</option>`).join(''))}
          </select>
        </div>

        <div class="row">
          <div class="row-label">Target Bids</div>
          <input type="number" class="field-input" data-field="targetBids" value="${d.targetBids}">
        </div>
        <div class="row">
          <div class="row-label">Total Budget</div>
          <input type="number" class="field-input" data-field="budget" value="${d.budget}">
        </div>
        <div class="row">
          <div class="row-label">Day Budget</div>
          <input type="number" class="field-input" data-field="dayBudget" value="${d.dayBudget}">
        </div>
        <div class="row">
          <div class="row-label">Daily Impression</div>
          <input type="number" class="field-input" data-field="dailyImpression" value="${d.dailyImpression}">
        </div>
        <div class="row">
          <div class="row-label">Total Impression Cap</div>
          <input type="number" class="field-input" data-field="totalImpressionCap" value="${d.totalImpressionCap}">
        </div>
        
        <div class="row">
          <div class="row-label">Frequency</div>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" name="freq" data-field="frequencyPeriod" value="life" ${d.frequencyPeriod === 'life' ? 'checked' : ''}> Life</label>
            <label class="radio-label"><input type="radio" name="freq" data-field="frequencyPeriod" value="hour" ${d.frequencyPeriod === 'hour' ? 'checked' : ''}> Hour</label>
            <label class="radio-label"><input type="radio" name="freq" data-field="frequencyPeriod" value="day" ${d.frequencyPeriod === 'day' ? 'checked' : ''}> Day</label>
          </div>
        </div>

        <div class="row">
          <div class="row-label">Impression Interval Per User</div>
          <div class="interval-group">
            <input type="number" class="field-input" data-field="impressionIntervalPerUser" value="${d.impressionIntervalPerUser}">
            <span>MIN</span>
            <input type="checkbox" style="margin-left: var(--space-4); accent-color: var(--color-primary);" data-field="intervalEnabled">
          </div>
        </div>

        <div class="row"><div class="row-label">Budget Pacing</div><input type="text" class="field-input" data-field="budgetPacingText"></div>
        <div class="row"><div class="row-label">Bid Shading</div><input type="text" class="field-input" data-field="bidShadingText"></div>
        <div class="row"><div class="row-label">Impression Pacing</div><input type="text" class="field-input" data-field="impressionPacingText"></div>
        <div class="row"><div class="row-label">Auto Exclusion</div><input type="text" class="field-input" data-field="autoExclusionText"></div>
        <div class="row"><div class="row-label">App Diversity</div><input type="text" class="field-input" data-field="appDiversityText"></div>
        
        <div class="row">
          <div class="row-label">Creative Optimization</div>
          <div style="flex:1; display:flex; align-items:center; gap: 8px;">
            <span style="color: var(--color-text-muted);">→</span>
            <input type="text" class="field-input" data-field="creativeOptimization" placeholder="CPT/CPA" value="${d.creativeOptimization}">
          </div>
        </div>
        <div class="row">
          <div class="row-label">Auto Blacklisting</div>
          <div style="flex:1; display:flex; align-items:center; gap: 8px;">
            <span style="color: var(--color-text-muted);">→</span>
            <input type="text" class="field-input" data-field="autoBlacklisting" placeholder="CPI/CPA" value="${d.autoBlacklisting}">
          </div>
        </div>
      </div>
      <ai-suggestion-popup></ai-suggestion-popup>
    `;
  }

  // No longer needed with updated wireframe design

}

ComponentRegistry.register('step-budget-targeting', StepBudgetTargeting);
export { StepBudgetTargeting };