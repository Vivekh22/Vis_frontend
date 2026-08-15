/**
 * MockCreativeRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of CreativeRepository for CreativeService.
 * Stores creatives in memory. Temporary — real repository implementations
 * in Part 6.
 */
import type { Creative } from '../../core/entities/Creative';
import type { CreativeFilter, CreativeRepository } from '../../services/CreativeService';

export class MockCreativeRepository implements CreativeRepository {
  private readonly creatives: Map<string, Creative> = new Map();

  seed(creatives: Creative[]): void {
    for (const c of creatives) {
      this.creatives.set(c.id, c);
    }
  }

  async findById(id: string): Promise<Creative | null> {
    return this.creatives.get(id) ?? null;
  }

  async findAll(filter?: CreativeFilter): Promise<Creative[]> {
    let results = Array.from(this.creatives.values());
    if (filter?.campaignId) {
      results = results.filter((c) => c.campaignId === filter.campaignId);
    }
    if (filter?.status) {
      results = results.filter((c) => c.status === filter.status);
    }
    return results;
  }

  async save(creative: Creative): Promise<Creative> {
    this.creatives.set(creative.id, creative);
    return creative;
  }

  async delete(id: string): Promise<void> {
    this.creatives.delete(id);
  }
}