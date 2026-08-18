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
import { ModalElement } from '../../../../components/modal/ModalElement';
import '../../../../components/modal/ModalElement';

const STEP_TAGS = [
  'step-campaign-info',
  'step-ad-domain',
  'step-budget-targeting',
  'step-targeting',
  'step-bid-multiplier',
  'step-review',
] as const;

// ... styles remain ...

class CampaignWizardElement extends BaseComponent {
  private currentStep = 0;
  private campaignData: CampaignFormData = { ...INITIAL_CAMPAIGN_DATA };
  private stepValidationState: boolean[] = [false, false, false, false, false, true];
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
      this.currentStep = 5; // Jump to Review
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
      const icon = c.done ? '<span class="preview-check-icon">✓</span>' : '<span class="preview-pending-icon">○</span>';
      const cls = c.done ? 'preview-check' : 'preview-pending';
      return `<div class="preview-row ${cls}">${icon} <span>${c.label}</span></div>`;
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
        
        <vis-modal id="unsaved-modal">
          <div style="text-align: center;">
            <h2 style="margin-top: 0;">Discard Unsaved Changes?</h2>
            <p style="color: var(--color-text-muted); margin-bottom: var(--space-4);">You have unsaved changes in this campaign. Are you sure you want to leave?</p>
            <div style="display: flex; gap: var(--space-3); justify-content: center;">
              <button class="nav-btn" data-action="cancel-leave" type="button">Stay</button>
              <button class="nav-btn" data-action="confirm-leave" type="button" style="background: var(--color-danger); color: white; border-color: var(--color-danger);">Discard & Leave</button>
            </div>
          </div>
        </vis-modal>
      </div>
    `;
  }
}

ComponentRegistry.register('campaign-wizard', CampaignWizardElement);
export { CampaignWizardElement };