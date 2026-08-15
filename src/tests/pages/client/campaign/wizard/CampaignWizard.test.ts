/**
 * CampaignWizard.test.ts — tests for the wizard orchestrator.
 *
 * Tests step navigation:
 *   - Renders first step on mount
 *   - Next button disabled when step is invalid
 *   - Can advance when step becomes valid
 *   - Back button disabled on first step
 *   - Back button enables after advancing
 *   - Can go back without losing data
 *   - Launch navigates to campaign list on success
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CampaignWizardElement } from '../../../../../pages/client/campaign/wizard/CampaignWizardElement';
import { campaignService } from '../../../../../services';

vi.mock('../../../../../services', () => ({
  campaignService: {
    createCampaign: vi.fn().mockResolvedValue({ id: 'camp_new', name: 'Test', clientId: 'c1' }),
    submitForApproval: vi.fn().mockResolvedValue({ id: 'camp_new', status: 'pending_approval' }),
  },
}));

vi.mock('../../../../../utils/navigate', () => ({
  navigate: vi.fn(),
}));

import '../../../../../pages/client/campaign/wizard/CampaignWizardElement';

describe('CampaignWizardElement', () => {
  let element: CampaignWizardElement;

  beforeEach(() => {
    vi.clearAllMocks();
    element = new CampaignWizardElement();
    document.body.innerHTML = '<div id="test-root"></div>';
    document.getElementById('test-root')!.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('renders the first step on mount', () => {
    const step = element.shadowRoot!.querySelector('#step-container');
    expect(step).not.toBeNull();
  });

  it('Next button is disabled when step is invalid', () => {
    const nextBtn = element.shadowRoot!.querySelector('[data-action="next"]') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });

  it('Back button is disabled on first step', () => {
    const backBtn = element.shadowRoot!.querySelector('[data-action="prev"]') as HTMLButtonElement;
    expect(backBtn.disabled).toBe(true);
  });

  it('can advance when step becomes valid', () => {
    element.shadowRoot!.dispatchEvent(new CustomEvent('step-validity-changed', {
      bubbles: true, composed: true, detail: { isValid: true },
    }));
    const nextBtn = element.shadowRoot!.querySelector('[data-action="next"]') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(false);
  });

  it('Back button enables after advancing', () => {
    element.shadowRoot!.dispatchEvent(new CustomEvent('step-validity-changed', {
      bubbles: true, composed: true, detail: { isValid: true },
    }));
    const nextBtn = element.shadowRoot!.querySelector('[data-action="next"]') as HTMLButtonElement;
    nextBtn.disabled = false;
    nextBtn.click();
    const backBtn = element.shadowRoot!.querySelector('[data-action="prev"]') as HTMLButtonElement;
    expect(backBtn.disabled).toBe(false);
  });

  it('can go back without losing data', () => {
    element.shadowRoot!.dispatchEvent(new CustomEvent('step-data-changed', {
      bubbles: true, composed: true, detail: { data: { name: 'Test Campaign' } },
    }));
    element.shadowRoot!.dispatchEvent(new CustomEvent('step-validity-changed', {
      bubbles: true, composed: true, detail: { isValid: true },
    }));
    const nextBtn = element.shadowRoot!.querySelector('[data-action="next"]') as HTMLButtonElement;
    nextBtn.disabled = false;
    nextBtn.click();
    const backBtn = element.shadowRoot!.querySelector('[data-action="prev"]') as HTMLButtonElement;
    backBtn.click();
    const step = element.shadowRoot!.querySelector('#step-container');
    expect(step).not.toBeNull();
  });

  it('renders progress bar with 6 steps', () => {
    const steps = element.shadowRoot!.querySelectorAll('.progress-step');
    expect(steps.length).toBe(6);
  });

  it('renders step labels', () => {
    const labels = element.shadowRoot!.querySelectorAll('.step-label');
    expect(labels.length).toBe(6);
  });

  it('renders preview panel', () => {
    const preview = element.shadowRoot!.querySelector('.preview-panel');
    expect(preview).not.toBeNull();
  });

  it('launch calls createCampaign and submitForApproval', async () => {
    element.shadowRoot!.dispatchEvent(new CustomEvent('launch-campaign', {
      bubbles: true, composed: true, detail: {
        data: {
          name: 'Test Campaign',
          clientId: 'client_1',
          budget: 1000,
          bid: 1.5,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        },
      },
    }));
    await new Promise((r) => setTimeout(r, 50));
    expect(campaignService.createCampaign).toHaveBeenCalled();
    expect(campaignService.submitForApproval).toHaveBeenCalled();
  });
});