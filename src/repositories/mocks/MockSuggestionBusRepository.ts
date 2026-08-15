/**
 * MockSuggestionBusRepository.ts — repositories/mocks/
 */
import type { SuggestionBusStats, SuggestionBusRepository } from '../../services/SuggestionBusService';

export class MockSuggestionBusRepository implements SuggestionBusRepository {
  async getStats(): Promise<SuggestionBusStats> {
    return {
      totalGenerated: 4820,
      accepted: 2156,
      dismissed: 1840,
      autoExecuted: 824,
      acceptanceRate: 44.7,
      byCategory: [
        { category: 'Bid Optimization', generated: 1820, accepted: 912 },
        { category: 'Audience Expansion', generated: 1240, accepted: 534 },
        { category: 'Creative Refresh', generated: 980, accepted: 410 },
        { category: 'Budget Reallocation', generated: 780, accepted: 300 },
      ],
    };
  }
}