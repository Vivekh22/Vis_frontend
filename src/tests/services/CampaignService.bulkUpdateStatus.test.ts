/**
 * CampaignService.bulkUpdateStatus.test.ts — tests for partial-failure behavior.
 *
 * Decision: PARTIAL SUCCESS. When one campaign in the batch has an invalid
 * transition, valid ones succeed while invalid ones are reported separately.
 * The method returns { succeeded, failed } — it does NOT throw.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CampaignService } from '../../services/CampaignService';
import type { CampaignRepository } from '../../services/CampaignService';
import { Campaign } from '../../core/entities/Campaign';
import { Money } from '../../core/value-objects/Money';
import { CampaignStatus } from '../../core/enums/CampaignStatus';

vi.mock('../../platform/state/AuthStore', () => ({
  authStore: {
    getState: () => ({ currentUser: { id: 'user1', fullName: 'Test User' } }),
  },
}));

function createCampaign(id: string, status: CampaignStatus): Campaign {
  return new Campaign(
    id, `Campaign ${id}`, 'client_1', new Money(10000, 'USD'), 'maximize_reach',
    new Date('2026-01-01'), new Date('2026-12-31'), status, new Date(),
  );
}

describe('CampaignService.bulkUpdateStatus — partial success', () => {
  let service: CampaignService;
  let repo: CampaignRepository;

  beforeEach(() => {
    const campaigns = new Map<string, Campaign>();
    campaigns.set('c1', createCampaign('c1', CampaignStatus.Running));
    campaigns.set('c2', createCampaign('c2', CampaignStatus.Running));
    campaigns.set('c3', createCampaign('c3', CampaignStatus.Archived)); // Invalid: can't pause archived

    repo = {
      findById: vi.fn(async (id: string) => campaigns.get(id) ?? null),
      findAll: vi.fn(async () => Array.from(campaigns.values())),
      save: vi.fn(async (c: Campaign) => { campaigns.set(c.id, c); return c; }),
      delete: vi.fn(),
    };
    service = new CampaignService(repo);
  });

  it('succeeds for valid campaigns and reports failures separately', async () => {
    const result = await service.bulkUpdateStatus(['c1', 'c2', 'c3'], 'pause');
    expect(result.succeeded).toContain('c1');
    expect(result.succeeded).toContain('c2');
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]!.id).toBe('c3');
    expect(result.failed[0]!.error).toContain('Invalid campaign status transition');
  });

  it('does NOT throw when some campaigns fail', async () => {
    await expect(service.bulkUpdateStatus(['c1', 'c3'], 'pause')).resolves.toBeDefined();
  });

  it('reports not-found campaigns as failures', async () => {
    const result = await service.bulkUpdateStatus(['c1', 'nonexistent'], 'pause');
    expect(result.succeeded).toContain('c1');
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]!.id).toBe('nonexistent');
    expect(result.failed[0]!.error).toContain('not found');
  });

  it('all succeed when all transitions are valid', async () => {
    const result = await service.bulkUpdateStatus(['c1', 'c2'], 'pause');
    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
  });

  it('resume action transitions paused → running', async () => {
    // First pause c1 and c2
    await service.bulkUpdateStatus(['c1', 'c2'], 'pause');
    // Now resume them
    const result = await service.bulkUpdateStatus(['c1', 'c2'], 'resume');
    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
  });

  it('archive action transitions running → archived', async () => {
    const result = await service.bulkUpdateStatus(['c1', 'c2'], 'archive');
    expect(result.succeeded).toHaveLength(2);
  });
});