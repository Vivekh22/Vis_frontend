/**
 * AiSuggestionApprovalBypass.test.ts — tests/services/
 *
 * PROVES: An AI-accepted suggestion CANNOT bypass the approval workflow.
 *
 * The test creates a SuggestionService with a real CampaignService (backed
 * by a mock campaign repository) and a mock suggestion repository that
 * returns an actionable campaign suggestion. It calls acceptSuggestion()
 * and verifies the resulting campaign's status is 'pending_approval' —
 * NOT 'running'. The Campaign entity's state machine makes it structurally
 * impossible to skip approval: there is no direct draft → running transition.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SuggestionService } from '../../services/SuggestionService';
import type { SuggestionRepository, Suggestion } from '../../services/SuggestionService';
import { CampaignService } from '../../services/CampaignService';
import type { CampaignRepository, CampaignCreateData } from '../../services/CampaignService';
import { Campaign } from '../../core/entities/Campaign';
import { Money } from '../../core/value-objects/Money';
import type { OptimizationGoal } from '../../core/enums/OptimizationGoal';
import { authStore } from '../../platform/state/AuthStore';

class TestCampaignRepo implements CampaignRepository {
  public saved: Campaign[] = [];

  async findById(id: string): Promise<Campaign | null> {
    return this.saved.find((c) => c.id === id) ?? null;
  }
  async findAll(): Promise<Campaign[]> {
    return this.saved;
  }
  async save(campaign: Campaign): Promise<Campaign> {
    const idx = this.saved.findIndex((c) => c.id === campaign.id);
    if (idx >= 0) {
      this.saved[idx] = campaign;
    } else {
      this.saved.push(campaign);
    }
    return campaign;
  }
  async delete(): Promise<void> {}
}

class TestSuggestionRepo implements SuggestionRepository {
  async getCheckpointSuggestion(): Promise<Suggestion | null> {
    return null;
  }
  async getSuggestion(id: string): Promise<Suggestion | null> {
    if (id === 'sug-action') {
      return {
        id: 'sug-action',
        title: 'Test suggestion',
        description: 'Create a campaign',
        category: 'optimization',
        confidence: 0.9,
        actionable: true,
        actionData: {
          type: 'create_campaign',
          campaignData: {
            name: 'AI Campaign',
            clientId: 'client-1',
            budget: new Money(100000, 'USD'),
            optimizationGoal: 'CPA' as OptimizationGoal,
            startDate: new Date('2026-08-01'),
            endDate: new Date('2026-09-01'),
          } as CampaignCreateData,
        },
      };
    }
    return null;
  }
  async getChatThread(): Promise<null> {
    return null;
  }
  async sendChatMessage(): Promise<never> {
    throw new Error('Not implemented in test');
  }
  async markAccepted(): Promise<void> {}
}

describe('AiSuggestionApprovalBypass', () => {
  beforeEach(() => {
    authStore.login({
      id: 'user-1',
      fullName: 'Test User',
      email: 'test@test.com',
      role: 'client',
    } as never);
  });

  it('accepted suggestion lands in pending_approval, NOT running', async () => {
    const campaignRepo = new TestCampaignRepo();
    const campaignService = new CampaignService(campaignRepo);
    const suggestionRepo = new TestSuggestionRepo();
    const suggestionService = new SuggestionService(suggestionRepo, campaignService);

    const result = await suggestionService.acceptSuggestion('sug-action');

    // The campaign MUST be in pending_approval — never running.
    // The Campaign state machine forbids draft → running directly.
    expect(result.status).toBe('pending_approval');
    expect(result.status).not.toBe('running');
    expect(result.status).not.toBe('draft');
  });

  it('accepted suggestion campaign was saved and submitted by the same user', async () => {
    const campaignRepo = new TestCampaignRepo();
    const campaignService = new CampaignService(campaignRepo);
    const suggestionRepo = new TestSuggestionRepo();
    const suggestionService = new SuggestionService(suggestionRepo, campaignService);

    const result = await suggestionService.acceptSuggestion('sug-action');

    // The campaign should be in the repository
    expect(campaignRepo.saved.length).toBe(1);
    expect(campaignRepo.saved[0]!.id).toBe(result.id);
    // submittedBy should be set (submitForApproval was called)
    expect(result.submittedBy).not.toBeNull();
    expect(result.submittedAt).not.toBeNull();
  });

  it('throws for non-actionable suggestion', async () => {
    const campaignRepo = new TestCampaignRepo();
    const campaignService = new CampaignService(campaignRepo);
    const suggestionRepo = new TestSuggestionRepo();
    const suggestionService = new SuggestionService(suggestionRepo, campaignService);

    // Override getSuggestion to return non-actionable
    (suggestionRepo as unknown as { getSuggestion: () => Promise<Suggestion | null> }).getSuggestion = async () => ({
      id: 'sug-insight',
      title: 'Insight only',
      description: 'Not actionable',
      category: 'general',
      confidence: 0.5,
      actionable: false,
    });

    await expect(suggestionService.acceptSuggestion('sug-insight')).rejects.toThrow();
  });

  it('throws for non-existent suggestion', async () => {
    const campaignRepo = new TestCampaignRepo();
    const campaignService = new CampaignService(campaignRepo);
    const suggestionRepo = new TestSuggestionRepo();
    const suggestionService = new SuggestionService(suggestionRepo, campaignService);

    await expect(suggestionService.acceptSuggestion('nonexistent')).rejects.toThrow();
  });
});