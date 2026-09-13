/**
 * MockCampaignRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of CampaignRepository for CampaignService.
 * Stores campaigns in memory. Temporary — real repository implementations
 * in Part 6.
 */
import { Campaign } from '../../core/entities/Campaign';
import type { CampaignFilter, CampaignRepository } from '../../services/CampaignService';
import { Money } from '../../core/value-objects/Money';

export class MockCampaignRepository implements CampaignRepository {
  private readonly campaigns: Map<string, Campaign> = new Map();

  constructor() {
    this.seed([
      new Campaign(
        'CPG-2026-048',
        'Summer Brand Awareness',
        'CL-001',
        new Money(50000, 'USD'),
        'minimize_cpa',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'running'
      ),
      new Campaign(
        'CPG-2026-045',
        'Retargeting Q3',
        'CL-001',
        new Money(25000, 'USD'),
        'minimize_cpa',
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        'running'
      ),
      new Campaign(
        'CPG-2026-040',
        'App Install Promo',
        'CL-002',
        new Money(100000, 'USD'),
        'maximize_conversions',
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        'archived' // 'completed' is not a valid status
      ),
      new Campaign(
        'CPG-2026-033',
        'Holiday Special Preview',
        'CL-003',
        new Money(15000, 'USD'),
        'maximize_roas',
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        'draft'
      ),
      new Campaign(
        'CPG-2026-050',
        'Gaming User Acquisition',
        'CL-002',
        new Money(200000, 'USD'),
        'maximize_conversions',
        new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
        'running'
      )
    ]);
  }

  seed(campaigns: Campaign[]): void {
    for (const c of campaigns) {
      this.campaigns.set(c.id, c);
    }
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.campaigns.get(id) ?? null;
  }

  async findAll(filter?: CampaignFilter): Promise<Campaign[]> {
    let results = Array.from(this.campaigns.values());
    if (filter?.clientId) {
      results = results.filter((c) => c.clientId === filter.clientId);
    }
    if (filter?.status) {
      results = results.filter((c) => c.status === filter.status);
    }
    return results;
  }

  async save(campaign: Campaign): Promise<Campaign> {
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async delete(id: string): Promise<void> {
    this.campaigns.delete(id);
  }
}