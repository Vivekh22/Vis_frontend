import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { navigate } from '../../../../utils/navigate';
import { creativeService } from '../../../../services';
import { CreativeFormData, INITIAL_CREATIVE_DATA, CREATIVE_WIZARD_STEPS, StepComponent } from './creative-wizard-types';

import './steps/StepCreativeBasic';
import './steps/StepCreativeAssets';
import './steps/StepCreativeAdDetails';
import './steps/StepCreativeTracking';
import './steps/StepCreativeReview';
import './CreativePreviewElement';

const STEP_TAGS = [
  'step-creative-basic',
  'step-creative-assets',
  'step-creative-ad-details',
  'step-creative-tracking',
  'step-creative-review'
];

const STYLES = `
  :host { display: block; min-height: 100%; font-family: var(--font-body); }
  .wizard-container { display: flex; flex-direction: column; min-height: 100%; max-width: 1400px; margin: 0 auto; padding: var(--space-4) 0; }

  /* Header */
  .wizard-header { margin-bottom: 32px; }
  .wizard-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 24px 0; }

  /* Stepper */
  .stepper { display: flex; align-items: flex-start; gap: 0; margin-bottom: 24px; max-width: 800px; margin-left: auto; margin-right: auto; }
  .stepper-item { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
  .stepper-item:not(:last-child)::after { content: ''; position: absolute; top: 16px; left: 50%; width: 100%; height: 2px; background: #e2e8f0; z-index: 0; }
  .stepper-item.completed:not(:last-child)::after { background: #3b66f5; }
  .stepper-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; border: 2px solid #e2e8f0; background: white; color: #94a3b8; position: relative; z-index: 1; }
  .stepper-item.active .stepper-circle { border-color: #3b66f5; background: #3b66f5; color: white; box-shadow: 0 0 0 4px rgba(59,102,245,0.15); }
  .stepper-item.completed .stepper-circle { border-color: #3b66f5; background: #3b66f5; color: white; }
  .stepper-label { font-size: 11px; font-weight: 500; color: #94a3b8; margin-top: 8px; text-align: center; white-space: nowrap; }
  .stepper-item.active .stepper-label { color: #3b66f5; font-weight: 700; }
  .stepper-item.completed .stepper-label { color: #374151; }

  /* Body - Split Layout */
  .wizard-body {
    display: flex;
    gap: var(--space-6);
    flex: 1;
    min-height: 600px;
  }
  .form-panel {
    flex: 3;
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid #eef0f4;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    overflow: hidden;
  }
  .form-content {
    flex: 1;
    padding: 32px;
    overflow-y: auto;
  }
  .preview-panel {
    flex: 2;
    min-width: 400px;
    position: sticky;
    top: var(--space-4);
    height: calc(100vh - 200px);
  }

  /* Footer */
  .wizard-footer { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; border-top: 1px solid #eef0f4; background: #f8fafc; }
  .footer-left { font-size: 12px; color: #94a3b8; }
  .footer-btns { display: flex; gap: 12px; }
  .nav-btn { padding: 10px 24px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #374151; transition: all 0.15s; }
  .nav-btn:hover:not(:disabled) { background: #f1f5f9; }
  .nav-btn.primary { background: #3b66f5; color: white; border-color: #3b66f5; }
  .nav-btn.primary:hover:not(:disabled) { background: #2d55e0; }
  .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
`;

