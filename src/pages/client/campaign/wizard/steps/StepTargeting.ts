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
  .row { display: flex; gap: var(--space-3); }
  .row .field { flex: 1; }
  .radio-group { display: flex; gap: var(--space-3); }
  .radio-item { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-sm); }
  .checkbox-group { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .checkbox-item { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-sm); }
  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }
  .card-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-2); }
  .card-note { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; }
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
    this.shadow.addEventListener('click', this.handleClick);
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
    const newData = { ...this._data, [field]: field === 'geoMode' ? value : checked };
    this._data = newData;
    this.emitDataChanged(newData);
    this.emitValidity(true);
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
        <div class="field">
          <label class="field-label">Geo Targeting</label>
          <div class="radio-group">
            <div class="radio-item"><input type="radio" name="geoMode" data-field="geoMode" value="include" ${d.geoMode === 'include' ? 'checked' : ''}><span>Include</span></div>
            <div class="radio-item"><input type="radio" name="geoMode" data-field="geoMode" value="exclude" ${d.geoMode === 'exclude' ? 'checked' : ''}><span>Exclude</span></div>
          </div>
        </div>
        <div class="row">
          <div class="field"><label class="field-label">Countries</label><input type="text" class="field-input" data-field="geoCountries" value="${d.geoCountries}" placeholder="US, UK, IN"></div>
          <div class="field"><label class="field-label">States</label><input type="text" class="field-input" data-field="geoStates" value="${d.geoStates}"></div>
          <div class="field"><label class="field-label">Cities</label><input type="text" class="field-input" data-field="geoCities" value="${d.geoCities}"></div>
        </div>
        <div class="row">
          <div class="field"><label class="field-label">Zip Codes</label><input type="text" class="field-input" data-field="zipCodes" value="${d.zipCodes}"></div>
          <div class="field"><label class="field-label">Lat/Long</label><input type="text" class="field-input" data-field="latLong" value="${d.latLong}" placeholder="37.7749,-122.4194"></div>
        </div>
        <div class="field">
          <label class="field-label">Device / OS</label>
          <div class="checkbox-group">
            ${SafeHtmlString.trusted(DEVICES.map((dev) => {
              const checked = d.deviceOs.includes(dev);
              return `<div class="checkbox-item"><input type="checkbox" data-chip="${dev}" data-chip-type="deviceOs" ${checked ? 'checked' : ''}><span>${dev}</span></div>`;
            }).join(''))}
          </div>
        </div>
        <div class="field">
          <label class="field-label">Network</label>
          <div class="checkbox-group">
            ${SafeHtmlString.trusted(NETWORKS.map((n) => {
              const checked = d.networkType.includes(n);
              return `<div class="checkbox-item"><input type="checkbox" data-chip="${n}" data-chip-type="networkType" ${checked ? 'checked' : ''}><span>${n}</span></div>`;
            }).join(''))}
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="deviceIdentifier">Device Identifier</label>
          <input type="text" class="field-input" data-field="deviceIdentifier" id="deviceIdentifier" value="${d.deviceIdentifier}">
        </div>
        <div class="field">
          <label class="field-label" for="smartAppCategories">Smart App Categories</label>
          <input type="text" class="field-input" data-field="smartAppCategories" id="smartAppCategories" value="${d.smartAppCategories}">
        </div>
        ${SafeHtmlString.trusted(this.renderCards(d))}
      </div>
    `;
  }

  private renderCards(d: CampaignFormData): string {
    const listTypes: { key: string; title: string; placeholder: string; whiteField: keyof CampaignFormData; blackField: keyof CampaignFormData }[] = [
      { key: 'app', title: 'App List', placeholder: 'Enter App IDs...', whiteField: 'appWhitelist', blackField: 'appBlacklist' },
      { key: 'audience', title: 'Audience List', placeholder: 'Enter Audience IDs...', whiteField: 'audienceWhitelist', blackField: 'audienceBlacklist' },
    ];
    if (this._ipFreqCappingEnabled) {
      listTypes.push({ key: 'ip', title: 'IP List', placeholder: 'Enter IPs...', whiteField: 'ipWhitelist', blackField: 'ipBlacklist' });
    }

    return listTypes.map((c) => {
      const wVal = (d[c.whiteField] as string) || '';
      const bVal = (d[c.blackField] as string) || '';
      
      const wItems = wVal.split(',').map(s => s.trim()).filter(Boolean);
      const bItems = bVal.split(',').map(s => s.trim()).filter(Boolean);
      const conflicts = wItems.filter(item => bItems.includes(item));
      const hasConflict = conflicts.length > 0;
      
      return `
        <div class="card ${hasConflict ? 'conflict' : ''}">
          <p class="card-title">${c.title}</p>
          <div style="display: flex; gap: var(--space-3); margin-bottom: var(--space-2);">
            <div class="field" style="flex: 1;">
              <label class="field-label" style="font-size: var(--font-size-xs);">Whitelist</label>
              <input type="text" class="field-input" data-field="${String(c.whiteField)}" value="${wVal}" placeholder="${c.placeholder}">
            </div>
            <div class="field" style="flex: 1;">
              <label class="field-label" style="font-size: var(--font-size-xs);">Blacklist</label>
              <input type="text" class="field-input" data-field="${String(c.blackField)}" value="${bVal}" placeholder="${c.placeholder}">
            </div>
          </div>
          ${hasConflict ? `<p class="conflict-warning" style="color: var(--color-danger); font-size: var(--font-size-xs); margin: 0 0 var(--space-2); display: flex; align-items: center; gap: 4px;">⚠️ Conflict detected: ${conflicts.join(', ')}</p>` : ''}
          <p class="card-note">Free-text entry (comma separated) — cross-referencing arrives in Part 9.</p>
        </div>
      `;
    }).join('');
  }
}

ComponentRegistry.register('step-targeting', StepTargeting);
export { StepTargeting };