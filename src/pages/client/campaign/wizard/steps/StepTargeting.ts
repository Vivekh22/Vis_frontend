/**
 * StepTargeting.ts — Step 4 of campaign wizard.
 *
 * Geo (Country/State/City with Include/Exclude), Zip, Lat/Long, Device/OS,
 * Network, Device Identifier, Smart App Categories, Whitelisting/Blacklisting
 * cards (App List/Audience List/IP List).
 *
 * NOTE: App List/Audience List/IP List reference entities from the
 * not-yet-built App List/Audience pages. For now, these accept free-text/ID
 * entry. Real cross-referencing arrives once those modules exist in Part 9.
 */
import { BaseComponent } from '../../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../../platform/rendering/SafeHtml';
import { featureFlagService } from '../../../../../services';
import { FeatureFlag } from '../../../../../core/enums/FeatureFlag';
import type { StepComponent } from '../campaign-wizard-types';
import type { CampaignFormData } from '../campaign-wizard-types';

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
  .row { display: flex; gap: var(--space-3); align-items: center; margin-bottom: var(--space-2); }
  .row .field { flex: 1; }
  .row-label { width: 220px; font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-primary); text-transform: uppercase; }
  
  .geo-row { display: flex; gap: var(--space-2); flex: 1; }
  .geo-input { flex: 2; }
  .geo-select { flex: 1; }
  
  .radio-group { display: flex; gap: var(--space-3); }
  .checkbox-group { display: flex; flex-wrap: wrap; gap: var(--space-4); border: 1px solid var(--color-border); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); }
  .checkbox-item { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-sm); text-transform: uppercase; font-weight: 600; }
  .checkbox-item input[type="checkbox"] { accent-color: var(--color-primary); }
  
  .listing-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    margin-bottom: var(--space-3);
  }
  .listing-title { font-size: var(--font-size-sm); font-weight: 600; text-transform: uppercase; margin: 0 0 var(--space-3); color: var(--color-text-primary); }
  .listing-field { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-2); }
  .listing-label { font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; color: var(--color-text-primary); }
