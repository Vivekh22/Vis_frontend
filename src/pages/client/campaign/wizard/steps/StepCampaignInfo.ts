/**
 * StepCampaignInfo.ts — Step 1 of campaign wizard.
 *
 * Fields: Name, Time Zone, Start/End Date & Time, "Run All The Time" vs
 * "Run at Scheduled Time" toggle. The scheduled-time option reveals
 * SchedulingGridElement (7×24 click-drag grid).
 */
import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../../platform/rendering/SafeHtml';
import type { StepComponent } from '../campaign-wizard-types';
import type { CampaignFormData } from '../campaign-wizard-types';
import { isNotEmpty } from '../../../../../utils/validators';
import '../../../../../components/scheduling-grid/SchedulingGridElement';

interface SchedulingGridHost extends HTMLElement {
  grid: boolean[][];
}

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
  .radio-group { display: flex; gap: var(--space-3); }
  .radio-card {
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    flex: 1;
  }
  .radio-card.active { border-color: var(--color-primary); background: var(--color-surface-2); }
  .radio-card-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
  .radio-card-desc { font-size: var(--font-size-xs); color: var(--color-text-muted); }
  .date-row { display: flex; gap: var(--space-3); }
  .date-row .field { flex: 1; }
`;

class StepCampaignInfo extends BaseComponent implements StepComponent {
  private _data: CampaignFormData | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: CampaignFormData) {
    this._data = value;
    this.rerender();
    this.syncGrid();
  }

  private syncGrid(): void {
    if (!this._data) return;
    const grid = this.shadow.querySelector<SchedulingGridHost>('scheduling-grid');
    if (grid) {
      grid.grid = this._data.schedule;
    }
  }

  protected onMount(): void {
    this.shadow.addEventListener('change', this.handleChange);
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('schedule-changed', this.handleScheduleChanged);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('change', this.handleChange);
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('schedule-changed', this.handleScheduleChanged);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const card = target.closest('[data-schedule-toggle]');
    if (!card || !this._data) return;
    const toggleType = card.getAttribute('data-schedule-toggle');
    const runAllTime = toggleType === 'all-time';
    if (this._data.runAllTime !== runAllTime) {
      const newData = { ...this._data, runAllTime };
      this._data = newData;
      this.emitDataChanged(newData);
      this.emitValidity(this.isValid(newData));
      this.rerender();
      this.syncGrid();
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const field = target.getAttribute('data-field');
    if (!field || !this._data) return;
    const value = (target as HTMLInputElement).value;
    const newData = { ...this._data, [field]: value };
    this._data = newData;
    this.emitDataChanged(newData);
    this.emitValidity(this.isValid(newData));
  };

  private handleScheduleChanged = (event: Event): void => {
    const detail = (event as CustomEvent<boolean[][]>).detail;
    if (!this._data) return;
    const newData = { ...this._data, schedule: detail };
    this._data = newData;
    this.emitDataChanged(newData);
  };

  private emitDataChanged(data: CampaignFormData): void {
    this.emit('step-data-changed', { data });
  }

  private emitValidity(isValid: boolean): void {
    this.emit('step-validity-changed', { isValid });
  }

  private isValid(data: CampaignFormData): boolean {
    return isNotEmpty(data.name) && isNotEmpty(data.timeZone);
  }

  protected renderTemplate(): string {
    if (!this._data) return '';
    const d = this._data;
    return html`
      <div class="step-content">
        <div class="field">
          <label class="field-label" for="name">Campaign Name</label>
          <input type="text" class="field-input" data-field="name" id="name" value="${d.name}">
        </div>
        <div class="field">
          <label class="field-label" for="timezone">Time Zone</label>
          <input type="text" class="field-input" data-field="timeZone" id="timezone" value="${d.timeZone}">
        </div>
        <div class="date-row">
          <div class="field">
            <label class="field-label" for="startDate">Start Date</label>
            <input type="date" class="field-input" data-field="startDate" id="startDate" value="${d.startDate}">
          </div>
          <div class="field">
            <label class="field-label" for="endDate">End Date</label>
            <input type="date" class="field-input" data-field="endDate" id="endDate" value="${d.endDate}">
          </div>
        </div>
        <div class="field">
          <label class="field-label">Schedule Type</label>
          <div class="radio-group">
            <div class="radio-card ${d.runAllTime ? 'active' : ''}" data-schedule-toggle="all-time">
              <div class="radio-card-label">Run All The Time</div>
              <div class="radio-card-desc">Campaign runs 24/7 during the date range</div>
            </div>
            <div class="radio-card ${!d.runAllTime ? 'active' : ''}" data-schedule-toggle="scheduled">
              <div class="radio-card-label">Run at Scheduled Time</div>
              <div class="radio-card-desc">Select specific day/hour slots</div>
            </div>
          </div>
        </div>
        ${!d.runAllTime ? SafeHtmlString.trusted('<scheduling-grid></scheduling-grid>') : ''}
      </div>
    `;
  }
}

ComponentRegistry.register('step-campaign-info', StepCampaignInfo);
export { StepCampaignInfo };