class CreativeWizardElement extends BaseComponent {
  private currentStep = 0;
  private formData: CreativeFormData = { ...INITIAL_CREATIVE_DATA };
  private stepValidities: boolean[] = [false, false, false, true, true]; // step 4 & 5 default valid
  private isSubmitting = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('step-data-changed', this.handleStepDataChanged as EventListener);
    this.shadow.removeEventListener('step-validity-changed', this.handleStepValidityChanged as EventListener);
  }

  private handleStepDataChanged = (e: Event) => {
    // Data is mutated in place by steps, just sync the preview
    this.syncPreview();
  };

  private handleStepValidityChanged = (e: Event) => {
    const stepEl = this.shadow.querySelector<StepComponent>(STEP_TAGS[this.currentStep] as string);
    if (stepEl) {
      const oldVal = this.stepValidities[this.currentStep];
      const newVal = stepEl.isValid;
      
      if (oldVal !== newVal) {
        this.stepValidities[this.currentStep] = newVal;
        
        // Update button state directly to avoid full DOM replacement and focus loss
        const nextBtn = this.shadow.querySelector<HTMLButtonElement>('[data-action="next"], [data-action="submit"]');
        if (nextBtn) {
          nextBtn.disabled = !newVal || this.isSubmitting;
        }
      }
    }
  };

  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    
    if (target.closest('[data-action="next"]')) {
      if (this.currentStep < CREATIVE_WIZARD_STEPS.length - 1) {
        this.currentStep++;
        this.rerender();
        this.syncStepComponent();
        this.syncPreview();
      }
      return;
    }

    if (target.closest('[data-action="prev"]')) {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.rerender();
        this.syncStepComponent();
        this.syncPreview();
      }
      return;
    }

    if (target.closest('[data-action="submit"]')) {
      void this.submitCreative();
      return;
    }
  };

  private async submitCreative() {
    this.isSubmitting = true;
    this.rerender();
    this.syncStepComponent();
    this.syncPreview();

    try {
      // Fake delay
      await new Promise(r => setTimeout(r, 800));
      navigate('/client/creatives');
    } catch (err) {
      console.error('Submit failed', err);
      this.isSubmitting = false;
      this.rerender();
      this.syncStepComponent();
      this.syncPreview();
    }
  }

  private syncStepComponent() {
    const stepEl = this.shadow.querySelector<StepComponent>(STEP_TAGS[this.currentStep] as string);
    if (stepEl) {
      stepEl.data = this.formData;
    }
  }

  private syncPreview() {
    const previewEl = this.shadow.querySelector<any>('creative-preview');
    if (previewEl) {
      previewEl.data = this.formData;
    }
  }

  protected renderTemplate(): string {
    const isLastStep = this.currentStep === CREATIVE_WIZARD_STEPS.length - 1;
    const canProceed = this.stepValidities[this.currentStep];

    return html`
      <div class="wizard-container">
        <div class="wizard-header">
          <h1 class="wizard-title">Create New Creative</h1>
          <div class="stepper">
            ${SafeHtmlString.trusted(CREATIVE_WIZARD_STEPS.map((step, idx) => {
              let classes = 'stepper-item';
              if (idx === this.currentStep) classes += ' active';
              if (idx < this.currentStep) classes += ' completed';
              return `
                <div class="${classes}">
                  <div class="stepper-circle">${idx < this.currentStep ? '✓' : idx + 1}</div>
                  <div class="stepper-label">${step}</div>
                </div>
              `;
            }).join(''))}
          </div>
        </div>

        <div class="wizard-body">
          <div class="form-panel">
            <div class="form-content">
              ${SafeHtmlString.trusted(`<${STEP_TAGS[this.currentStep]}></${STEP_TAGS[this.currentStep]}>`)}
            </div>
            
            <div class="wizard-footer">
              <div class="footer-left">Step ${this.currentStep + 1} of ${CREATIVE_WIZARD_STEPS.length}</div>
              <div class="footer-btns">
                <button class="nav-btn" data-action="prev" ?disabled="${this.currentStep === 0 || this.isSubmitting}">Back</button>
                ${isLastStep 
                  ? SafeHtmlString.trusted(`<button class="nav-btn primary" data-action="submit" ${(!canProceed || this.isSubmitting) ? 'disabled' : ''}>${this.isSubmitting ? 'Saving...' : 'Submit Creative'}</button>`)
                  : SafeHtmlString.trusted(`<button class="nav-btn primary" data-action="next" ${!canProceed ? 'disabled' : ''}>Next Step</button>`)
                }
              </div>
            </div>
          </div>
          
          <div class="preview-panel">
            <creative-preview></creative-preview>
          </div>
        </div>
      </div>
    `;
  }
  
  protected rerender(): void {
    super.rerender();
    this.syncStepComponent();
    this.syncPreview();
  }

  protected onMount(): void {
    super.onMount();
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('step-data-changed', this.handleStepDataChanged as EventListener);
    this.shadow.addEventListener('step-validity-changed', this.handleStepValidityChanged as EventListener);
    this.syncStepComponent();
    this.syncPreview();
  }
}

ComponentRegistry.register('creative-wizard', CreativeWizardElement);
export { CreativeWizardElement };
