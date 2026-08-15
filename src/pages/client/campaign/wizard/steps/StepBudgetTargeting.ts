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
  .checkbox-group { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .checkbox-item { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-sm); }
  .chip-group { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .chip {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    cursor: pointer;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    background: var(--color-bg);
  }
  .chip.active { background: var(--color-primary); color: var(--color-primary-foreground); border-color: var(--color-primary); }
  .toggle-group { display: flex; flex-direction: column; gap: var(--space-2); }
  .toggle-item { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) 0; }
  .toggle-label { font-size: var(--font-size-sm); }
  .toggle { position: relative; width: 36px; height: 20px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider {
    position: absolute; cursor: pointer; inset: 0;
    background: var(--color-border); border-radius: var(--radius-full);
    transition: 0.2s;
  }
  .toggle-slider:before {
    content: ""; position: absolute; height: 14px; width: 14px;
    left: 3px; top: 3px; background: white; border-radius: 50%; transition: 0.2s;
  }
  .toggle input:checked + .toggle-slider { background: var(--color-primary); }
  .toggle input:checked + .toggle-slider:before { transform: translateX(16px); }
  .row { display: flex; gap: var(--space-3); }
  .row .field { flex: 1; }
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
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (!field || !this._data) return;
    const value = (target as HTMLInputElement).value;
    const checked = (target as HTMLInputElement).checked;
    const numericFields = ['budget', 'bid', 'frequencyCap'];
    const newData = {
      ...this._data,
      [field]: numericFields.includes(field) ? Number(value) : checked,
    };
    this._data = newData;
    this.emitDataChanged(newData);
    this.emitValidity(this.isValid(newData));
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const chip = target.closest('[data-chip]');
    if (!chip || !this._data) return;
    const chipType = chip.getAttribute('data-chip-type');
    const chipValue = chip.getAttribute('data-chip');
    if (!chipType || !chipValue) return;
    const list = this._data[chipType as keyof CampaignFormData] as string[];
    if (!Array.isArray(list)) return;
    const newList = list.includes(chipValue) ? list.filter((v) => v !== chipValue) : [...list, chipValue];
    const newData = { ...this._data, [chipType]: newList };
    this._data = newData;
    this.rerender();
    this.emitDataChanged(newData);
    this.emitValidity(this.isValid(newData));
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
        <div class="field">
          <label class="field-label">Platforms</label>
          <div class="checkbox-group">
            ${SafeHtmlString.trusted(PLATFORMS.map((p) => {
              const checked = d.platforms.includes(p);
              return `<div class="checkbox-item"><input type="checkbox" data-field="${p}" data-platform="${p}" ${checked ? 'checked' : ''}><span>${p}</span></div>`;
            }).join(''))}
          </div>
        </div>
        <div class="field">
          <label class="field-label">Creative Types</label>
          <div class="checkbox-group">
            ${SafeHtmlString.trusted(CREATIVE_TYPES.map((c) => {
              const checked = d.creativeTypes.includes(c);
              return `<div class="checkbox-item"><input type="checkbox" data-field="${c}" data-creative="${c}" ${checked ? 'checked' : ''}><span>${c}</span></div>`;
            }).join(''))}
          </div>
        </div>
        <div class="field">
          <label class="field-label">Optimization</label>
          <div class="chip-group">
            ${SafeHtmlString.trusted(OPT_GOALS.map((g) => {
              const active = d.optimizationGoals.includes(g);
              return `<span class="chip ${active ? 'active' : ''}" data-chip="${g}" data-chip-type="optimizationGoals">${g}</span>`;
            }).join(''))}
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label class="field-label" for="budget">Budget (USD)</label>
            <input type="number" class="field-input" data-field="budget" id="budget" value="${d.budget}">
          </div>
          <div class="field">
            <label class="field-label" for="bid">Target Bid (USD)</label>
            <input type="number" class="field-input" data-field="bid" id="bid" value="${d.bid}">
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label class="field-label" for="freqCap">Frequency Cap</label>
            <input type="number" class="field-input" data-field="frequencyCap" id="freqCap" value="${d.frequencyCap}">
          </div>
          <div class="field">
            <label class="field-label" for="freqPeriod">Frequency Period</label>
            <select class="field-input" data-field="frequencyPeriod" id="freqPeriod">
              <option value="daily" ${d.frequencyPeriod === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="weekly" ${d.frequencyPeriod === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="monthly" ${d.frequencyPeriod === 'monthly' ? 'selected' : ''}>Monthly</option>
            </select>
          </div>
        </div>
        <div class="toggle-group">
          ${SafeHtmlString.trusted(this.renderToggles(d))}
        </div>
      </div>
      <ai-suggestion-popup></ai-suggestion-popup>
    `;
  }

  private renderToggles(d: CampaignFormData): string {
    const toggles: { field: keyof CampaignFormData; label: string }[] = [
      { field: 'budgetPacing', label: 'Budget Pacing' },
      { field: 'bidShading', label: 'Bid Shading' },
      { field: 'impressionPacing', label: 'Impression Pacing' },
      { field: 'autoExclusion', label: 'Auto Exclusion' },
      { field: 'appDiversity', label: 'App Diversity' },
    ];
    return toggles.map((t) => {
      const checked = d[t.field] as boolean;
      return `<div class="toggle-item"><span class="toggle-label">${t.label}</span><label class="toggle"><input type="checkbox" data-field="${t.field}" ${checked ? 'checked' : ''}><span class="toggle-slider"></span></label></div>`;
    }).join('');
  }
}

ComponentRegistry.register('step-budget-targeting', StepBudgetTargeting);
export { StepBudgetTargeting };