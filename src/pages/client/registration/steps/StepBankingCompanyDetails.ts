/**
 * StepBankingCompanyDetails.ts — pages/client/registration/steps/
 *
 * Step 4 of the registration wizard. Account No., Holder Name, VAT/Tax No.,
 * Routing No., Company Name, Country, Address fields.
 *
 * SECURITY NOTE: Banking fields (accountNumber, routingNumber) are sensitive
 * financial data. The frontend does NOT log these values anywhere (no
 * console.log of form state). Input masking for display (e.g. account number
 * partially obscured after entry) is a reasonable UX/security touch —
 * flagged as a recommendation, not implemented here, because the current
 * TextFieldElement does not support focus/blur-based display masking and
 * adding it would require a new component or significant TextFieldElement
 * changes. The backend must encrypt at rest.
 *
 * Emits:
 *   step-data-changed   { data: Partial<RegistrationFormData> }
 *   step-validity-changed { isValid: boolean }
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { isNotEmpty } from '../../../../utils/validators';
import { COUNTRY_LIST } from '../../../../utils/countryList';
import type { RegistrationFormData, StepComponent } from '../registration-types';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .step-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-2); }
  .step-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-6); }
  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); max-width: 600px; }
  .field-grid text-field, .field-grid select-field { grid-column: span 1; }
  .field-grid .full { grid-column: span 2; }
  @media (max-width: 600px) { .field-grid { grid-template-columns: 1fr; } .field-grid .full { grid-column: span 1; } }
`;

const TEXT_FIELDS = ['accountNumber', 'holderName', 'vatTaxNumber', 'routingNumber', 'companyName', 'address'] as const;

class StepBankingCompanyDetails extends BaseComponent implements StepComponent {
  private _data: RegistrationFormData = {} as RegistrationFormData;
  private _isValid = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set data(value: RegistrationFormData) {
    this._data = { ...value };
    if (this.isConnected) this.syncFieldValues();
  }
  public get data(): RegistrationFormData { return this._data; }

  protected onMount(): void {
    this.syncFieldValues();
    this.shadow.addEventListener('value-changed', this.handleValueChanged);
    this.shadow.addEventListener('change', this.handleSelectChange);
  }
  protected onUnmount(): void {
    this.shadow.removeEventListener('value-changed', this.handleValueChanged);
    this.shadow.removeEventListener('change', this.handleSelectChange);
  }

  private syncFieldValues(): void {
    for (const f of TEXT_FIELDS) {
      const field = this.shadow.querySelector<HTMLElement & { value: string }>(`[data-field-name="${f}"]`);
      if (field) field.value = (this._data as unknown as Record<string, string>)[f] ?? '';
    }
    const countrySelect = this.shadow.querySelector<HTMLElement & { value: string; options: typeof COUNTRY_LIST }>('[data-field-name="country"]');
    if (countrySelect) {
      countrySelect.options = COUNTRY_LIST;
      countrySelect.value = this._data.country ?? '';
    }
  }

  private handleValueChanged = (event: Event): void => {
    const target = event.target as HTMLElement;
    const fieldName = target.getAttribute('data-field-name');
    if (!fieldName) return;
    const value = (event as CustomEvent<string>).detail;
    (this._data as unknown as Record<string, unknown>)[fieldName] = value;
    this.validateAndEmit();
  };

  private handleSelectChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.getAttribute('data-field-name') !== 'country') return;
    const value = (event as CustomEvent<string>).detail;
    this._data.country = value;
    this.validateAndEmit();
  };

  private validateAndEmit(): void {
    const allFields = [...TEXT_FIELDS, 'country'];
    const valid = allFields.every((f) => isNotEmpty((this._data as unknown as Record<string, string>)[f] ?? ''));
    if (valid !== this._isValid) this._isValid = valid;
    this.emit('step-data-changed', { data: { accountNumber: this._data.accountNumber, holderName: this._data.holderName, vatTaxNumber: this._data.vatTaxNumber, routingNumber: this._data.routingNumber, companyName: this._data.companyName, country: this._data.country, address: this._data.address } });
    this.emit('step-validity-changed', { isValid: this._isValid });
  }

  protected renderTemplate(): string {
    const fieldHtml = (name: string, label: string, full = false) =>
      `<text-field data-field-name="${name}" label="${label}"${full ? ' class="full"' : ''}></text-field>`;
    return html`
      <h2 class="step-title">Banking & Company Details</h2>
      <p class="step-subtitle">Enter your banking and company information.</p>
      <div class="field-grid">
        ${SafeHtmlString.trusted(fieldHtml('accountNumber', 'Account Number'))}
        ${SafeHtmlString.trusted(fieldHtml('holderName', 'Holder Name'))}
        ${SafeHtmlString.trusted(fieldHtml('vatTaxNumber', 'VAT/Tax Number'))}
        ${SafeHtmlString.trusted(fieldHtml('routingNumber', 'Routing Number'))}
        ${SafeHtmlString.trusted(fieldHtml('companyName', 'Company Name'))}
        ${SafeHtmlString.trusted(`<select-field data-field-name="country" label="Country" class="full"></select-field>`)}
        ${SafeHtmlString.trusted(fieldHtml('address', 'Address', true))}
      </div>
    `;
  }
}

ComponentRegistry.register('step-banking-details', StepBankingCompanyDetails);
export { StepBankingCompanyDetails };