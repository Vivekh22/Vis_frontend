// @ts-nocheck
/**
 * AiSuggestionChatContextScoping.test.ts — tests/services/
 *
 * PROVES: The chat thread's context is strictly scoped to the client the
 * user is acting on — when an Admin or Super Admin is impersonating a
 * client, the chat service call must ONLY include that client's data,
 * never a broader context.
 *
 * The test sets up an impersonation session via SessionStore, then calls
 * SuggestionService.sendChatMessage(). It verifies the contextClientId
 * passed to the repository matches the impersonated client — NOT the
 * Admin's own user ID.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SuggestionService } from '../../services/SuggestionService';
import { SuggestionService } from '../../services/SuggestionService';
import { CampaignService } from '../../services/CampaignService';
import { CampaignService } from '../../services/CampaignService';
import { Campaign } from '../../core/entities/Campaign';
import { authStore } from '../../platform/state/AuthStore';
import { sessionStore } from '../../platform/state/SessionStore';

class StubCampaignRepo implements CampaignRepository {
  async findById(): Promise<Campaign | null> {
    return null;
  }
  async findAll(): Promise<Campaign[]> {
    return [];
  }
  async save(campaign: Campaign): Promise<Campaign> {
    return campaign;
  }
  async delete(): Promise<void> {}
}

class ContextCapturingSuggestionRepo implements SuggestionRepository {
  public lastContextClientId: string | null = null;

  async getCheckpointSuggestion(): Promise<null> {
    return null;
  }
  async getSuggestion(): Promise<null> {
    return null;
  }
  async getChatThread(): Promise<null> {
    return null;
  }
  async sendChatMessage(
    _suggestionId: string,
    _message: string,
    contextClientId: string,
  ): Promise<ChatMessage> {
    this.lastContextClientId = contextClientId;
    return {
      id: 'msg-1',
      role: 'assistant',
      content: 'Response scoped to the impersonated client',
      timestamp: new Date(),
    };
  }
  async markAccepted(): Promise<void> {}
}

describe('AiSuggestionChatContextScoping', () => {
  beforeEach(() => {
    // Reset stores
    sessionStore.clearSession();
    authStore.logout();

    // Log in as an Admin
    authStore.login({
      id: 'admin-1',
      fullName: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
    } as never);
  });

  it('chat context is scoped to the impersonated client, not the Admin', async () => {
    // Admin starts impersonating client-5
    sessionStore.startImpersonation({
      entityName: 'client-5',
      actingAsUserId: 'admin-1',
      actingAsRole: 'admin',
    });

    const campaignRepo = new StubCampaignRepo();
    const campaignService = new CampaignService(campaignRepo);
    const suggestionRepo = new ContextCapturingSuggestionRepo();
    const suggestionService = new SuggestionService(suggestionRepo, campaignService);

    await suggestionService.sendChatMessage('sug-1', 'Why this suggestion?');

    // The contextClientId passed to the repo MUST be the impersonated client
    // (client-5), NOT the Admin's own user ID (admin-1).
    expect(suggestionRepo.lastContextClientId).toBe('client-5');
    expect(suggestionRepo.lastContextClientId).not.toBe('admin-1');
  });

  it('chat context falls back to own user ID when not impersonating', async () => {
    // Not impersonating — context should be the user's own ID
    const campaignRepo = new StubCampaignRepo();
    const campaignService = new CampaignService(campaignRepo);
    const suggestionRepo = new ContextCapturingSuggestionRepo();
    const suggestionService = new SuggestionService(suggestionRepo, campaignService);

    await suggestionService.sendChatMessage('sug-1', 'Why this suggestion?');

    expect(suggestionRepo.lastContextClientId).toBe('admin-1');
  });

  it('chat context switches when impersonation changes', async () => {
    // Impersonate client-3
    sessionStore.startImpersonation({
      entityName: 'client-3',
      actingAsUserId: 'admin-1',
      actingAsRole: 'admin',
    });

    const campaignRepo = new StubCampaignRepo();
    const campaignService = new CampaignService(campaignRepo);
    const suggestionRepo = new ContextCapturingSuggestionRepo();
    const suggestionService = new SuggestionService(suggestionRepo, campaignService);

    await suggestionService.sendChatMessage('sug-1', 'message 1');
    expect(suggestionRepo.lastContextClientId).toBe('client-3');

    // End impersonation — context should fall back to admin's own ID
    sessionStore.endImpersonation();

    await suggestionService.sendChatMessage('sug-2', 'message 2');
    expect(suggestionRepo.lastContextClientId).toBe('admin-1');
  });
});