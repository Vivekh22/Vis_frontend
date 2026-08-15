/**
 * MockCampaignRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of CampaignRepository for CampaignService.
 * Stores campaigns in memory. Temporary — real repository implementations
 * in Part 6.
 */
import type { Campaign } from '../../core/entities/Campaign';
import type { CampaignFilter, CampaignRepository } from '../../services/CampaignService';

export class MockCampaignRepository implements CampaignRepository {
  private readonly campaigns: Map<string, Campaign> = new Map();

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