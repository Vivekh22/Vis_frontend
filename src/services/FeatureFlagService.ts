/**
 * FeatureFlagService.ts — services/
 *
 * Per-client feature flag checks. When a flag is disabled, the feature
 * must be FULLY ABSENT from the client's UI — not shown-but-locked.
 *
 * This service is injected into Client-side pages (Parts 8-10) that
 * touch IP-based frequency capping or the advanced rule engine. The
 * page checks isFeatureEnabled(clientId, flag) and only renders the
 * feature's UI element if true.
 *
 * !!! NEVER DELEGABLE !!!
 * Feature gating is a Super Admin-only control. No PermissionGrant can
 * delegate feature-flag management to Admins. The Role & Permission
 * Builder's grid has this row permanently greyed out.
 */

// DESIGN NOTE: This service uses a mock repository by design — these are Super Admin
// monitoring/status/governance pages with no real backend API to call yet. When the
// backend is ready, swap the mock for a real repository in services/index.ts.
import { FeatureFlag } from '../core/enums/FeatureFlag';

export interface FeatureFlagRepository {
  isEnabled(clientId: string, flag: FeatureFlag): Promise<boolean>;
  setEnabled(clientId: string, flag: FeatureFlag, enabled: boolean): Promise<void>;
  getAllFlags(clientId: string): Promise<Record<FeatureFlag, boolean>>;
}

export class FeatureFlagService {
  constructor(private readonly flagRepo: FeatureFlagRepository) {}

  async isFeatureEnabled(clientId: string, flag: FeatureFlag): Promise<boolean> {
    return this.flagRepo.isEnabled(clientId, flag);
  }

  async getAllFlags(clientId: string): Promise<Record<FeatureFlag, boolean>> {
    return this.flagRepo.getAllFlags(clientId);
  }

  async setEnabled(clientId: string, flag: FeatureFlag, enabled: boolean): Promise<void> {
    await this.flagRepo.setEnabled(clientId, flag, enabled);
  }
}