/**
 * RegistrationWizardElement.ts — pages/client/registration/
 *
 * Orchestrator for the 6-step registration wizard. Manages:
 *   - currentStep navigation (0-4 are data collection, 5 is post-approval welcome)
 *   - accumulated registrationData across all steps
 *   - stepValidationState: Record<number, boolean> tracking which steps passed
 *   - rendering the step-progress indicator + current step component
 *
 * Navigation:
 *   goToNextStep() — only advances if stepValidationState[currentStep] is true
 *   goToPreviousStep() — always allowed (can go back without losing data)
 *   On step 4's "Submit": calls authService.submitRegistration(), navigates
 *   to /register/status
 *
 * Step components communicate via composed bubbling CustomEvents:
 *   step-data-changed   { data: Partial<RegistrationFormData> }
 *   step-validity-changed { isValid: boolean }
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { authService } from '../../../services';
import { navigate } from '../../../utils/navigate';
import { INITIAL_REGISTRATION_DATA, type RegistrationFormData, type StepComponent } from './registration-types';
// Side-effect imports to ensure step components are registered (not tree-shaken).
import './steps/StepGetStarted';
import './steps/StepPersonalBusinessInfo';
import './steps/StepCampaignPreferences';
import './steps/StepBankingCompanyDetails';
import './steps/StepAccountSecurity';

const STYLES = `
  :host { display: block; font-family: var(--font-body); max-width: 800px; margin: 0 auto; padding: var(--space-6) var(--space-4); }
  .wizard-header { margin-bottom: var(--space-6); }
  .wizard-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-4); }
  .progress-bar { display: flex; gap: var(--space-2); }
  .progress-step {
    flex: 1;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-surface-2, var(--color-border));
  }
  .progress-step--active { background: var(--color-primary); }
  .progress-step--completed { background: var(--color-success); }
  .step-labels { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
  .step-label { flex: 1; font-size: var(--font-size-xs); color: var(--color-text-muted); text-align: center; }
  .step-label--active { color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  .wizard-nav { display: flex; justify-content: space-between; margin-top: var(--space-6); }
  .nav-btn {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    font-family: var(--font-body);
    background: var(--color-bg);
    color: var(--color-text-primary);
  }
  .nav-btn--primary { background: var(--color-primary); color: var(--color-primary-foreground); border-color: var(--color-primary); }
  .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .submitting-msg { font-size: var(--font-size-sm); color: var(--color-text-muted); }
  .error-banner { font-size: var(--font-size-sm); color: var(--color-danger); }
`;

const STEP_TAGS = [
  'step-get-started',
  'step-personal-business',
  'step-campaign-preferences',
  'step-banking-details',
  'step-account-security',
] as const;

const STEP_LABELS = ['Get Started', 'Personal Info', 'Campaign Prefs', 'Banking', 'Security'] as const;

class RegistrationWizardElement extends BaseComponent {
  private currentStep = 0;
  private registrationData: RegistrationFormData = { ...INITIAL_REGISTRATION_DATA };
  private stepValidationState: Record<number, boolean> = { 0: false, 1: false, 2: false, 3: false, 4: false };
  private isSubmitting = false;
  private submitError: string | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('step-data-changed', this.handleStepDataChanged);
    this.shadow.addEventListener('step-validity-changed', this.handleStepValidityChanged);
    // Sync the initial step component after render
    this.syncStepComponent();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('step-data-changed', this.handleStepDataChanged);
    this.shadow.removeEventListener('step-validity-changed', this.handleStepValidityChanged);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="next"]')) this.goToNextStep();
    else if (target.closest('[data-action="prev"]')) this.goToPreviousStep();
  };

  private handleStepDataChanged = (event: Event): void => {
    const detail = (event as CustomEvent<{ data: Partial<RegistrationFormData> }>).detail;
    this.registrationData = { ...this.registrationData, ...detail.data };
  };

  private handleStepValidityChanged = (event: Event): void => {
    const detail = (event as CustomEvent<{ isValid: boolean }>).detail;
    this.stepValidationState[this.currentStep] = detail.isValid;
    const nextBtn = this.shadow.querySelector<HTMLButtonElement>('[data-action="next"]');
    if (nextBtn) {
      nextBtn.disabled = !detail.isValid;
    }
  };

  private goToNextStep(): void {
    if (!this.stepValidationState[this.currentStep]) return;
    if (this.currentStep < STEP_TAGS.length - 1) {
      this.currentStep++;
      this.rerender();
      this.syncStepComponent();
    } else {
      void this.submitRegistration();
    }
  }

  private goToPreviousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.rerender();
      this.syncStepComponent();
    }
  }

  private async submitRegistration(): Promise<void> {
    this.isSubmitting = true;
    this.submitError = null;
    this.rerender();
    try {
      const submission = {
        email: this.registrationData.securityEmail || this.registrationData.emailOrId || this.registrationData.email,
        password: this.registrationData.password,
        firstName: this.registrationData.firstName,
        lastName: this.registrationData.lastName,
        businessName: this.registrationData.businessName,
        businessPhone: this.registrationData.businessPhone,
        agency: this.registrationData.agency || undefined,
        pricingModels: this.registrationData.pricingModels,
        accountNumber: this.registrationData.accountNumber,
        holderName: this.registrationData.holderName,
        vatTaxNumber: this.registrationData.vatTaxNumber,
        routingNumber: this.registrationData.routingNumber,
        companyName: this.registrationData.companyName,
        country: this.registrationData.country,
        address: this.registrationData.address,
      };
      await authService.submitRegistration(submission);
      navigate('/register/status');
    } catch {
      this.submitError = 'Registration submission failed. Please try again.';
    }
    this.isSubmitting = false;
    this.rerender();
  }

  private syncStepComponent(): void {
    const container = this.shadow.querySelector('#step-container');
    if (!container) return;
    container.innerHTML = '';
    const stepTag = STEP_TAGS[this.currentStep] ?? STEP_TAGS[0]!;
    const step = document.createElement(stepTag) as StepComponent;
    step.setAttribute('data-step', '');
    container.appendChild(step);
    step.data = this.registrationData;
  }

  private renderProgressBarBars(): string {
    return STEP_LABELS.map((_, i) => {
      let cls = 'progress-step';
      if (i === this.currentStep) cls += ' progress-step--active';
      else if (i < this.currentStep) cls += ' progress-step--completed';
      return `<div class="${cls}"></div>`;
    }).join('');
  }

  private renderProgressBarLabels(): string {
    return STEP_LABELS.map((label, i) => {
      let cls = 'step-label';
      if (i === this.currentStep) cls += ' step-label--active';
      return `<div class="${cls}">${label}</div>`;
    }).join('');
  }

  protected renderTemplate(): string {
    const isLastStep = this.currentStep === STEP_TAGS.length - 1;
    const canAdvance = this.stepValidationState[this.currentStep] ?? false;
    return html`
      <div class="wizard-header">
        <h1 class="wizard-title">Create Your Account</h1>
        <div class="progress-bar">${SafeHtmlString.trusted(this.renderProgressBarBars())}</div>
        <div class="step-labels">${SafeHtmlString.trusted(this.renderProgressBarLabels())}</div>
      </div>
      <div class="step-content" id="step-container"></div>
      <div class="wizard-nav">
        <button type="button" class="nav-btn" data-action="prev" ${this.currentStep === 0 ? 'disabled' : ''}>Back</button>
        ${this.isSubmitting
          ? SafeHtmlString.trusted('<span class="submitting-msg">Submitting...</span>')
          : SafeHtmlString.trusted(`<button type="button" class="nav-btn nav-btn--primary" data-action="next" ${canAdvance ? '' : 'disabled'}>${isLastStep ? 'Submit' : 'Next'}</button>`)}
      </div>
      ${this.submitError ? SafeHtmlString.trusted(`<p class="error-banner">${this.submitError}</p>`) : ''}
    `;
  }
}

ComponentRegistry.register('registration-wizard', RegistrationWizardElement);
export { RegistrationWizardElement };