`;

const DEVICES = ['iOS', 'Android', 'Windows', 'macOS', 'Linux'];
const NETWORKS = ['Cellular', 'WiFi'];

class StepTargeting extends BaseComponent implements StepComponent {
  private _data: CampaignFormData | null = null;
  private _clientId = 'client-1'; // Default — set by parent wizard
  private _ipFreqCappingEnabled = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: CampaignFormData) {
    this._data = value;
    this.rerender();
  }

  public set clientId(value: string) {
    this._clientId = value;
    void this.checkFeatureFlags();
  }

  /**
   * FeatureFlagService check: when IP-Based Frequency Capping is disabled,
   * the IP List card is FULLY ABSENT from the UI — not shown-but-locked.
   */
  private async checkFeatureFlags(): Promise<void> {
    try {
      this._ipFreqCappingEnabled = await featureFlagService.isFeatureEnabled(
        this._clientId,
        FeatureFlag.IpBasedFrequencyCapping,
      );
    } catch {
      this._ipFreqCappingEnabled = true; // Fail open — show by default
    }
    this.rerender();
  }

  protected onMount(): void {
    this.shadow.addEventListener('change', this.handleChange);
    this.shadow.addEventListener('input', this.handleChange);
    this.shadow.addEventListener('click', this.handleClick);
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
    
    if (target.tagName.toLowerCase() === 'input' && (target as HTMLInputElement).type === 'checkbox') {
      const chip = target.getAttribute('data-chip');
      const chipType = target.getAttribute('data-chip-type');
      if (chip && chipType && Array.isArray(this._data[chipType as keyof CampaignFormData])) {
        const list = this._data[chipType as keyof CampaignFormData] as string[];
        const newList = checked ? [...list, chip] : list.filter(v => v !== chip);
        const newData = { ...this._data, [chipType]: newList };
        this._data = newData;
        this.emitDataChanged(newData);
        this.emitValidity(true);
        return;
      }
      
      if (field === 'deviceIdentifier') {
        const newData = { ...this._data, deviceIdentifier: checked ? target.getAttribute('value') as any : '' };
        this._data = newData;
        this.emitDataChanged(newData);
        this.emitValidity(true);
        this.rerender();
        return;
      }
    }

    const newData = { ...this._data, [field]: value };
    this._data = newData;
    this.emitDataChanged(newData);
    this.emitValidity(true);
  };

  private handleClick = (event: Event): void => {
    // Checkbox clicks handled by handleChange
  };

  private emitDataChanged(data: CampaignFormData): void {
    this.emit('step-data-changed', { data });
  }

  private emitValidity(isValid: boolean): void {
    this.emit('step-validity-changed', { isValid });
  }

  protected renderTemplate(): string {
    if (!this._data) return '';
    const d = this._data;
    return html`
      <div class="step-content">
        <div class="row">
          <div class="row-label">Country</div>
          <div class="geo-row">
            <input type="text" class="field-input geo-input" data-field="geoCountries" value="${d.geoCountries}">
            <select class="field-input geo-select"><option>INCLUDE/EXCLUDE</option></select>
          </div>
        </div>
        <div class="row">
          <div class="row-label">State</div>
          <div class="geo-row">
            <input type="text" class="field-input geo-input" data-field="geoStates" value="${d.geoStates}">
            <select class="field-input geo-select"><option>INCLUDE/EXCLUDE</option></select>
          </div>
        </div>
        <div class="row">
          <div class="row-label">City</div>
          <div class="geo-row">
            <input type="text" class="field-input geo-input" data-field="geoCities" value="${d.geoCities}">
            <select class="field-input geo-select"><option>INCLUDE/EXCLUDE</option></select>
          </div>
        </div>
        <div class="row">
          <div class="row-label">Zip Code</div>
          <input type="text" class="field-input" data-field="zipCodes" value="${d.zipCodes}">
        </div>
        <div class="row">
          <div class="row-label">Longitude, Latitude</div>
          <input type="text" class="field-input" data-field="latLong" value="${d.latLong}">
        </div>
        
        <div class="row">
          <div class="row-label">OS</div>
          <select class="field-input" data-field="deviceOs" style="flex: 1;">
            <option value="">SELECT ↓</option>
            ${SafeHtmlString.trusted(DEVICES.map(dev => `<option value="${dev}" ${d.deviceOs.includes(dev) ? 'selected' : ''}>${dev}</option>`).join(''))}
          </select>
          <div class="row-label" style="margin-left: var(--space-4); width: 80px;">Network</div>
          <div class="checkbox-group" style="flex: 1;">
            ${SafeHtmlString.trusted(NETWORKS.map((n) => {
              const checked = d.networkType.includes(n);
              return `<label class="checkbox-item"><input type="checkbox" data-chip="${n}" data-chip-type="networkType" ${checked ? 'checked' : ''}>${n}</label>`;
            }).join(''))}
          </div>
        </div>

        <div class="row"><div class="row-label">OS Version</div><select class="field-input" data-field="osVersion"><option value="">SELECT ↓</option></select></div>
        <div class="row"><div class="row-label">OS Minor Version</div><select class="field-input" data-field="osMinorVersion"><option value="">SELECT ↓</option></select></div>
        <div class="row"><div class="row-label">Device Type</div><select class="field-input" data-field="deviceType"><option value="">SELECT ↓</option></select></div>
        <div class="row"><div class="row-label">Device Manufacturer</div><select class="field-input" data-field="deviceManufacturer"><option value="">SELECT ↓</option></select></div>
        
        <div class="row">
          <div class="row-label">Device Identifier</div>
          <select class="field-input" data-field="deviceIdentifierSelect" style="flex: 1;"><option value="">SELECT ↓</option></select>
          <span style="color: var(--color-text-muted); margin: 0 var(--space-2);">→</span>
          <div class="checkbox-group" style="flex: 1;">
            <label class="checkbox-item"><input type="checkbox" data-field="deviceIdentifier" value="both" ${d.deviceIdentifier === 'both' ? 'checked' : ''}> BOTH</label>
            <label class="checkbox-item"><input type="checkbox" data-field="deviceIdentifier" value="missing" ${d.deviceIdentifier === 'missing' ? 'checked' : ''}> MISSING</label>
            <label class="checkbox-item"><input type="checkbox" data-field="deviceIdentifier" value="present" ${d.deviceIdentifier === 'present' ? 'checked' : ''}> PRESENT</label>
          </div>
        </div>

        <div class="row"><div class="row-label">Device Language</div><select class="field-input" data-field="deviceLanguage"><option value="">SELECT ↓</option></select></div>
        <div class="row"><div class="row-label">Smart App Categories</div><input type="text" class="field-input" data-field="smartAppCategories" value="${d.smartAppCategories}"></div>

        ${SafeHtmlString.trusted(this.renderCards(d))}
      </div>
    `;
  }

  private renderCards(d: CampaignFormData): string {
    return `
      <div class="listing-card">
        <p class="listing-title">White Listing</p>
        <div class="listing-field"><label class="listing-label">App List</label><input type="text" class="field-input" data-field="appWhitelist" value="${d.appWhitelist}"></div>
        <div class="listing-field"><label class="listing-label">Audience List</label><input type="text" class="field-input" data-field="audienceWhitelist" value="${d.audienceWhitelist}"></div>
        ${this._ipFreqCappingEnabled ? `<div class="listing-field"><label class="listing-label">IP List</label><input type="text" class="field-input" data-field="ipWhitelist" value="${d.ipWhitelist}"></div>` : ''}
      </div>

      <div class="listing-card">
        <p class="listing-title">Black Listing</p>
        <div class="listing-field"><label class="listing-label">App List</label><input type="text" class="field-input" data-field="appBlacklist" value="${d.appBlacklist}"></div>
        <div class="listing-field"><label class="listing-label">Audience List</label><input type="text" class="field-input" data-field="audienceBlacklist" value="${d.audienceBlacklist}"></div>
        ${this._ipFreqCappingEnabled ? `<div class="listing-field"><label class="listing-label">IP List</label><input type="text" class="field-input" data-field="ipBlacklist" value="${d.ipBlacklist}"></div>` : ''}
      </div>
    `;
  }
}

ComponentRegistry.register('step-targeting', StepTargeting);
export { StepTargeting };