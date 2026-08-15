/**
 * registration-types.ts — pages/client/registration/
 *
 * Shared types for the registration wizard. Both the wizard orchestrator
 * and the individual step components import from here.
 */

export interface RegistrationFormData {
  // Step 1: Get Started
  emailOrId: string;
  // Step 2: Personal & Business Info
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  businessPhone: string;
  agency: string;
  // Step 3: Campaign Preferences
  pricingModels: string[];
  // Step 4: Banking & Company Details
  accountNumber: string;
  holderName: string;
  vatTaxNumber: string;
  routingNumber: string;
  companyName: string;
  country: string;
  address: string;
  // Step 5: Account Security
  securityEmail: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

export const INITIAL_REGISTRATION_DATA: RegistrationFormData = {
  emailOrId: '',
  firstName: '',
  lastName: '',
  email: '',
  businessName: '',
  businessPhone: '',
  agency: '',
  pricingModels: [],
  accountNumber: '',
  holderName: '',
  vatTaxNumber: '',
  routingNumber: '',
  companyName: '',
  country: '',
  address: '',
  securityEmail: '',
  otp: '',
  password: '',
  confirmPassword: '',
};

/** Event detail emitted by step components when their field data changes. */
export interface StepDataDetail {
  data: Partial<RegistrationFormData>;
}

/** Event detail emitted by step components when their validation state changes. */
export interface StepValidityDetail {
  isValid: boolean;
}

/** Shared interface for step components — the wizard queries and sets these. */
export interface StepComponent extends HTMLElement {
  data: RegistrationFormData;
}