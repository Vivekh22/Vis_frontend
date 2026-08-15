/**
 * MockAppListRepository.ts — repositories/mocks/
 *
 * In-memory mock for AppListRepository.
 */
import { AppListEntry } from '../../core/entities/AppListEntry';
import type { AppListRepository } from '../../services/AppListService';

export class MockAppListRepository implements AppListRepository {
  private readonly entries: Map<string, AppListEntry> = new Map();

  seed(entries: AppListEntry[]): void {
    for (const e of entries) this.entries.set(e.id, e);
  }

  async findById(id: string): Promise<AppListEntry | null> {
    return this.entries.get(id) ?? null;
  }

  async findAll(): Promise<AppListEntry[]> {
    return Array.from(this.entries.values());
  }

  async save(entry: AppListEntry): Promise<AppListEntry> {
    this.entries.set(entry.id, entry);
    return entry;
  }

  async delete(id: string): Promise<void> {
    this.entries.delete(id);
  }
}