/**
 * ApprovalService.test.ts — tests for services/ApprovalService.
 *
 * Tests the ORCHESTRATION logic: note validation (defense in depth),
 * correct repository delegation, and isOverdue SLA comparison logic.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ApprovalService } from '../../services/ApprovalService';
import type { ApprovalRepository, ApprovalFilter } from '../../services/ApprovalService';
import type { ApprovalItem } from '../../core/entities/ApprovalItem';
import { ValidationError } from '../../core/errors/ValidationError';
import { authStore } from '../../platform/state/AuthStore';
import { User } from '../../core/entities/User';

class MockApprovalRepo implements ApprovalRepository {
  private items: Map<string, ApprovalItem> = new Map();
  public actions: { id: string; action: string; note: string; actorId: string }[] = [];

  seed(items: ApprovalItem[]): void {
    for (const i of items) this.items.set(i.id, i);
  }

  async findById(id: string): Promise<ApprovalItem | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(filter?: ApprovalFilter): Promise<ApprovalItem[]> {
    let results = Array.from(this.items.values());
    if (filter?.status) results = results.filter((i) => i.status === filter.status);
    if (filter?.clientId) results = results.filter((i) => i.clientId === filter.clientId);
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

describe('ApprovalService', () => {
  let repo: MockApprovalRepo;

  beforeEach(() => {
    authStore.logout();
    authStore.login(new User('u1', 'a@b.com', 'Admin', 'admin'));
    repo = new MockApprovalRepo();
  });

  describe('note validation (defense in depth)', () => {
    it('approveItem throws ValidationError when note is empty', async () => {
      const svc = new ApprovalService(repo);
      await expect(svc.approveItem('item-1', '')).rejects.toThrow(ValidationError);
    });

    it('approveItem throws ValidationError when note is whitespace only', async () => {
      const svc = new ApprovalService(repo);
      await expect(svc.approveItem('item-1', '   ')).rejects.toThrow(ValidationError);
    });

    it('rejectItem throws ValidationError when note is empty', async () => {
      const svc = new ApprovalService(repo);
      await expect(svc.rejectItem('item-1', '')).rejects.toThrow(ValidationError);
    });

    it('requestChanges throws ValidationError when note is empty', async () => {
      const svc = new ApprovalService(repo);
      await expect(svc.requestChanges('item-1', '')).rejects.toThrow(ValidationError);
    });

    it('approveItem succeeds with a valid note and delegates to repo', async () => {
      const svc = new ApprovalService(repo);
      await svc.approveItem('item-1', 'Looks good');
      expect(repo.actions).toHaveLength(1);
      expect(repo.actions[0]).toEqual({
        id: 'item-1', action: 'approve', note: 'Looks good', actorId: 'u1',
      });
    });

    it('rejectItem succeeds with a valid note and delegates to repo', async () => {
      const svc = new ApprovalService(repo);
      await svc.rejectItem('item-1', 'Rejected because...');
      expect(repo.actions[0]?.action).toBe('reject');
    });

    it('requestChanges succeeds with a valid note and delegates to repo', async () => {
      const svc = new ApprovalService(repo);
      await svc.requestChanges('item-1', 'Please fix...');
      expect(repo.actions[0]?.action).toBe('request-changes');
    });
  });

  describe('isOverdue', () => {
    it('returns true when slaDeadline is in the past', () => {
      const svc = new ApprovalService(repo);
      const item = { slaDeadline: new Date('2020-01-01'), submittedAt: new Date('2020-01-01') };
      expect(svc.isOverdue(item, 24)).toBe(true);
    });

    it('returns false when slaDeadline is in the future', () => {
      const svc = new ApprovalService(repo);
      const item = { slaDeadline: new Date('2099-01-01'), submittedAt: new Date('2020-01-01') };
      expect(svc.isOverdue(item, 24)).toBe(false);
    });

    it('returns true when slaDeadline is null and threshold exceeded', () => {
      const svc = new ApprovalService(repo);
      const submittedAt = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      const item = { slaDeadline: null, submittedAt };
      expect(svc.isOverdue(item, 24)).toBe(true); // 48h > 24h threshold
    });

    it('returns false when slaDeadline is null and threshold not exceeded', () => {
      const svc = new ApprovalService(repo);
      const submittedAt = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      const item = { slaDeadline: null, submittedAt };
      expect(svc.isOverdue(item, 24)).toBe(false); // 1h < 24h threshold
    });
  });
});