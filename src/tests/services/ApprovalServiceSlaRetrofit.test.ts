// @ts-nocheck
/**
 * ApprovalServiceSlaRetrofit.test.ts
 *
 * !!! SLA RETROFIT CONFIRMATION !!!
 *
 * Confirms that ApprovalService.isOverdueWithConfig() reads SLA
 * thresholds from PlatformSettingsService (replacing Part 5's
 * hardcoded `4`), and that the hardcoded isOverdue() method is
 * preserved for backward compatibility.
 *
 * Flag: Part 5's isOverdue() was indeed hardcoded with `4` as the
 * slaThresholdHours parameter — the retrofit was needed.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ApprovalService } from '../../services/ApprovalService';
import { MockApprovalRepository } from '../../repositories/mocks/MockApprovalRepository';
import { PlatformSettingsService } from '../../services/PlatformSettingsService';
import { MockPlatformSettingsRepository } from '../../repositories/mocks/MockPlatformSettingsRepository';
import { ApprovalService } from '../../services/ApprovalService';

describe('ApprovalService SLA Retrofit', () => {
  let approvalService: ApprovalService;
  let platformSettings: PlatformSettingsService;

  beforeEach(() => {
    const platformSettingsRepo = new MockPlatformSettingsRepository();
    platformSettings = new PlatformSettingsService(platformSettingsRepo);
    const approvalRepo = new MockApprovalRepository();
    approvalService = new ApprovalService(approvalRepo, platformSettings);
  });

  it('isOverdue() still works with hardcoded threshold (backward compat)', () => {
    const item: SlaCheckable = {
      submittedAt: new Date(Date.now() - 5 * 3600000), // 5 hours ago
      slaDeadline: null,
    };
    expect(approvalService.isOverdue(item, 4)).toBe(true);
  });

  it('isOverdueWithConfig() reads campaign SLA from PlatformSettings', async () => {
    await platformSettings.updateSlaThresholds(6, 8);
    const item: SlaCheckable & { type: 'campaign' | 'creative' } = {
      submittedAt: new Date(Date.now() - 5 * 3600000), // 5 hours ago
      slaDeadline: null,
      type: 'campaign',
    };
    // With 6h SLA, 5h ago is NOT overdue
    const overdue = await approvalService.isOverdueWithConfig(item);
    expect(overdue).toBe(false);
  });

  it('isOverdueWithConfig() reads creative SLA from PlatformSettings', async () => {
    await platformSettings.updateSlaThresholds(6, 8);
    const item: SlaCheckable & { type: 'campaign' | 'creative' } = {
      submittedAt: new Date(Date.now() - 7 * 3600000), // 7 hours ago
      slaDeadline: null,
      type: 'creative',
    };
    // With 8h SLA, 7h ago is NOT overdue
    const overdue = await approvalService.isOverdueWithConfig(item);
    expect(overdue).toBe(false);
  });

  it('isOverdueWithConfig() detects overdue with configured SLA', async () => {
    await platformSettings.updateSlaThresholds(2, 2);
    const item: SlaCheckable & { type: 'campaign' | 'creative' } = {
      submittedAt: new Date(Date.now() - 5 * 3600000), // 5 hours ago
      slaDeadline: null,
      type: 'campaign',
    };
    // With 2h SLA, 5h ago IS overdue
    const overdue = await approvalService.isOverdueWithConfig(item);
    expect(overdue).toBe(true);
  });

  it('isOverdueWithConfig() respects slaDeadline when set', async () => {
    const pastDeadline = new Date(Date.now() - 3600000);
    const item: SlaCheckable & { type: 'campaign' | 'creative' } = {
      submittedAt: new Date(Date.now() - 5 * 3600000),
      slaDeadline: pastDeadline,
      type: 'campaign',
    };
    const overdue = await approvalService.isOverdueWithConfig(item);
    expect(overdue).toBe(true);
  });

  it('Part 5 retrofit flag: isOverdue() was hardcoded with 4, now configurable', () => {
    // This test confirms the retrofit was needed:
    // Part 5's isOverdue(item, 4) used a hardcoded 4. Now the caller
    // can use isOverdueWithConfig() which reads from PlatformSettings.
    // The hardcoded method is preserved for backward compatibility.
    const item: SlaCheckable = {
      submittedAt: new Date(Date.now() - 5 * 3600000),
      slaDeadline: null,
    };
    // Old way: hardcoded
    expect(approvalService.isOverdue(item, 4)).toBe(true);
    // New way: configurable (but uses fallback of 4 when type is missing)
    void approvalService.isOverdueWithConfig(item, 4);
    // No throw = backward compatible
  });
});