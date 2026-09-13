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
import { INITIAL_CAMPAIGN_DATA, WIZARD_STEPS } from './campaign-wizard-types';
import type { CampaignFormData, StepComponent } from './campaign-wizard-types';
import { ModalElement } from '../../../../components/modal/ModalElement';
import '../../../../components/modal/ModalElement';

import './steps/StepCampaignInfo';
import './steps/StepAdDomain';
import './steps/StepBudgetTargeting';
import './steps/StepTargeting';
import './steps/StepReview';

const STEP_TAGS = [
  'step-campaign-info',
  'step-ad-domain',
  'step-budget-targeting',
  'step-targeting',
  'step-review',
] as const;

const STYLES = `
  :host { display: block; min-height: 100%; font-family: var(--font-body); }
  .wizard-container { display: flex; flex-direction: column; min-height: 100%; max-width: 1200px; margin: 0 auto; padding: var(--space-4) 0; }

  /* Header */
  .wizard-header { margin-bottom: 32px; }
  .wizard-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 24px 0; }

  /* Stepper */
  .stepper { display: flex; align-items: flex-start; gap: 0; margin-bottom: 8px; }
  .stepper-item { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
  .stepper-item:not(:last-child)::after { content: ''; position: absolute; top: 16px; left: 50%; width: 100%; height: 2px; background: #e2e8f0; z-index: 0; }
  .stepper-item.completed:not(:last-child)::after { background: #3b66f5; }
  .stepper-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; border: 2px solid #e2e8f0; background: white; color: #94a3b8; position: relative; z-index: 1; }
  .stepper-item.active .stepper-circle { border-color: #3b66f5; background: #3b66f5; color: white; box-shadow: 0 0 0 4px rgba(59,102,245,0.15); }
  .stepper-item.completed .stepper-circle { border-color: #3b66f5; background: #3b66f5; color: white; }
  .stepper-label { font-size: 11px; font-weight: 500; color: #94a3b8; margin-top: 8px; text-align: center; white-space: nowrap; }
  .stepper-item.active .stepper-label { color: #3b66f5; font-weight: 700; }
  .stepper-item.completed .stepper-label { color: #374151; }

  /* Body */
  .wizard-body { display: flex; gap: 24px; flex: 1; min-height: 500px; align-items: flex-start; justify-content: center; }
  .step-panel { flex: 1; max-width: 900px; background: white; border: 1px solid #eef0f4; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }

  /* Footer */
  .wizard-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #eef0f4; }
  .footer-left { font-size: 12px; color: #94a3b8; }
  .footer-btns { display: flex; gap: 12px; }
  .nav-btn { padding: 10px 24px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #374151; transition: all 0.15s; }
  .nav-btn:hover:not(:disabled) { background: #f8fafc; }
  .nav-btn.primary { background: #3b66f5; color: white; border-color: #3b66f5; }
  .nav-btn.primary:hover:not(:disabled) { background: #2d55e0; }
  .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
`;

class CampaignWizardElement extends BaseComponent {
  private currentStep = 0;
  private campaignData: CampaignFormData = { ...INITIAL_CAMPAIGN_DATA };
  private stepValidationState: boolean[] = [false, false, false, false, true];
  private isLaunched = false;
  private pendingNavigationPath: string | null = null;

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
    this.shadow.addEventListener('edit-step', this.handleEditStep);
    
    // Register navigation guard
    (window as any).__navigationGuard = (path: string) => {
      if (this.isLaunched) return true;
      this.pendingNavigationPath = path;
      const modal = this.shadow.querySelector<ModalElement>('#unsaved-modal');
      if (modal) modal.open();
      return false;
    };
    
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    // Duplicate clone logic handling
    const urlParams = new URLSearchParams(window.location.search);
    const dupId = urlParams.get('duplicateId');
    if (dupId) {
      // Mock populate for duplicate and jump to review
      this.campaignData = { ...INITIAL_CAMPAIGN_DATA, name: 'Copy of Campaign ' + dupId };
      this.currentStep = 4; // Jump to Review
    }
    
