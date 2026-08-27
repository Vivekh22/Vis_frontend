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
  .radio-group { display: flex; gap: var(--space-4); align-items: center; }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    cursor: pointer;
  }
  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
  }
  .date-row { display: flex; gap: var(--space-3); align-items: flex-end; }
  .date-row .field { flex: 1; }
  .date-time-group { display: flex; gap: var(--space-2); flex: 2; }
  .date-time-group .field { flex: 1; }
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
    this.shadow.addEventListener('input', this.handleChange);
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('schedule-changed', this.handleScheduleChanged);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('change', this.handleChange);
    this.shadow.removeEventListener('input', this.handleChange);
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('schedule-changed', this.handleScheduleChanged);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'input' && (target as HTMLInputElement).type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      const toggleType = checkbox.getAttribute('data-schedule-toggle');
      if (toggleType === 'all-time' && this._data) {
        const newData = { ...this._data, runAllTime: checkbox.checked, runAtScheduledTime: !checkbox.checked };
        this.updateData(newData);
      } else if (toggleType === 'scheduled' && this._data) {
        const newData = { ...this._data, runAtScheduledTime: checkbox.checked, runAllTime: !checkbox.checked };
        this.updateData(newData);
      }
    }
  };

  private updateData(newData: CampaignFormData) {
    this._data = newData;
    this.emitDataChanged(newData);
    this.emitValidity(this.isValid(newData));
    this.rerender();
    this.syncGrid();
  }

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
          <div class="date-time-group">
            <div class="field">
              <label class="field-label" for="startDate">START DATE</label>
              <input type="date" class="field-input" data-field="startDate" id="startDate" value="${d.startDate}">
            </div>
            <div class="field">
              <label class="field-label" for="startTime">START TIME</label>
              <input type="time" class="field-input" data-field="startTime" id="startTime" value="${d.startTime}">
            </div>
          </div>
          <div style="padding: 0 var(--space-2); color: var(--color-text-muted);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div class="date-time-group">
            <div class="field">
              <label class="field-label" for="endDate">END DATE</label>
              <input type="date" class="field-input" data-field="endDate" id="endDate" value="${d.endDate}">
            </div>
            <div class="field">
              <label class="field-label" for="endTime">END TIME</label>
              <input type="time" class="field-input" data-field="endTime" id="endTime" value="${d.endTime}">
            </div>
          </div>
        </div>
        <div class="field" style="margin-top: var(--space-2);">
          <div class="radio-group">
            <label class="checkbox-label">
              <input type="checkbox" data-schedule-toggle="all-time" ${d.runAllTime ? 'checked' : ''}>
              RUN ADS ALL THE TIME
            </label>
            <label class="checkbox-label">
              <input type="checkbox" data-schedule-toggle="scheduled" ${d.runAtScheduledTime ? 'checked' : ''}>
              RUN ADS AT SCHEDULED TIME
            </label>
          </div>
        </div>
        ${d.runAtScheduledTime ? SafeHtmlString.trusted('<scheduling-grid></scheduling-grid>') : ''}
      </div>
    `;
  }
}

ComponentRegistry.register('step-campaign-info', StepCampaignInfo);
export { StepCampaignInfo };