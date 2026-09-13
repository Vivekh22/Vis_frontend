export type CreativeFormat = 'image' | 'video' | 'html' | 'vast' | 'native' | null;

export interface CreativeFormData {
  // Step 1: Basic Details
  creativeName: string;
  advertiserName: string;
  category: string;
  platform: string;
  language: string;

  // Step 2: Assets
  format: CreativeFormat;
  assetUrl: string;

  // Step 3: Ad Details
  headline: string;
  description: string;
  ctaText: string;
  destinationUrl: string;

  // Step 4: Tracking
  clickTracker: string;
  impressionTracker: string;
  verificationTag: string;
}

export const INITIAL_CREATIVE_DATA: CreativeFormData = {
  creativeName: '',
  advertiserName: '',
  category: '',
  platform: 'All',
  language: 'English',
  format: null,
  assetUrl: '',
  headline: '',
  description: '',
  ctaText: 'Learn More',
  destinationUrl: '',
  clickTracker: '',
  impressionTracker: '',
  verificationTag: ''
};

export const CREATIVE_WIZARD_STEPS = [
  'Basic Details',
  'Assets',
  'Ad Details',
  'Tracking',
  'Review'
] as const;

export interface StepComponent extends HTMLElement {
  data: CreativeFormData;
  isValid: boolean;
}
