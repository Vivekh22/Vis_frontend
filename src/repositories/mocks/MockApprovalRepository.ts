/**
 * MockApprovalRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of ApprovalRepository for ApprovalService.
 * Records approve/reject/requestChanges calls for test verification.
 * Temporary — real repository implementations in Part 6.
 */
import type { ApprovalItem } from '../../core/entities/ApprovalItem';
import type { ApprovalFilter, ApprovalRepository } from '../../services/ApprovalService';

export interface RecordedAction {
  id: string;
  action: 'approve' | 'reject' | 'request-changes';
  note: string;
  actorId: string;
}

export class MockApprovalRepository implements ApprovalRepository {
  private readonly items: Map<string, ApprovalItem> = new Map();
  public readonly actions: RecordedAction[] = [];

  seed(items: ApprovalItem[]): void {
    for (const item of items) {
      this.items.set(item.id, item);
    }
  }

  async findById(id: string): Promise<ApprovalItem | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(filter?: ApprovalFilter): Promise<ApprovalItem[]> {
    let results = Array.from(this.items.values());
    if (filter?.status) {
      results = results.filter((i) => i.status === filter.status);
    }
    if (filter?.clientId) {
      results = results.filter((i) => i.clientId === filter.clientId);
    }
    return results;
  }

  async approve(id: string, note: string, actorId: string): Promise<void> {
    this.actions.push({ id, action: 'approve', note, actorId });
  }

  async reject(id: string, note: string, actorId: string): Promise<void> {
    this.actions.push({ id, action: 'reject', note, actorId });
  }

  async requestChanges(id: string, note: string, actorId: string): Promise<void> {
    this.actions.push({ id, action: 'request-changes', note, actorId });
  }
}