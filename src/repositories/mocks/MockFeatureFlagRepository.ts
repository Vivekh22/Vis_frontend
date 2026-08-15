/**
 * MockFeatureFlagRepository.ts — repositories/mocks/
 *
 * In-memory mock for FeatureFlagService. Seeds default flag states.
 */
import { FeatureFlag } from '../../core/enums/FeatureFlag';
import type { FeatureFlagRepository } from '../../services/FeatureFlagService';

export class MockFeatureFlagRepository implements FeatureFlagRepository {
  private readonly flags: Map<string, Record<FeatureFlag, boolean>> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    // client-1: both features enabled
    this.flags.set('client-1', {
      [FeatureFlag.IpBasedFrequencyCapping]: true,
      [FeatureFlag.AdvancedRuleEngine]: true,
    });
    // client-2: only IP frequency capping
    this.flags.set('client-2', {
      [FeatureFlag.IpBasedFrequencyCapping]: true,
      [FeatureFlag.AdvancedRuleEngine]: false,
    });
    // client-3: neither feature
    this.flags.set('client-3', {
      [FeatureFlag.IpBasedFrequencyCapping]: false,
      [FeatureFlag.AdvancedRuleEngine]: false,
    });
  }

  async isEnabled(clientId: string, flag: FeatureFlag): Promise<boolean> {
    const clientFlags = this.flags.get(clientId);
    if (!clientFlags) return false;
    return clientFlags[flag] ?? false;
  }

  async setEnabled(clientId: string, flag: FeatureFlag, enabled: boolean): Promise<void> {
    if (!this.flags.has(clientId)) {
      this.flags.set(clientId, {
        [FeatureFlag.IpBasedFrequencyCapping]: false,
        [FeatureFlag.AdvancedRuleEngine]: false,
      });
    }
    this.flags.get(clientId)![flag] = enabled;
  }

  async getAllFlags(clientId: string): Promise<Record<FeatureFlag, boolean>> {
    if (!this.flags.has(clientId)) {
      return {
        [FeatureFlag.IpBasedFrequencyCapping]: false,
        [FeatureFlag.AdvancedRuleEngine]: false,
      };
    }
    return { ...this.flags.get(clientId)! };
  }
}