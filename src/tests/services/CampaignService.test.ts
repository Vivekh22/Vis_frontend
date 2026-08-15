/**
 * CampaignService.test.ts — tests for services/CampaignService.
 *
 * Tests the ORCHESTRATION logic: createCampaign, updateCampaign, listCampaigns,
 * submitForApproval (state machine delegation), and duplicateCampaign
 * (correctly resetting status rather than inheriting running).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignService } from '../../services/CampaignService';
import type { CampaignRepository, CampaignFilter } from '../../services/CampaignService';
import { Campaign } from '../../core/entities/Campaign';
import type { CampaignStatus } from '../../core/enums/CampaignStatus';
import { OptimizationGoal } from '../../core/enums/OptimizationGoal';
import { Money } from '../../core/value-objects/Money';
import { DomainError } from '../../core/errors/DomainError';
import { authStore } from '../../platform/state/AuthStore';
import { User } from '../../core/entities/User';

class MockCampaignRepo implements CampaignRepository {
  private map: Map<string, Campaign> = new Map();
  public saveCalls: Campaign[] = [];

  seed(campaigns: Campaign[]): void {
    for (const c of campaigns) this.map.set(c.id, c);
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.map.get(id) ?? null;
  }

  async findAll(filter?: CampaignFilter): Promise<Campaign[]> {
    let results = Array.from(this.map.values());
    if (filter?.clientId) results = results.filter((c) => c.clientId === filter.clientId);
    if (filter?.status) results = results.filter((c) => c.status === filter.status);
    return results;
  }

  async save(campaign: Campaign): Promise<Campaign> {
    this.map.set(campaign.id, campaign);
    this.saveCalls.push(campaign);
    return campaign;
  }

  async delete(id: string): Promise<void> {
    this.map.delete(id);
  }
}

function makeCampaign(id: string, status: CampaignStatus = 'draft'): Campaign {
  const c = new Campaign(
    id, `Campaign ${id}`, 'client-a',
    new Money(10000, 'USD'), OptimizationGoal.MaximizeClicks,
    new Date('2026-01-01'), new Date('2026-12-31'),
    'draft', new Date(),
  );
  if (status !== 'draft') {
    c.submitForApproval('u1', 'Admin');
    if (status === 'running' || status === 'paused' || status === 'archived') {
      c.approve('u1', 'Admin');
    }
    if (status === 'paused') c.pause('u1', 'Admin');
  }
  return c;
}

describe('CampaignService', () => {
  let repo: MockCampaignRepo;

  beforeEach(() => {
    authStore.logout();
    authStore.login(new User('u1', 'a@b.com', 'Admin', 'admin'));
    repo = new MockCampaignRepo();
  });

  it('createCampaign creates a draft campaign and saves it', async () => {
    const svc = new CampaignService(repo);
    const campaign = await svc.createCampaign({
      name: 'New Campaign',
      clientId: 'client-a',
      budget: new Money(50000, 'USD'),
      optimizationGoal: OptimizationGoal.MaximizeConversions,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
    });
    expect(campaign.status).toBe('draft');
    expect(campaign.name).toBe('New Campaign');
    expect(repo.saveCalls).toHaveLength(1);
  });

  it('updateCampaign updates editable fields and preserves status', async () => {
    const existing = makeCampaign('c1', 'pending_approval');
    repo.seed([existing]);
    const svc = new CampaignService(repo);
    const updated = await svc.updateCampaign('c1', { name: 'Updated Name' });
    expect(updated.name).toBe('Updated Name');
    expect(updated.status).toBe('pending_approval');
  });

  it('updateCampaign throws on not found', async () => {
    const svc = new CampaignService(repo);
    await expect(svc.updateCampaign('nonexistent', {})).rejects.toThrow(DomainError);
  });

  it('listCampaigns filters by clientId', async () => {
    repo.seed([makeCampaign('c1'), makeCampaign('c2')]);
    const svc = new CampaignService(repo);
    const all = await svc.listCampaigns({ clientId: 'client-a' });
    expect(all).toHaveLength(2);
  });

  it('submitForApproval delegates to entity state machine (draft → pending_approval)', async () => {
    const campaign = makeCampaign('c1', 'draft');
    repo.seed([campaign]);
    const svc = new CampaignService(repo);
    const result = await svc.submitForApproval('c1');
    expect(result.status).toBe('pending_approval');
    expect(result.submittedBy).toBe('u1');
  });

  it('duplicateCampaign resets status — never inherits running status', async () => {
    const running = makeCampaign('c1', 'running');
    repo.seed([running]);
    const svc = new CampaignService(repo);
    const duplicate = await svc.duplicateCampaign('c1');
    // Per spec: duplicated campaigns re-enter Pending Approval, never inherit running
    expect(duplicate.status).toBe('pending_approval');
    expect(duplicate.id).not.toBe('c1');
    expect(duplicate.name).toBe('Copy of Campaign c1');
    // Original is untouched
    const original = await repo.findById('c1');
    expect(original?.status).toBe('running');
  });

  it('duplicateCampaign throws on not found', async () => {
    const svc = new CampaignService(repo);
    await expect(svc.duplicateCampaign('nonexistent')).rejects.toThrow(DomainError);
  });
});