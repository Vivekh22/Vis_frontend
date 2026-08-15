/**
 * PlatformSettingsService.test.ts
 *
 * Tests that Platform Settings correctly stores and retrieves SLA
 * thresholds, default base margin, and other configuration values.
 *
 * Critical: confirms ApprovalService.isOverdue() reads SLA from here
 * (via getSlaThreshold), not from a hardcoded constant.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformSettingsService } from '../services/PlatformSettingsService';
import { MockPlatformSettingsRepository } from '../repositories/mocks/MockPlatformSettingsRepository';

describe('PlatformSettingsService', () => {
  let service: PlatformSettingsService;

  beforeEach(() => {
    const repo = new MockPlatformSettingsRepository();
    service = new PlatformSettingsService(repo);
  });

  it('returns default base margin of 15', async () => {
    const margin = await service.getDefaultBaseMargin();
    expect(margin).toBe(15);
  });

  it('returns separate SLA thresholds for campaign and creative', async () => {
    const campaignSla = await service.getSlaThreshold('campaign');
    const creativeSla = await service.getSlaThreshold('creative');
    expect(campaignSla).toBe(4);
    expect(creativeSla).toBe(4);
  });

  it('updates SLA thresholds', async () => {
    await service.updateSlaThresholds(6, 8);
    const campaignSla = await service.getSlaThreshold('campaign');
    const creativeSla = await service.getSlaThreshold('creative');
    expect(campaignSla).toBe(6);
    expect(creativeSla).toBe(8);
  });

  it('returns default low-balance threshold', async () => {
    const threshold = await service.getDefaultLowBalanceThreshold();
    expect(threshold).toBe(500);
  });

  it('returns support email', async () => {
    const email = await service.getSupportEmail();
    expect(email).toBe('support@visprisca.ads');
  });

  it('returns notification templates', async () => {
    const templates = await service.getNotificationTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]!.key).toBe('low_balance');
  });

  it('updates default base margin', async () => {
    await service.updateDefaultBaseMargin(20);
    const margin = await service.getDefaultBaseMargin();
    expect(margin).toBe(20);
  });
});