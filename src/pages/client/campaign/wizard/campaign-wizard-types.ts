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
  startTime: string;
  endDate: string;
  endTime: string;
  runAllTime: boolean;
  runAtScheduledTime: boolean;
  schedule: ScheduleGrid;

  // Step 2 — Ad Domain
  searchDomain: string;
  domain: string;
  domainMode: 'app_bundle' | 'website' | 'create_new';
  enableSkadNetwork: boolean;

  // Step 3 — Budget & Targeting Type
  platforms: string[]; // APP, WEB, DESKTOP, CTV
  creativeTypes: string[];
  optimizationGoals: string[]; // CPM, CPC, CPI, CPA
  budget: number;
  dayBudget: number;
  bid: number;
  targetBids: number;
  dailyImpression: number;
  totalImpressionCap: number;
  frequencyCap: number;
  frequencyPeriod: 'life' | 'hour' | 'day';
  impressionIntervalPerUser: number;
  budgetPacing: boolean;
  bidShading: boolean;
  impressionPacing: boolean;
  autoExclusion: boolean;
  appDiversity: boolean;
  creativeOptimization: string;
  autoBlacklisting: string;

  // Step 4 — Targeting
  geoCountries: string;
  geoStates: string;
  geoCities: string;
  geoMode: 'include' | 'exclude';
  zipCodes: string;
  latLong: string;
  deviceOs: string[];
  osVersion: string;
  osMinorVersion: string;
  deviceType: string;
  deviceManufacturer: string;
  deviceIdentifier: 'both' | 'missing' | 'present' | '';
  deviceLanguage: string;
  networkType: string[]; // CELLULAR, WIFI
  smartAppCategories: string;
  appWhitelist: string;
  appBlacklist: string;
  audienceWhitelist: string;
  audienceBlacklist: string;
  ipWhitelist: string;
  ipBlacklist: string;

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
  startTime: '',
  endDate: '',
  endTime: '',
  runAllTime: true,
  runAtScheduledTime: false,
  schedule: Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => false)),

  searchDomain: '',
  domain: '',
  domainMode: 'website',
  enableSkadNetwork: false,

  platforms: [],
  creativeTypes: [],
  optimizationGoals: [],
  budget: 0,
  dayBudget: 0,
  bid: 0,
  targetBids: 0,
  dailyImpression: 0,
  totalImpressionCap: 0,
  frequencyCap: 0,
  frequencyPeriod: 'daily' as any,
  impressionIntervalPerUser: 0,
  budgetPacing: true,
  bidShading: false,
  impressionPacing: false,
  autoExclusion: false,
  appDiversity: false,
  creativeOptimization: '',
  autoBlacklisting: '',

  geoCountries: '',
  geoStates: '',
  geoCities: '',
  geoMode: 'include',
  zipCodes: '',
  latLong: '',
  deviceOs: [],
  osVersion: '',
  osMinorVersion: '',
  deviceType: '',
  deviceManufacturer: '',
  deviceIdentifier: '',
  deviceLanguage: '',
  networkType: [],
  smartAppCategories: '',
  appWhitelist: '',
  appBlacklist: '',
  audienceWhitelist: '',
  audienceBlacklist: '',
  ipWhitelist: '',
  ipBlacklist: '',

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
  { key: 'review', label: 'Review' },
] as const;