/**
 * MockSuggestionRepository.ts — repositories/mocks/
 *
 * Mock-backed suggestion repository. Returns canned suggestions for
 * checkpoint contexts. When a real AI backend exists, this is replaced
 * with a real repository — the service contract stays the same.
 *
 * The mock returns an actionable campaign suggestion for the 'dashboard'
 * and 'fund' checkpoints, and a non-actionable insight for the 'campaign-wizard'
 * checkpoint. This lets the UI flow be tested end-to-end.
 */
import type {
  SuggestionRepository,
  SuggestionContext,
  Suggestion,
  ChatThread,
  ChatMessage,
} from '../../services/SuggestionService';
import { Money } from '../../core/value-objects/Money';
import type { OptimizationGoal } from '../../core/enums/OptimizationGoal';

const MOCK_SUGGESTIONS: Map<string, Suggestion> = new Map();

const actionSuggestion: Suggestion = {
  id: 'sug-1',
  title: 'Optimize your top-performing campaign',
  description: 'Based on your dashboard metrics, your "Summer Sale" campaign is underutilizing its budget. Increasing the bid by 15% could improve ROI by ~22%.',
  category: 'optimization',
  confidence: 0.87,
  actionable: true,
  actionData: {
    type: 'create_campaign',
    campaignData: {
      name: 'AI-Optimized Summer Sale',
      clientId: 'client-1',
      budget: new Money(500000, 'USD'),
      optimizationGoal: 'CPA' as OptimizationGoal,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
    },
  },
};

const insightSuggestion: Suggestion = {
  id: 'sug-2',
  title: 'Consider expanding to CTV',
  description: 'Your current campaigns target App and Web only. CTV inventory is 30% cheaper in your target regions.',
  category: 'targeting',
  confidence: 0.72,
  actionable: false,
};

// Initialize the mock store
MOCK_SUGGESTIONS.set(actionSuggestion.id, actionSuggestion);
MOCK_SUGGESTIONS.set(insightSuggestion.id, insightSuggestion);

// Chat threads keyed by suggestionId
const CHAT_THREADS: Map<string, ChatThread> = new Map();

export class MockSuggestionRepository implements SuggestionRepository {
  async getCheckpointSuggestion(context: SuggestionContext): Promise<Suggestion | null> {
    await this.delay();
    // Return an actionable suggestion for dashboard/fund checkpoints
    if (context.source === 'dashboard' || context.source === 'fund') {
      return actionSuggestion;
    }
    // Return an insight (non-actionable) for campaign-wizard
    if (context.source === 'campaign-wizard') {
      return insightSuggestion;
    }
    return null;
  }

  async getSuggestion(id: string): Promise<Suggestion | null> {
    await this.delay();
    return MOCK_SUGGESTIONS.get(id) ?? null;
  }

  async getChatThread(suggestionId: string): Promise<ChatThread | null> {
    await this.delay();
    const existing = CHAT_THREADS.get(suggestionId);
    if (existing) return existing;
    // Initialize a new thread
    const thread: ChatThread = {
      suggestionId,
      messages: [
        {
          id: 'msg-init',
          role: 'assistant',
          content: 'I can help you understand this suggestion. What would you like to know?',
          timestamp: new Date(),
        },
      ],
      contextClientId: 'client-1',
    };
    CHAT_THREADS.set(suggestionId, thread);
    return thread;
  }

  async sendChatMessage(
    suggestionId: string,
    message: string,
    contextClientId: string,
  ): Promise<ChatMessage> {
    await this.delay();
    const thread = await this.getChatThread(suggestionId);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: `Based on the data for ${contextClientId}, this suggestion targets underutilized budget allocation. The projected ROI improvement accounts for current bid landscape competition.`,
      timestamp: new Date(),
    };
    if (thread) {
      const updated: ChatThread = {
        ...thread,
        messages: [...thread.messages, userMsg, assistantMsg],
        contextClientId,
      };
      CHAT_THREADS.set(suggestionId, updated);
    }
    return assistantMsg;
  }

  async markAccepted(suggestionId: string): Promise<void> {
    await this.delay();
    // In a real backend, this would mark the suggestion as accepted in the
    // suggestion store. The mock is a no-op — the acceptSuggestion flow
    // is tested via the campaign's resulting status, not the suggestion's
    // internal state.
    void suggestionId;
  }

  private delay(ms: number = 50): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}