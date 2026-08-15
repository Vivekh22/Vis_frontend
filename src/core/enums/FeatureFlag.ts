/**
 * FeatureFlag.ts — core/enums/
 *
 * Per-client feature toggles controlled exclusively by Super Admin.
 * When disabled, the feature must be fully ABSENT from the client's UI,
 * not shown-but-locked.
 *
 * IP-Based Frequency Capping and Advanced Rule Engine are the two
 * existing flags. Future flags can be added here.
 */
export const FeatureFlag = {
  IpBasedFrequencyCapping: 'ip_based_frequency_capping',
  AdvancedRuleEngine: 'advanced_rule_engine',
} as const;

export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export const ALL_FEATURE_FLAGS: readonly FeatureFlag[] = [
  FeatureFlag.IpBasedFrequencyCapping,
  FeatureFlag.AdvancedRuleEngine,
];