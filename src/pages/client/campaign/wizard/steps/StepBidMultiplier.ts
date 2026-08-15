/**
 * StepBidMultiplier.ts — Step 5 of campaign wizard.
 *
 * Rules table + "+ Add Rule" accordion builder. Each rule has:
 *   condition (Apps/Location/Device IDs/Ad Format/Network),
 *   conditionValue, multiplier value, expiry date.
 */
import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../../platform/rendering/SafeHtml';
import type { StepComponent, CampaignFormData, BidMultiplierRule } from '../campaign-wizard-types';

const CONDITIONS = ['Apps', 'Location', 'Device IDs', 'Ad Format', 'Network'];

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-content { display: flex; flex-direction: column; gap: var(--space-4); max-width: 800px; }
  .rules-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
  .rules-table th, .rules-table td { padding: var(--space-2); border-bottom: 1px solid var(--color-border); text-align: left; }
  .rules-table th { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; }
  .rule-input {
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
    width: 100%;
  }
  .add-rule-btn {
    padding: var(--space-2) var(--space-4);
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  .remove-btn {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-1);
    cursor: pointer;
    font-size: var(--font-size-xs);
    color: var(--color-danger);
  }
`;

class StepBidMultiplier extends BaseComponent implements StepComponent {
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
    this.shadow.addEventListener('change', this.handleChange);
    this.emitValidity();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('change', this.handleChange);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="add-rule"]') && this._data) {
      const newRule: BidMultiplierRule = {
        id: `rule_${Date.now()}`,
        condition: 'Apps',
        conditionValue: '',
        multiplier: 1.0,
        expiry: '',
      };
      const newData = { ...this._data, bidMultiplierRules: [...this._data.bidMultiplierRules, newRule] };
      this._data = newData;
      this.rerender();
      this.emitDataChanged(newData);
    }
    const removeBtn = target.closest('[data-action="remove-rule"]');
    if (removeBtn && this._data) {
      const ruleId = removeBtn.getAttribute('data-rule-id');
      if (ruleId) {
        const newData = {
          ...this._data,
          bidMultiplierRules: this._data.bidMultiplierRules.filter((r) => r.id !== ruleId),
        };
        this._data = newData;
        this.rerender();
        this.emitDataChanged(newData);
      }
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const ruleId = target.getAttribute('data-rule-id');
    const field = target.getAttribute('data-field');
    if (!ruleId || !field || !this._data) return;
    const value = (target as HTMLInputElement).value;
    const rules = this._data.bidMultiplierRules.map((r) => {
      if (r.id !== ruleId) return r;
      const updated = { ...r };
      if (field === 'multiplier') {
        updated.multiplier = Number(value);
      } else {
        (updated as unknown as Record<string, string>)[field] = value;
      }
      return updated;
    });
    const newData = { ...this._data, bidMultiplierRules: rules };
    this._data = newData;
    this.emitDataChanged(newData);
  };

  private emitDataChanged(data: CampaignFormData): void {
    this.emit('step-data-changed', { data });
  }

  private emitValidity(): void {
    this.emit('step-validity-changed', { isValid: true });
  }

  protected renderTemplate(): string {
    if (!this._data) return '';
    const rules = this._data.bidMultiplierRules;
    return html`
      <div class="step-content">
        <button class="add-rule-btn" data-action="add-rule" type="button">+ Add Rule</button>
        ${rules.length > 0 ? SafeHtmlString.trusted(this.renderRulesTable(rules)) : '<p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">No rules added yet. Multiplier defaults to 1.0.</p>'}
      </div>
    `;
  }

  private renderRulesTable(rules: BidMultiplierRule[]): string {
    const header = html`
      <tr>
        <th>Condition</th>
        <th>Value</th>
        <th>Multiplier</th>
        <th>Expiry</th>
        <th></th>
      </tr>
    `;
    const body = rules.map((r) => html`
      <tr>
        <td><select class="rule-input" data-rule-id="${r.id}" data-field="condition">
          ${SafeHtmlString.trusted(CONDITIONS.map((c) => `<option value="${c}" ${r.condition === c ? 'selected' : ''}>${c}</option>`).join(''))}
        </select></td>
        <td><input type="text" class="rule-input" data-rule-id="${r.id}" data-field="conditionValue" value="${r.conditionValue}"></td>
        <td><input type="number" class="rule-input" data-rule-id="${r.id}" data-field="multiplier" value="${r.multiplier}" step="0.1"></td>
        <td><input type="date" class="rule-input" data-rule-id="${r.id}" data-field="expiry" value="${r.expiry}"></td>
        <td><button class="remove-btn" data-action="remove-rule" data-rule-id="${r.id}" type="button">Remove</button></td>
      </tr>
    `).join('');
    return `<table class="rules-table"><thead>${header}</thead><tbody>${body}</tbody></table>`;
  }
}

ComponentRegistry.register('step-bid-multiplier', StepBidMultiplier);
export { StepBidMultiplier };