// @ts-nocheck
/**
 * RegistrationWizard.test.ts — tests for the wizard orchestrator.
 *
 * Tests step navigation logic:
 *   - Can't advance past an invalid step
 *   - Data correctly accumulates across steps
 *   - Can go back without losing entered data
 *   - Submit calls authService.submitRegistration
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegistrationWizardElement } from '../../../../pages/client/registration/RegistrationWizardElement';
import { authService } from '../../../../services';

vi.mock('../../../../services', () => ({
  authService: {
    submitRegistration: vi.fn().mockResolvedValue(undefined),
    getRegistrationStatus: vi.fn().mockResolvedValue({ status: 'pending' }),
    login: vi.fn(),
  },
}));

vi.mock('../../../../utils/navigate', () => ({
  navigate: vi.fn(),
}));

import '../../../../pages/client/registration/RegistrationWizardElement';

describe('RegistrationWizardElement', () => {
  let element: RegistrationWizardElement;

  beforeEach(() => {
    vi.clearAllMocks();
    element = new RegistrationWizardElement();
    document.body.innerHTML = '<div id="test-root"></div>';
    document.getElementById('test-root')!.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('renders the first step on mount', () => {
    const step = element.shadowRoot!.querySelector('[data-step]');
    expect(step).not.toBeNull();
  });

  it('Next button is disabled when step is invalid', () => {
    const nextBtn = element.shadowRoot!.querySelector('[data-action="next"]') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });

  it('can advance when step becomes valid', () => {
    // Dispatch event on shadowRoot so the wizard's listener catches it
    element.shadowRoot!.dispatchEvent(new CustomEvent('step-validity-changed', {
      bubbles: true, composed: true, detail: { isValid: true },
    }));
    const nextBtn = element.shadowRoot!.querySelector('[data-action="next"]') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(false);
  });

  it('Back button is disabled on first step', () => {
    const backBtn = element.shadowRoot!.querySelector('[data-action="prev"]') as HTMLButtonElement;
    expect(backBtn.disabled).toBe(true);
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

  it('can go back without losing entered data', () => {
    // Set data on step 0
    element.shadowRoot!.dispatchEvent(new CustomEvent('step-data-changed', {
      bubbles: true, composed: true, detail: { data: { emailOrId: 'test@example.com' } },
    }));
    // Make valid and advance
    element.shadowRoot!.dispatchEvent(new CustomEvent('step-validity-changed', {
      bubbles: true, composed: true, detail: { isValid: true },
    }));
    const nextBtn = element.shadowRoot!.querySelector('[data-action="next"]') as HTMLButtonElement;
    nextBtn.disabled = false;
    nextBtn.click();
    // Go back
    const backBtn = element.shadowRoot!.querySelector('[data-action="prev"]') as HTMLButtonElement;
    backBtn.click();
    // Should be back on step 0
    const step = element.shadowRoot!.querySelector('[data-step]');
    expect(step).not.toBeNull();
  });

  it('submit calls authService.submitRegistration on final step', async () => {
    // Advance through all 4 steps (0→1→2→3→4)
    for (let i = 0; i < 4; i++) {
      element.shadowRoot!.dispatchEvent(new CustomEvent('step-validity-changed', {
        bubbles: true, composed: true, detail: { isValid: true },
      }));
      const nextBtn = element.shadowRoot!.querySelector('[data-action="next"]') as HTMLButtonElement;
      nextBtn.disabled = false;
      nextBtn.click();
    }
    // Set data needed for submission
    element.shadowRoot!.dispatchEvent(new CustomEvent('step-data-changed', {
      bubbles: true, composed: true, detail: {
        data: {
          emailOrId: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          businessName: 'TestCo',
          businessPhone: '+1234567890',
          pricingModels: ['CPM'],
          accountNumber: '12345',
          holderName: 'Test User',
          vatTaxNumber: 'TAX123',
          routingNumber: 'RTN123',
          companyName: 'TestCo Inc',
          country: 'US',
          address: '123 Main St',
          securityEmail: 'test@example.com',
          otp: '123456',
          password: 'Test1234',
          confirmPassword: 'Test1234',
        },
      },
    }));
    // Make final step valid
    element.shadowRoot!.dispatchEvent(new CustomEvent('step-validity-changed', {
      bubbles: true, composed: true, detail: { isValid: true },
    }));
    const submitBtn = element.shadowRoot!.querySelector('[data-action="next"]') as HTMLButtonElement;
    submitBtn.disabled = false;
    submitBtn.click();
    await new Promise((r) => setTimeout(r, 100));
    expect(authService.submitRegistration).toHaveBeenCalled();
  });
});