/**
 * CampaignWizardElement.ts — pages/client/campaign/wizard/
 *
 * Orchestrator for the 6-step campaign creation wizard. Same pattern as
 * RegistrationWizardElement from Part 7: currentStep, accumulated
 * campaignData, stepValidationState, goToNextStep()/goToPreviousStep(),
 * live preview panel with per-field checkmark animations on completion.
 *
 * On launch (Step 6 "Launch Campaign" button):
 *   Calls CampaignService.createCampaign() then submitForApproval().
 *   Campaign status becomes pending_approval — per spec it does NOT go
 *   live immediately. Navigates back to CampaignListPageElement's
 *   Pending Approval tab on success.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { campaignService } from '../../../../services';
import { navigate } from '../../../../utils/navigate';
import { Money } from '../../../../core/value-objects/Money';
import { OptimizationGoal } from '../../../../core/enums/OptimizationGoal';
import type { CampaignFormData, StepComponent } from './campaign-wizard-types';
import { INITIAL_CAMPAIGN_DATA, WIZARD_STEPS } from './campaign-wizard-types';

const STEP_TAGS = [
  'step-campaign-info',
  'step-ad-domain',
  'step-budget-targeting',
  'step-targeting',
  'step-bid-multiplier',
  'step-review',
] as const;

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .wizard-container { max-width: 900px; margin: 0 auto; }
  .wizard-header { margin-bottom: var(--space-6); }
  .wizard-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin: 0 0 var(--space-3); }
  .progress-bar { display: flex; gap: var(--space-1); margin-bottom: var(--space-2); }
  .progress-step {
    flex: 1; height: 4px; border-radius: var(--radius-full);
    background: var(--color-border); transition: background 0.2s;
  }
  .progress-step.active { background: var(--color-primary); }
  .progress-step.completed { background: var(--color-success); }
  .step-labels { display: flex; gap: var(--space-1); }
  .step-label {
    flex: 1; font-size: var(--font-size-xs); color: var(--color-text-muted);
    text-align: center;
  }
  .step-label.active { color: var(--color-primary); font-weight: var(--font-weight-semibold); }
  .step-label.completed { color: var(--color-success); }
  .wizard-body { display: flex; gap: var(--space-6); }
  .step-panel { flex: 1; }
  .preview-panel { width: 280px; flex-shrink: 0; }
  .preview-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    position: sticky;
    top: var(--space-6);
  }
  .preview-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); margin: 0 0 var(--space-2); }
  .preview-row { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-xs); padding: var(--space-1) 0; }
  .preview-check { color: var(--color-success); }
  .preview-pending { color: var(--color-text-muted); }
  .wizard-footer {
    display: flex;
    justify-content: space-between;
    margin-top: var(--space-6);
  }
  .nav-btn {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
  }
  .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .nav-btn.primary {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border-color: var(--color-primary);
  }
  @media (max-width: 768px) {
    .wizard-body { flex-direction: column; }
    .preview-panel { width: 100%; }
  }
`;

class CampaignWizardElement extends BaseComponent {
  private currentStep = 0;
  private campaignData: CampaignFormData = { ...INITIAL_CAMPAIGN_DATA };
  private stepValidationState: boolean[] = [false, false, false, false, false, true];

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('step-validity-changed', this.handleStepValidity);
    this.shadow.addEventListener('step-data-changed', this.handleStepData);
    this.shadow.addEventListener('launch-campaign', this.handleLaunch);
    this.syncStepComponent();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('step-validity-changed', this.handleStepValidity);
    this.shadow.removeEventListener('step-data-changed', this.handleStepData);
    this.shadow.removeEventListener('launch-campaign', this.handleLaunch);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="prev"]')) {
      this.goToPreviousStep();
    } else if (target.closest('[data-action="next"]')) {
      this.goToNextStep();
    }
  };

  private handleStepValidity = (event: Event): void => {
    const detail = (event as CustomEvent<{ isValid: boolean }>).detail;
    this.stepValidationState[this.currentStep] = detail.isValid;
    this.rerender();
    this.syncNavButtons();
  };

  private handleStepData = (event: Event): void => {
    const detail = (event as CustomEvent<{ data: Partial<CampaignFormData> }>).detail;
    this.campaignData = { ...this.campaignData, ...detail.data };
    this.syncStepComponent();
  };

  private handleLaunch = async (): Promise<void> => {
    const data = this.campaignData;
    const budget = new Money(Math.round(data.budget * 100), 'USD');
    const campaign = await campaignService.createCampaign({
      name: data.name,
      clientId: data.clientId || 'client_default',
      budget,
      optimizationGoal: OptimizationGoal.MaximizeReach,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 30 * 86400000),
    });
    await campaignService.submitForApproval(campaign.id);
    navigate('/client/campaigns');
  };

  private goToNextStep(): void {
    if (this.currentStep < STEP_TAGS.length - 1) {
      if (!this.stepValidationState[this.currentStep]) return;
      this.currentStep++;
      this.rerender();
      this.syncStepComponent();
      this.syncNavButtons();
    }
  }

  private goToPreviousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.rerender();
      this.syncStepComponent();
      this.syncNavButtons();
    }
  }

  private syncStepComponent(): void {
    const container = this.shadow.querySelector('#step-container');
    if (!container) return;
    container.innerHTML = '';
    const stepTag = STEP_TAGS[this.currentStep]!;
    const step = document.createElement(stepTag) as StepComponent;
    step.setAttribute('data-step', '');
    container.appendChild(step);
    step.data = this.campaignData;
  }

  private syncNavButtons(): void {
    const prevBtn = this.shadow.querySelector<HTMLButtonElement>('[data-action="prev"]');
    const nextBtn = this.shadow.querySelector<HTMLButtonElement>('[data-action="next"]');
    if (prevBtn) prevBtn.disabled = this.currentStep === 0;
    if (nextBtn) {
      nextBtn.disabled = !this.stepValidationState[this.currentStep];
    }
  }

  private renderProgressBar(): string {
    return WIZARD_STEPS.map((_, i) => {
      const cls = i === this.currentStep ? 'active' : i < this.currentStep ? 'completed' : '';
      return `<div class="progress-step ${cls}"></div>`;
    }).join('');
  }

  private renderStepLabels(): string {
    return WIZARD_STEPS.map((step, i) => {
      const cls = i === this.currentStep ? 'active' : i < this.currentStep ? 'completed' : '';
      return `<div class="step-label ${cls}">${step.label}</div>`;
    }).join('');
  }

  private renderPreview(): string {
    const checks: { label: string; done: boolean }[] = [
      { label: 'Campaign Info', done: this.campaignData.name !== '' },
      { label: 'Ad Domain', done: this.campaignData.domain !== '' },
      { label: 'Budget & Targeting', done: this.campaignData.platforms.length > 0 },
      { label: 'Targeting', done: this.campaignData.deviceOs.length > 0 },
      { label: 'Bid Multiplier', done: this.campaignData.bidMultiplierRules.length > 0 },
    ];
    return checks.map((c) => {
      const icon = c.done ? '✓' : '○';
      const cls = c.done ? 'preview-check' : 'preview-pending';
      return `<div class="preview-row ${cls}">${icon} ${c.label}</div>`;
    }).join('');
  }

  protected renderTemplate(): string {
    const isLastStep = this.currentStep === STEP_TAGS.length - 1;
    const canAdvance = this.stepValidationState[this.currentStep] ?? false;
    return html`
      <div class="wizard-container">
        <div class="wizard-header">
          <h1 class="wizard-title">Create Campaign</h1>
          <div class="progress-bar">${SafeHtmlString.trusted(this.renderProgressBar())}</div>
          <div class="step-labels">${SafeHtmlString.trusted(this.renderStepLabels())}</div>
        </div>
        <div class="wizard-body">
          <div class="step-panel">
            <div id="step-container"></div>
          </div>
          <div class="preview-panel">
            <div class="preview-card">
              <p class="preview-title">Progress</p>
              ${SafeHtmlString.trusted(this.renderPreview())}
            </div>
          </div>
        </div>
        <div class="wizard-footer">
          <button class="nav-btn" data-action="prev" type="button" ${this.currentStep === 0 ? 'disabled' : ''}>Back</button>
          ${!isLastStep
            ? SafeHtmlString.trusted(`<button class="nav-btn primary" data-action="next" type="button" ${canAdvance ? '' : 'disabled'}>Next</button>`)
            : SafeHtmlString.trusted('<button class="nav-btn primary" data-action="next" type="button" disabled>Launch</button>')
          }
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('campaign-wizard', CampaignWizardElement);
export { CampaignWizardElement };