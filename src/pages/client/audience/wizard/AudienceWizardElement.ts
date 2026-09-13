/**
 * AudienceWizardElement.ts — pages/client/audience/wizard/
 *
 * Multi-step modal wizard for creating an Audience.
 * Step 1: Audience Type & Business
 * Step 2: Source
 * Step 3: Audience Details (Rules)
 * Step 4: Review & Create
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../../platform/rendering/SafeHtml';
import { audienceService } from '../../../../services';
import type { AudienceType, AudienceRule, AudienceDataSourceConfig } from '../../../../core/entities/AudienceList';
import { AudienceDataSource } from '../../../../core/enums/AudienceDataSource';

const STYLES = `
  :host {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    font-family: var(--font-body);
  }
  .modal {
    background: white;
    width: 900px;
    height: 80vh;
    max-height: 800px;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
  .modal-header {
    padding: 24px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .modal-title-group { display: flex; flex-direction: column; gap: 4px; }
  .modal-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
  .modal-subtitle { font-size: 14px; color: #64748b; margin: 0; }
  .close-btn { background: transparent; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; }
  .close-btn:hover { background: #f1f5f9; color: #0f172a; }
  .stepper { display: flex; align-items: center; justify-content: space-between; padding: 0 40px; margin: 24px 0; }
  .step { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; color: #94a3b8; }
  .step.active { color: #2563eb; }
  .step.completed { color: #0f172a; }
  .step-number { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #94a3b8; font-size: 12px; }
  .step.active .step-number { background: #2563eb; color: white; }
  .step.completed .step-number { background: #3b82f6; color: white; }
  .step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 16px; }
  .step-line.active { background: #3b82f6; }
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 24px 24px;
    display: flex;
    gap: 24px;
  }
  .main-panel { flex: 2; display: flex; flex-direction: column; gap: 24px; }
  .side-panel { flex: 1; display: flex; flex-direction: column; gap: 16px; }
  .section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
  .section-desc { font-size: 13px; color: #64748b; margin: 0 0 16px 0; }
  .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .selectable-card { border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; transition: all 0.2s; position: relative; }
  .selectable-card:hover { border-color: #cbd5e1; background: #f8fafc; }
  .selectable-card.selected { border-color: #3b82f6; background: #eff6ff; }
  .card-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .card-icon.blue { background: #dbeafe; color: #2563eb; }
  .card-icon.purple { background: #f3e8ff; color: #9333ea; }
  .card-icon.green { background: #dcfce7; color: #16a34a; }
  .card-title { font-weight: 700; font-size: 14px; color: #0f172a; margin: 0; }
  .card-desc { font-size: 12px; color: #64748b; margin: 0; line-height: 1.4; }
  .check-circle { position: absolute; top: 12px; right: 12px; width: 16px; height: 16px; border-radius: 50%; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; color: white; }
  .selectable-card.selected .check-circle { background: #2563eb; border-color: #2563eb; }
  .check-circle svg { width: 10px; height: 10px; opacity: 0; }
  .selectable-card.selected .check-circle svg { opacity: 1; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-label { font-size: 13px; font-weight: 600; color: #0f172a; }
  .form-select, .form-input, .form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; background: white; font-family: var(--font-body); }
  .form-textarea { resize: vertical; min-height: 80px; }
  .form-select:focus, .form-input:focus, .form-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
  .info-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
  .info-panel-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: #0f172a; margin-bottom: 12px; }
  .info-panel-title svg { color: #3b82f6; }
  .info-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  .info-list li { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #334155; line-height: 1.4; }
  .info-list li svg.check { color: #22c55e; flex-shrink: 0; margin-top: 2px; }
  .quote-box { margin-top: auto; padding-top: 24px; text-align: center; font-style: italic; color: #64748b; font-size: 13px; }
  .rules-container { display: flex; flex-direction: column; gap: 16px; }
  .rule-block { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
  .rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .rule-title-wrapper { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: #0f172a; }
  .rule-title-wrapper svg { color: #3b82f6; }
  .rule-remove { font-size: 13px; color: #ef4444; background: none; border: none; cursor: pointer; font-weight: 500; }
  .rule-content { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .add-condition-btn { align-self: flex-start; padding: 8px 12px; background: #f1f5f9; color: #3b82f6; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .add-condition-btn:hover { background: #e2e8f0; }
  .estimate-panel { display: flex; flex-direction: column; gap: 16px; transition: opacity 0.3s; }
  .estimate-number { font-size: 32px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0; line-height: 1; }
  .estimate-sub { font-size: 12px; color: #64748b; margin: 0; }
  .reach-range { font-size: 16px; font-weight: 700; color: #0f172a; margin: 12px 0 4px 0; }
  .reach-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 8px; display: flex; }
  .reach-fill { height: 100%; background: #22c55e; transition: width 0.5s ease-out, background-color 0.5s; }
  .reach-fill.broad { background: #f59e0b; }
  .reach-fill.narrow { background: #ef4444; }
  .reach-labels { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 4px; }
  .review-section { display: flex; flex-direction: column; gap: 1px; background: #e2e8f0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .review-row { display: grid; grid-template-columns: 180px 1fr; background: white; padding: 16px; gap: 16px; align-items: flex-start; }
  .review-label { font-size: 13px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 8px; }
  .review-value { font-size: 14px; color: #0f172a; font-weight: 500; }
  .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .edit-link { color: #3b82f6; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; background: none; border: none; padding: 0;}
  .modal-footer {
    padding: 20px 24px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    background: #f8fafc;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }
  .btn { padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-outline { background: white; border: 1px solid #cbd5e1; color: #475569; }
  .btn-outline:hover { background: #f1f5f9; }
  .btn-primary { background: #3b82f6; border: 1px solid #3b82f6; color: white; }
  .btn-primary:hover { background: #2563eb; }
  .btn-primary:disabled { background: #94a3b8; border-color: #94a3b8; cursor: not-allowed; }
`;

class AudienceWizardElement extends BaseComponent {
  private step = 1;
  private isProcessing = false;

  private audienceType: AudienceType = 'custom';
  private businessProduct = 'All V4Connectt Services';
  
  private dataSourceType: string = AudienceDataSource.WebsiteActivity;
  
  private configWebsiteCondition = 'All website visitors';
  private configRetention = '30';
  private configAppAction = 'App Installed';
  private configProductCategory = 'All';
  private configCsvData = '';
  
  private rules: AudienceRule[] = [];
  
  private audienceName = 'New Audience';
  private description = '';
  
  private baseSize = 5000000;
  private estimatedSize = 5000000;
  private reachPercent = 100;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
    this.recalculateEstimate();
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    this.shadow.addEventListener('input', this.handleInput);
    this.shadow.addEventListener('change', this.handleChange);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    this.shadow.removeEventListener('input', this.handleInput);
    this.shadow.removeEventListener('change', this.handleChange);
  }
  
  private recalculateEstimate(): void {
    let size = this.baseSize;
    if (this.dataSourceType === AudienceDataSource.CustomerList) size *= 0.05;
    else if (this.dataSourceType === AudienceDataSource.AppActivity) size *= 0.3;
    else if (this.dataSourceType === AudienceDataSource.WebsiteActivity) size *= 0.5;
    
    this.rules.forEach(rule => {
      if (rule.type === 'location') size *= 0.2;
      else if (rule.type === 'interest') size *= 0.4;
      else if (rule.type === 'behavior') size *= 0.6;
    });
    
    if (this.audienceType === 'lookalike') {
      size *= 10;
    }
    
    this.estimatedSize = Math.max(1000, Math.floor(size));
    this.reachPercent = Math.min(100, (this.estimatedSize / (this.baseSize * 10)) * 100);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    
    if (target.closest('.close-btn')) {
      this.closeModal();
      return;
    }
    
    if (target.closest('[data-action="next"]')) {
      if (this.step < 4) {
        this.step++;
        if (this.step === 4 && this.audienceName === 'New Audience') {
            this.audienceName = `${this.audienceType.charAt(0).toUpperCase() + this.audienceType.slice(1)} - ${(this.dataSourceType.split('_')[0] || '').toUpperCase()}`;
        }
        this.rerender();
      }
      return;
    }
    
    if (target.closest('[data-action="back"]')) {
      if (this.step > 1) {
        this.step--;
        this.rerender();
      }
      return;
    }

    if (target.closest('[data-action="create"]')) {
      void this.createAudience();
      return;
    }

    const typeCard = target.closest('[data-type-select]');
    if (typeCard) {
      this.audienceType = typeCard.getAttribute('data-type-select') as AudienceType;
      this.recalculateEstimate();
      this.rerender();
      return;
    }

    const sourceCard = target.closest('[data-source-select]');
    if (sourceCard) {
      this.dataSourceType = sourceCard.getAttribute('data-source-select')!;
      this.recalculateEstimate();
      this.rerender();
      return;
    }
    
    const editBtn = target.closest('[data-edit-step]');
    if (editBtn) {
      this.step = parseInt(editBtn.getAttribute('data-edit-step')!, 10);
      this.rerender();
      return;
    }
    
    const addConditionBtn = target.closest('[data-action="add-condition"]');
    if (addConditionBtn) {
      const type = addConditionBtn.getAttribute('data-condition-type') as any;
      if (type === 'location') this.rules.push({ type: 'location', action: 'include', details: { country: 'India' } });
      else if (type === 'interest') this.rules.push({ type: 'interest', action: 'include', details: { category: 'Agriculture' } });
      else if (type === 'behavior') this.rules.push({ type: 'behavior', action: 'include', details: { action: 'Visited site', period: 'last 30 days' } });
      
      this.recalculateEstimate();
      this.rerender();
      return;
    }
    
    const removeBtn = target.closest('[data-action="remove-rule"]');
    if (removeBtn) {
      const idx = parseInt(removeBtn.getAttribute('data-index')!, 10);
      this.rules.splice(idx, 1);
      this.recalculateEstimate();
      this.rerender();
      return;
    }
  };

  private handleInput = (event: Event): void => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (target.id === 'aud-name') {
      this.audienceName = target.value;
    } else if (target.id === 'aud-desc') {
      this.description = target.value;
    } else if (target.id === 'retention-days') {
      this.configRetention = target.value;
    } else if (target.id === 'csv-data') {
      this.configCsvData = target.value;
    }
  };

  private handleChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    if (target.id === 'business-select') {
      this.businessProduct = target.value;
    } else if (target.id === 'website-condition') {
      this.configWebsiteCondition = target.value;
    } else if (target.id === 'app-action') {
      this.configAppAction = target.value;
    } else if (target.id === 'product-category') {
      this.configProductCategory = target.value;
    }
    
    if (target.classList.contains('rule-select')) {
       const idx = parseInt(target.getAttribute('data-index')!, 10);
       const field = target.getAttribute('data-field')!;
       if (this.rules[idx] && this.rules[idx].details) {
           (this.rules[idx].details as any)[field] = target.value;
           this.recalculateEstimate();
           this.rerender();
       }
    }
  };

  private async createAudience(): Promise<void> {
    this.isProcessing = true;
    this.rerender();
    
    try {
      await audienceService.createAudience({
        name: this.audienceName,
        description: this.description,
        audienceType: this.audienceType,
        businessProduct: this.businessProduct,
        dataSource: {
          type: this.dataSourceType as any,
          validated: true,
          csvData: this.dataSourceType === AudienceDataSource.CustomerList ? this.configCsvData : undefined
        },
        rules: this.rules
      });
      
      this.shadow.dispatchEvent(new CustomEvent('audience-created', { bubbles: true, composed: true }));
    } catch (error) {
      console.error('Failed to create audience', error);
      this.isProcessing = false;
      this.rerender();
    }
  }

  private closeModal(): void {
    this.shadow.dispatchEvent(new CustomEvent('audience-created', { bubbles: true, composed: true }));
  }

  private getCheckSvg(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  }
  
  private formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  private renderStep1(): string {
    return html`
      <div class="main-panel">
        <div>
          <h3 class="section-title">Choose Audience Type</h3>
          <p class="section-desc">Select the type of audience you want to create.</p>
          <div class="card-grid">
            <div class="selectable-card ${this.audienceType === 'custom' ? 'selected' : ''}" data-type-select="custom">
              <div class="check-circle">${SafeHtmlString.trusted(this.getCheckSvg())}</div>
              <div class="card-icon blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
              <div>
                <h4 class="card-title">Custom Audience</h4>
                <p class="card-desc">Reach people who have already interacted with your business.</p>
              </div>
            </div>
            <div class="selectable-card ${this.audienceType === 'lookalike' ? 'selected' : ''}" data-type-select="lookalike">
              <div class="check-circle">${SafeHtmlString.trusted(this.getCheckSvg())}</div>
              <div class="card-icon purple"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg></div>
              <div>
                <h4 class="card-title">Lookalike Audience</h4>
                <p class="card-desc">Find new people who are similar to your existing audiences.</p>
              </div>
            </div>
            <div class="selectable-card ${this.audienceType === 'saved' ? 'selected' : ''}" data-type-select="saved">
              <div class="check-circle">${SafeHtmlString.trusted(this.getCheckSvg())}</div>
              <div class="card-icon green"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></div>
              <div>
                <h4 class="card-title">Saved Audience</h4>
                <p class="card-desc">Save your targeting criteria to reuse in future campaigns.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
      <div class="side-panel">
        <div class="info-panel">
          <div class="info-panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            What you can do
          </div>
          <ul class="info-list">
            <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>Target the right people</li>
            <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>Use your first-party data</li>
            <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>Combine multiple filters</li>
            <li><svg class="check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>See audience size estimate</li>
          </ul>
        </div>
      </div>
    `;
  }

  private renderStep2(): string {
    const isWebsite = this.dataSourceType === AudienceDataSource.WebsiteActivity;
    const isApp = this.dataSourceType === AudienceDataSource.AppActivity;
    const isProduct = this.dataSourceType === AudienceDataSource.ProductServiceActivity;
    const isCustomer = this.dataSourceType === AudienceDataSource.CustomerList;
    const isLead = this.dataSourceType === AudienceDataSource.LeadList;
    
    return html`
      <div class="main-panel">
        <div>
          <h3 class="section-title">Select Audience Source</h3>
          <p class="section-desc">Choose where to find people from.</p>
          
          <h4 class="form-label" style="margin-top:20px">V4Connectt Sources</h4>
          <div class="card-grid" style="margin-bottom: 20px;">
            <div class="selectable-card ${isWebsite ? 'selected' : ''}" data-source-select="${AudienceDataSource.WebsiteActivity}" style="padding: 12px; gap: 8px;">
              <div class="check-circle">${SafeHtmlString.trusted(this.getCheckSvg())}</div>
              <div class="card-icon blue" style="width:32px; height:32px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg></div>
              <h4 class="card-title" style="font-size:13px">Website Activity</h4>
            </div>
            <div class="selectable-card ${isApp ? 'selected' : ''}" data-source-select="${AudienceDataSource.AppActivity}" style="padding: 12px; gap: 8px;">
              <div class="check-circle">${SafeHtmlString.trusted(this.getCheckSvg())}</div>
              <div class="card-icon green" style="width:32px; height:32px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect></svg></div>
              <h4 class="card-title" style="font-size:13px">App Activity</h4>
            </div>
            <div class="selectable-card ${isProduct ? 'selected' : ''}" data-source-select="${AudienceDataSource.ProductServiceActivity}" style="padding: 12px; gap: 8px;">
              <div class="check-circle">${SafeHtmlString.trusted(this.getCheckSvg())}</div>
              <div class="card-icon purple" style="width:32px; height:32px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path></svg></div>
              <h4 class="card-title" style="font-size:13px">Product/Service</h4>
            </div>
          </div>
          
          <h4 class="form-label">Customer Data</h4>
          <div class="card-grid" style="margin-bottom: 20px;">
            <div class="selectable-card ${isCustomer ? 'selected' : ''}" data-source-select="${AudienceDataSource.CustomerList}" style="padding: 12px; gap: 8px;">
              <div class="check-circle">${SafeHtmlString.trusted(this.getCheckSvg())}</div>
              <div class="card-icon blue" style="width:32px; height:32px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg></div>
              <h4 class="card-title" style="font-size:13px">Customer List</h4>
            </div>
            <div class="selectable-card ${isLead ? 'selected' : ''}" data-source-select="${AudienceDataSource.LeadList}" style="padding: 12px; gap: 8px;">
              <div class="check-circle">${SafeHtmlString.trusted(this.getCheckSvg())}</div>
              <div class="card-icon blue" style="width:32px; height:32px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div>
              <h4 class="card-title" style="font-size:13px">Lead List</h4>
            </div>
          </div>
        </div>
        
        ${isWebsite ? SafeHtmlString.trusted(html`
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display:flex; flex-direction:column; gap:16px;">
          <h4 class="form-label" style="margin:0">Configure Website Activity</h4>
          <div class="form-group">
            <label class="form-label">Include people who meet the following criteria:</label>
            <select class="form-select" id="website-condition">
              <option value="All website visitors" ${this.configWebsiteCondition === 'All website visitors' ? 'selected':''}>All website visitors</option>
              <option value="Specific pages" ${this.configWebsiteCondition === 'Specific pages' ? 'selected':''}>People who visited specific pages</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Retention (Days)</label>
            <input type="number" id="retention-days" class="form-input" value="${this.configRetention}">
          </div>
        </div>
        `) : ''}

        ${isApp ? SafeHtmlString.trusted(html`
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display:flex; flex-direction:column; gap:16px;">
          <h4 class="form-label" style="margin:0">Configure App Activity</h4>
          <div class="form-group">
            <label class="form-label">Target App Events:</label>
            <select class="form-select" id="app-action">
              <option value="App Installed" ${this.configAppAction === 'App Installed' ? 'selected':''}>App Installed</option>
              <option value="App Opened" ${this.configAppAction === 'App Opened' ? 'selected':''}>App Opened</option>
            </select>
          </div>
        </div>
        `) : ''}

        ${isProduct ? SafeHtmlString.trusted(html`
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display:flex; flex-direction:column; gap:16px;">
          <h4 class="form-label" style="margin:0">Configure Product Activity</h4>
          <div class="form-group">
            <label class="form-label">Product Category:</label>
            <select class="form-select" id="product-category">
              <option value="All" ${this.configProductCategory === 'All' ? 'selected':''}>All Categories</option>
              <option value="Livestock" ${this.configProductCategory === 'Livestock' ? 'selected':''}>Livestock</option>
              <option value="Logistics" ${this.configProductCategory === 'Logistics' ? 'selected':''}>Logistics</option>
            </select>
          </div>
        </div>
        `) : ''}

        ${isCustomer ? SafeHtmlString.trusted(html`
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display:flex; flex-direction:column; gap:16px;">
          <h4 class="form-label" style="margin:0">Upload Customer List</h4>
          <div class="form-group">
            <textarea class="form-textarea" id="csv-data" placeholder="email,name">${this.configCsvData}</textarea>
          </div>
        </div>
        `) : ''}
      </div>

      <div class="side-panel">
        <div class="info-panel">
          <div class="info-panel-title">Selected Source</div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div class="card-icon blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg></div>
            <div>
              <div style="font-weight:600; font-size:14px;">${this.dataSourceType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderStep3(): string {
    return html`
      <div class="main-panel">
        <div>
          <h3 class="section-title">Define Your Audience</h3>
          <p class="section-desc">Add conditions to include or exclude people. You can combine multiple filters.</p>
          
          <div style="display:flex; gap:12px; margin-bottom: 24px;">
            <button class="btn btn-primary" data-action="add-condition" data-condition-type="location" style="flex:1; justify-content:center; padding: 8px;">
              + Location
            </button>
            <button class="btn btn-primary" data-action="add-condition" data-condition-type="interest" style="flex:1; justify-content:center; padding: 8px;">
              + Interest
            </button>
            <button class="btn btn-primary" data-action="add-condition" data-condition-type="behavior" style="flex:1; justify-content:center; padding: 8px;">
              + Behavior
            </button>
          </div>
          
          <div class="rules-container">
            ${this.rules.length === 0 ? SafeHtmlString.trusted('<div style="padding: 40px; text-align: center; color: #64748b; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">No rules added yet.</div>') : ''}
            
            ${SafeHtmlString.trusted(this.rules.map((rule, idx) => {
              if (rule.type === 'location') {
                return `
                  <div class="rule-block">
                    <div class="rule-header">
                      <div class="rule-title-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Location</div>
                      <button class="rule-remove" data-action="remove-rule" data-index="${idx}">Remove</button>
                    </div>
                    <div class="rule-content">
                      <select class="form-select rule-select" style="width:140px" data-index="${idx}" data-field="country">
                        <option value="India" ${rule.details.country === 'India' ? 'selected':''}>India</option>
                        <option value="US" ${rule.details.country === 'US' ? 'selected':''}>US</option>
                      </select>
                      <select class="form-select rule-select" style="width:140px" data-index="${idx}" data-field="state">
                        <option value="Karnataka" ${rule.details.state === 'Karnataka' ? 'selected':''}>Karnataka</option>
                        <option value="Maharashtra" ${rule.details.state === 'Maharashtra' ? 'selected':''}>Maharashtra</option>
                        <option value="All" ${!rule.details.state ? 'selected':''}>All States</option>
                      </select>
                    </div>
                  </div>
                `;
              }
              if (rule.type === 'interest') {
                return `
                  <div class="rule-block">
                    <div class="rule-header">
                      <div class="rule-title-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> Interest</div>
                      <button class="rule-remove" data-action="remove-rule" data-index="${idx}">Remove</button>
                    </div>
                    <div class="rule-content">
                      <select class="form-select rule-select" style="width:140px" data-index="${idx}" data-field="category">
                        <option value="Agriculture" ${rule.details.category === 'Agriculture' ? 'selected':''}>Agriculture</option>
                        <option value="Livestock" ${rule.details.category === 'Livestock' ? 'selected':''}>Livestock</option>
                        <option value="Logistics" ${rule.details.category === 'Logistics' ? 'selected':''}>Logistics</option>
                      </select>
                    </div>
                  </div>
                `;
              }
              if (rule.type === 'behavior') {
                return `
                  <div class="rule-block">
                    <div class="rule-header">
                      <div class="rule-title-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect></svg> Behavior</div>
                      <button class="rule-remove" data-action="remove-rule" data-index="${idx}">Remove</button>
                    </div>
                    <div class="rule-content">
                      <select class="form-select rule-select" style="width:200px" data-index="${idx}" data-field="action">
                        <option value="Visited site" ${rule.details.action === 'Visited site' ? 'selected':''}>Visited site</option>
                        <option value="Clicked Ad" ${rule.details.action === 'Clicked Ad' ? 'selected':''}>Clicked Ad</option>
                      </select>
                      <span style="font-size:13px; color:#64748b;">in last 30 days</span>
                    </div>
                  </div>
                `;
              }
              return '';
            }).join(''))}
          </div>
        </div>
      </div>

      <div class="side-panel">
        <div class="estimate-panel">
          <div>
            <div class="info-panel-title" style="margin-bottom:4px;">Audience Estimate</div>
            <div class="estimate-number">${this.formatNumber(this.estimatedSize)}</div>
            <p class="estimate-sub">Estimated audience size</p>
          </div>
          
          <div>
            <div class="reach-range">${this.formatNumber(Math.floor(this.estimatedSize * 0.8))} - ${this.formatNumber(Math.floor(this.estimatedSize * 1.2))}</div>
            <p class="estimate-sub">Potential reach</p>
            <div class="reach-bar">
              <div class="reach-fill ${this.reachPercent > 60 ? 'broad' : (this.reachPercent < 20 ? 'narrow' : '')}" style="width: ${this.reachPercent}%"></div>
            </div>
            <div class="reach-labels">
              <span>Specific</span>
              <span>Broad</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderStep4(): string {
    return html`
      <div class="main-panel" style="flex:2.5">
        <div>
          <div class="review-header">
            <div>
              <h3 class="section-title">Review Your Audience</h3>
              <p class="section-desc">Please review the details before creating your audience.</p>
            </div>
          </div>
          
          <div class="form-group" style="margin-bottom:24px;">
            <label class="form-label">Audience Name</label>
            <input type="text" id="aud-name" class="form-input" value="${this.audienceName}">
          </div>
          <div class="form-group" style="margin-bottom:24px;">
            <label class="form-label">Description (Optional)</label>
            <textarea id="aud-desc" class="form-textarea">${this.description}</textarea>
          </div>
          
          <div class="review-section">
            <div class="review-row">
              <div class="review-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> Type</div>
              <div class="review-value" style="display:flex; justify-content:space-between">
                <span style="text-transform: capitalize;">${this.audienceType} Audience</span>
                <button class="edit-link" data-edit-step="1">Edit</button>
              </div>
            </div>

            <div class="review-row">
              <div class="review-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg> Source</div>
              <div class="review-value" style="display:flex; justify-content:space-between">
                <span>
                  <div>${this.dataSourceType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                </span>
                <button class="edit-link" data-edit-step="2">Edit</button>
              </div>
            </div>
            
            ${this.rules.length > 0 ? SafeHtmlString.trusted(html`
            <div class="review-row">
              <div class="review-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path></svg> Rules</div>
              <div class="review-value" style="display:flex; justify-content:space-between">
                <span>${this.rules.length} conditions applied</span>
                <button class="edit-link" data-edit-step="3">Edit</button>
              </div>
            </div>
            `) : ''}
          </div>
        </div>
      </div>

      <div class="side-panel" style="flex:1">
        <div class="estimate-panel">
          <div>
            <div class="info-panel-title" style="margin-bottom:4px;">Audience Estimate</div>
            <div class="estimate-number">${this.formatNumber(this.estimatedSize)}</div>
            <p class="estimate-sub">Estimated audience size</p>
          </div>
        </div>
      </div>
    `;
  }

  protected renderTemplate(): string {
    return html`
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title-group">
            <h2 class="modal-title">Create Audience</h2>
            <p class="modal-subtitle">Define your audience to reach the right people across the V4Connectt ecosystem.</p>
          </div>
          <button class="close-btn"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>

        <div class="stepper">
          <div class="step ${this.step >= 1 ? (this.step > 1 ? 'completed' : 'active') : ''}">
            <div class="step-number">${this.step > 1 ? SafeHtmlString.trusted(this.getCheckSvg()) : '1'}</div>
            Audience Type
          </div>
          <div class="step-line ${this.step > 1 ? 'active' : ''}"></div>
          
          <div class="step ${this.step >= 2 ? (this.step > 2 ? 'completed' : 'active') : ''}">
            <div class="step-number">${this.step > 2 ? SafeHtmlString.trusted(this.getCheckSvg()) : '2'}</div>
            Source
          </div>
          <div class="step-line ${this.step > 2 ? 'active' : ''}"></div>
          
          <div class="step ${this.step >= 3 ? (this.step > 3 ? 'completed' : 'active') : ''}">
            <div class="step-number">${this.step > 3 ? SafeHtmlString.trusted(this.getCheckSvg()) : '3'}</div>
            Audience Details
          </div>
          <div class="step-line ${this.step > 3 ? 'active' : ''}"></div>
          
          <div class="step ${this.step >= 4 ? 'active' : ''}">
            <div class="step-number">4</div>
            Review & Create
          </div>
        </div>

        <div class="modal-body">
          ${this.step === 1 ? SafeHtmlString.trusted(this.renderStep1()) : ''}
          ${this.step === 2 ? SafeHtmlString.trusted(this.renderStep2()) : ''}
          ${this.step === 3 ? SafeHtmlString.trusted(this.renderStep3()) : ''}
          ${this.step === 4 ? SafeHtmlString.trusted(this.renderStep4()) : ''}
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" data-action="back" style="visibility: ${this.step > 1 ? 'visible' : 'hidden'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back
          </button>
          
          ${this.step < 4 ? SafeHtmlString.trusted(html`
            <button class="btn btn-primary" data-action="next">
              Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          `) : SafeHtmlString.trusted(html`
            <button class="btn btn-primary" data-action="create" ?disabled="${this.isProcessing}">
              ${this.isProcessing ? 'Processing...' : 'Create Audience'}
            </button>
          `)}
        </div>
      </div>
    `;
  }
}

ComponentRegistry.register('audience-wizard', AudienceWizardElement);
export { AudienceWizardElement };
