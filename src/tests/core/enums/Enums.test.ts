// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { CampaignStatus } from '../../../core/enums/CampaignStatus';
import { CreativeStatus } from '../../../core/enums/CreativeStatus';
import { UserRole } from '../../../core/enums/UserRole';
import { PERMISSION_LEVEL_RANK } from '../../../core/enums/PermissionLevel';
import { OptimizationGoal } from '../../../core/enums/OptimizationGoal';

describe('core/enums', () => {
  it('CampaignStatus has all six lifecycle states', () => {
    expect(CampaignStatus.Draft).toBe('draft');
    expect(CampaignStatus.PendingApproval).toBe('pending_approval');
    expect(CampaignStatus.Running).toBe('running');
    expect(CampaignStatus.Paused).toBe('paused');
    expect(CampaignStatus.Rejected).toBe('rejected');
    expect(CampaignStatus.Archived).toBe('archived');
  });

  it('CreativeStatus has all five lifecycle states', () => {
    expect(CreativeStatus.Draft).toBe('draft');
    expect(CreativeStatus.PendingApproval).toBe('pending_approval');
    expect(CreativeStatus.Active).toBe('active');
    expect(CreativeStatus.Paused).toBe('paused');
    expect(CreativeStatus.Rejected).toBe('rejected');
  });

  it('UserRole has the three platform roles', () => {
    expect(UserRole.Client).toBe('client');
    expect(UserRole.Admin).toBe('admin');
    expect(UserRole.SuperAdmin).toBe('super-admin');
  });

  it('PermissionLevel is ordered none < view < edit < approve', () => {
    expect(PERMISSION_LEVEL_RANK.none).toBe(0);
    expect(PERMISSION_LEVEL_RANK.view).toBe(1);
    expect(PERMISSION_LEVEL_RANK.edit).toBe(2);
    expect(PERMISSION_LEVEL_RANK.approve).toBe(3);
    expect(PERMISSION_LEVEL_RANK.none).toBeLessThan(PERMISSION_LEVEL_RANK.view);
    expect(PERMISSION_LEVEL_RANK.view).toBeLessThan(PERMISSION_LEVEL_RANK.edit);
    expect(PERMISSION_LEVEL_RANK.edit).toBeLessThan(PERMISSION_LEVEL_RANK.approve);
  });

  it('OptimizationGoal has all six goals', () => {
    expect(OptimizationGoal.MaximizeReach).toBe('maximize_reach');
    expect(OptimizationGoal.MaximizeClicks).toBe('maximize_clicks');
    expect(OptimizationGoal.MaximizeConversions).toBe('maximize_conversions');
    expect(OptimizationGoal.MinimizeCpa).toBe('minimize_cpa');
    expect(OptimizationGoal.MaximizeRoi).toBe('maximize_roi');
    expect(OptimizationGoal.MaximizeRoas).toBe('maximize_roas');
  });
});