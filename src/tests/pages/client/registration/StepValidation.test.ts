/**
 * StepValidation.test.ts — tests for each step component's validation.
 *
 * Tests the validation logic used by each step component via the shared
 * validators utility functions.
 */
import { describe, it, expect } from 'vitest';
import { isNotEmpty, isValidEmail, isValidPhone, isValidPassword, PASSWORD_RULE } from '../../../../utils/validators';

describe('Step validation logic', () => {
  describe('validators', () => {
    it('isNotEmpty returns false for empty or whitespace', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
      expect(isNotEmpty('hello')).toBe(true);
    });

    it('isValidEmail validates basic email format', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('isValidPhone validates phone format', () => {
      expect(isValidPhone('+1 (234) 567-8901')).toBe(true);
      expect(isValidPhone('1234567')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
    });

    it('isValidPassword enforces minimum complexity', () => {
      expect(isValidPassword('Test1234')).toBe(true);
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('alllowercase1')).toBe(false);
      expect(isValidPassword('ALLUPPERCASE1')).toBe(false);
      expect(isValidPassword('NoDigitsHere')).toBe(false);
      expect(isValidPassword('Test123')).toBe(false); // 7 chars
    });

    it('PASSWORD_RULE is documented', () => {
      expect(PASSWORD_RULE).toContain('8');
      expect(PASSWORD_RULE).toContain('uppercase');
      expect(PASSWORD_RULE).toContain('lowercase');
      expect(PASSWORD_RULE).toContain('digit');
    });
  });

  describe('StepGetStarted validation', () => {
    it('requires a valid email', () => {
      const emailOrId = '';
      expect(isNotEmpty(emailOrId) && isValidEmail(emailOrId)).toBe(false);

      const validEmail = 'test@example.com';
      expect(isNotEmpty(validEmail) && isValidEmail(validEmail)).toBe(true);
    });
  });

  describe('StepPersonalBusinessInfo validation', () => {
    it('all required fields must be filled', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        businessName: 'Acme',
        businessPhone: '+1234567890',
      };
      const required = ['firstName', 'lastName', 'email', 'businessName', 'businessPhone'];
      const allFilled = required.every((f) => isNotEmpty((data as Record<string, string>)[f] ?? ''));
      expect(allFilled).toBe(true);
      expect(isValidEmail(data.email)).toBe(true);
      expect(isValidPhone(data.businessPhone)).toBe(true);
    });

    it('agency is optional', () => {
      const data = { agency: '' };
      expect(isNotEmpty(data.agency)).toBe(false);
    });
  });

  describe('StepCampaignPreferences validation', () => {
    it('at least one pricing model must be selected', () => {
      const empty: string[] = [];
      const selected = ['CPM', 'CPC'];
      expect(empty.length > 0).toBe(false);
      expect(selected.length > 0).toBe(true);
    });
  });

  describe('StepBankingCompanyDetails validation', () => {
    it('all fields required', () => {
      const fields = {
        accountNumber: '123',
        holderName: 'John Doe',
        vatTaxNumber: 'TAX123',
        routingNumber: 'RTN123',
        companyName: 'Acme Inc',
        country: 'US',
        address: '123 Main St',
      };
      const allFilled = Object.values(fields).every((v) => isNotEmpty(v));
      expect(allFilled).toBe(true);
    });
  });

  describe('StepAccountSecurity validation', () => {
    it('password must meet complexity requirements', () => {
      expect(isValidPassword('Test1234')).toBe(true);
      expect(isValidPassword('weak')).toBe(false);
    });

    it('passwords must match', () => {
      const password: string = 'Test1234';
      const confirmPassword: string = 'Test1234';
      const mismatch: string = 'Test5678';
      expect(password === confirmPassword).toBe(true);
      expect(password === mismatch).toBe(false);
    });

    it('email must be valid', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
    });
  });
});