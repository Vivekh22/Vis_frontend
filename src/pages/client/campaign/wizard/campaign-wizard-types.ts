/**
 * campaign-wizard-types.ts — pages/client/campaign/wizard/
 *
 * Shared types and interfaces for the Campaign Creation Wizard.
 * Same pattern as registration-types.ts from Part 7.
 */
import type { ScheduleGrid } from '../../../../components/scheduling-grid/SchedulingGridElement';

export interface CampaignFormData {
  // Step 1 — Campaign Info
  name: string;
  timeZone: string;
  startDate: string;
  endDate: string;
  runAllTime: boolean;
  schedule: ScheduleGrid;

  // Step 2 — Ad Domain
  domain: string;
  domainMode: 'app_bundle' | 'website';
  enableSkadNetwork: boolean;

  // Step 3 — Budget & Targeting Type
  platforms: string[];
  creativeTypes: string[];
  optimizationGoals: string[];
  budget: number;
  bid: number;
  frequencyCap: number;
  frequencyPeriod: string;
  budgetPacing: boolean;
  bidShading: boolean;
  impressionPacing: boolean;
  autoExclusion: boolean;
  appDiversity: boolean;

  // Step 4 — Targeting
  geoCountries: string;
  geoStates: string;
  geoCities: string;
  geoMode: 'include' | 'exclude';
  zipCodes: string;
  latLong: string;
  deviceOs: string[];
  networkType: string[];
  deviceIdentifier: string;
  smartAppCategories: string;
  appWhitelist: string;
  audienceList: string;
  ipList: string;

  // Step 5 — Bid Multiplier
  bidMultiplierRules: BidMultiplierRule[];

  // Metadata
  clientId: string;
}

export interface BidMultiplierRule {
  id: string;
  condition: string;
  conditionValue: string;
  multiplier: number;
  expiry: string;
}

export const INITIAL_CAMPAIGN_DATA: CampaignFormData = {
  name: '',
  timeZone: 'UTC',
  startDate: '',
  endDate: '',
  runAllTime: true,
  schedule: Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => false)),

  domain: '',
  domainMode: 'website',
  enableSkadNetwork: false,

  platforms: [],
  creativeTypes: [],
  optimizationGoals: [],
  budget: 0,
  bid: 0,
  frequencyCap: 0,
  frequencyPeriod: 'daily',
  budgetPacing: true,
  bidShading: false,
  impressionPacing: false,
  autoExclusion: false,
  appDiversity: false,

  geoCountries: '',
  geoStates: '',
  geoCities: '',
  geoMode: 'include',
  zipCodes: '',
  latLong: '',
  deviceOs: [],
  networkType: [],
  deviceIdentifier: '',
  smartAppCategories: '',
  appWhitelist: '',
  audienceList: '',
  ipList: '',

  bidMultiplierRules: [],

  clientId: '',
};

export interface StepComponent extends HTMLElement {
  data: CampaignFormData;
}

export interface StepValidityEventDetail {
  isValid: boolean;
}

export interface StepDataEventDetail {
  data: Partial<CampaignFormData>;
}

export const WIZARD_STEPS = [
  { key: 'info', label: 'Campaign Info' },
  { key: 'domain', label: 'Ad Domain' },
  { key: 'budget', label: 'Budget & Targeting' },
  { key: 'targeting', label: 'Targeting' },
  { key: 'multiplier', label: 'Bid Multiplier' },
  { key: 'review', label: 'Review' },
] as const;