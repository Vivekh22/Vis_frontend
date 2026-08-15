/**
 * MockAudienceRepository.ts — repositories/mocks/
 *
 * In-memory mock for AudienceRepository.
 */
import { AudienceList } from '../../core/entities/AudienceList';
import type { AudienceRepository } from '../../services/AudienceService';

export class MockAudienceRepository implements AudienceRepository {
  private readonly lists: Map<string, AudienceList> = new Map();

  seed(lists: AudienceList[]): void {
    for (const l of lists) this.lists.set(l.id, l);
  }

  async findById(id: string): Promise<AudienceList | null> {
    return this.lists.get(id) ?? null;
  }

  async findAll(): Promise<AudienceList[]> {
    return Array.from(this.lists.values());
  }

  async save(list: AudienceList): Promise<AudienceList> {
    this.lists.set(list.id, list);
    return list;
  }

  async delete(id: string): Promise<void> {
    this.lists.delete(id);
  }
}