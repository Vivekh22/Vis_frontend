/**
 * SuggestionBusService.ts — services/
 *
 * Aggregated stats for the AI Suggestion Bus — suggestions generated,
 * accepted vs. dismissed, auto-executed count for opted-in clients.
 * This is the platform-level view of the AI-suggestion feature.
 */

// DESIGN NOTE: This service uses a mock repository by design — these are Super Admin
// monitoring/status/governance pages with no real backend API to call yet. When the
// backend is ready, swap the mock for a real repository in services/index.ts.
export interface SuggestionBusStats {
  readonly totalGenerated: number;
  readonly accepted: number;
  readonly dismissed: number;
  readonly autoExecuted: number;
  readonly acceptanceRate: number;
  readonly byCategory: { category: string; generated: number; accepted: number }[];
}

export interface SuggestionBusRepository {
  getStats(): Promise<SuggestionBusStats>;
}

export class SuggestionBusService {
  constructor(private readonly repo: SuggestionBusRepository) {}

  async getStats(): Promise<SuggestionBusStats> {
    return this.repo.getStats();
  }
}