    this.syncStepComponent();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('step-validity-changed', this.handleStepValidity);
    this.shadow.removeEventListener('step-data-changed', this.handleStepData);
    this.shadow.removeEventListener('launch-campaign', this.handleLaunch);
    this.shadow.removeEventListener('edit-step', this.handleEditStep);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    if ((window as any).__navigationGuard) {
      delete (window as any).__navigationGuard;
    }
  }

  private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (!this.isLaunched) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="prev"]')) {
      this.goToPreviousStep();
    } else if (target.closest('[data-action="next"]')) {
      this.goToNextStep();
    } else if (target.closest('[data-action="confirm-leave"]')) {
      delete (window as any).__navigationGuard;
      if (this.pendingNavigationPath) {
        navigate(this.pendingNavigationPath);
      }
    } else if (target.closest('[data-action="cancel-leave"]')) {
      const modal = this.shadow.querySelector<ModalElement>('#unsaved-modal');
      if (modal) modal.close();
      this.pendingNavigationPath = null;
    }
  };

  private handleStepValidity = (event: Event): void => {
    const detail = (event as CustomEvent<{ isValid: boolean }>).detail;
    if (this.stepValidationState[this.currentStep] !== detail.isValid) {
      this.stepValidationState[this.currentStep] = detail.isValid;
      this.syncNavButtons();
      // No need to rerender the entire wizard, just update the nav buttons
    }
  };

  private handleStepData = (event: Event): void => {
    const detail = (event as CustomEvent<{ data: Partial<CampaignFormData> }>).detail;
    this.campaignData = { ...this.campaignData, ...detail.data };
  };

  private handleLaunch = async (): Promise<void> => {
    this.isLaunched = true;
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

  private handleEditStep = (event: Event): void => {
    const detail = (event as CustomEvent<{ stepIndex: number }>).detail;
    if (detail.stepIndex >= 0 && detail.stepIndex < WIZARD_STEPS.length) {
      this.currentStep = detail.stepIndex;
      this.rerender();
      this.syncStepComponent();
      this.syncNavButtons();
    }
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

  private renderStepper(): string {
    return `<div class="stepper">${WIZARD_STEPS.map((step, i) => {
      const cls = i === this.currentStep ? 'active' : i < this.currentStep ? 'completed' : '';
      const icon = i < this.currentStep ? '✓' : String(i + 1);
      return `
        <div class="stepper-item ${cls}">
          <div class="stepper-circle">${icon}</div>
          <div class="stepper-label">${step.label}</div>
        </div>
      `;
    }).join('')}</div>`;
  }

  protected renderTemplate(): string {
    const isLastStep = this.currentStep === STEP_TAGS.length - 1;
    const canAdvance = this.stepValidationState[this.currentStep] ?? false;
    const completedCount = this.stepValidationState.filter(Boolean).length;
    const totalSteps = WIZARD_STEPS.length;
    const progressPct = Math.round((completedCount / (totalSteps - 1)) * 100);
    return html`
      <div class="wizard-container">
        <div class="wizard-header">
          <h1 class="wizard-title">Create Campaign</h1>
          ${SafeHtmlString.trusted(this.renderStepper())}
        </div>
        <div class="wizard-body">
          <div class="step-panel">
            <div id="step-container"></div>
          </div>
        </div>
        <div class="wizard-footer">
          <span class="footer-left">Step ${this.currentStep + 1} of ${totalSteps}</span>
          <div class="footer-btns">
            <button class="nav-btn" data-action="prev" type="button" ${this.currentStep === 0 ? 'disabled' : ''}>← Back</button>
            ${!isLastStep
              ? SafeHtmlString.trusted(`<button class="nav-btn primary" data-action="next" type="button" ${canAdvance ? '' : 'disabled'}>Continue →</button>`)
              : SafeHtmlString.trusted('<button class="nav-btn primary" data-action="next" type="button" disabled>🚀 Launch Campaign</button>')
            }
          </div>
        </div>
        
        <vis-modal id="unsaved-modal">
          <div style="text-align: center;">
            <h2 style="margin-top: 0; color:#111827;">Discard Unsaved Changes?</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">You have unsaved changes in this campaign. Are you sure you want to leave?</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button class="nav-btn" data-action="cancel-leave" type="button">Stay</button>
              <button class="nav-btn" data-action="confirm-leave" type="button" style="background:#dc2626;color:white;border-color:#dc2626;">Discard &amp; Leave</button>
            </div>
          </div>
        </vis-modal>
      </div>
    `;
  }
}

ComponentRegistry.register('campaign-wizard', CampaignWizardElement);
export { CampaignWizardElement };