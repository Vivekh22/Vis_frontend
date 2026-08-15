/**
 * NotificationService.test.ts — tests for services/NotificationService.
 *
 * Tests the ORCHESTRATION logic: fetch populates store, markAsRead/markAllAsRead
 * update store and repo, polling starts/stops correctly.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../../services/NotificationService';
import type { NotificationRepository } from '../../services/NotificationService';
import type { NotificationItem } from '../../platform/state/NotificationStore';
import { notificationStore } from '../../platform/state/NotificationStore';

class MockNotifRepo implements NotificationRepository {
  private items: NotificationItem[] = [];
  public markAsReadCalls: string[] = [];
  public markAllAsReadCalls: string[] = [];

  setItems(items: NotificationItem[]): void {
    this.items = items;
  }

  async fetchNotifications(_userId: string): Promise<NotificationItem[]> {
    return [...this.items];
  }

  async markAsRead(id: string): Promise<void> {
    this.markAsReadCalls.push(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.markAllAsReadCalls.push(userId);
  }
}

const sampleItem = (id: string, read = false): NotificationItem => ({
  id,
  title: `Title ${id}`,
  body: `Body ${id}`,
  read,
  createdAt: new Date(),
});

describe('NotificationService', () => {
  let repo: MockNotifRepo;

  beforeEach(() => {
    notificationStore.clear();
    repo = new MockNotifRepo();
  });

  it('fetchNotifications populates notificationStore', async () => {
    repo.setItems([sampleItem('n1'), sampleItem('n2', true)]);
    const svc = new NotificationService(repo);
    await svc.fetchNotifications('u1');
    const state = notificationStore.getState();
    expect(state.items.length).toBe(2);
    expect(state.unreadCount).toBe(1); // n2 is read, n1 is not
  });

  it('markAsRead updates store and calls repo', () => {
    repo.setItems([sampleItem('n1'), sampleItem('n2')]);
    const svc = new NotificationService(repo);
    // Populate store first
    return svc.fetchNotifications('u1').then(() => {
      svc.markAsRead('n1');
      const state = notificationStore.getState();
      expect(state.items.find((n) => n.id === 'n1')?.read).toBe(true);
      expect(state.unreadCount).toBe(1); // n2 still unread
      expect(repo.markAsReadCalls).toContain('n1');
    });
  });

  it('markAllAsRead updates store and calls repo', () => {
    repo.setItems([sampleItem('n1'), sampleItem('n2')]);
    const svc = new NotificationService(repo);
    return svc.fetchNotifications('u1').then(() => {
      svc.markAllAsRead('u1');
      const state = notificationStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(repo.markAllAsReadCalls).toContain('u1');
    });
  });

  it('startPolling fetches immediately and at interval', async () => {
    vi.useFakeTimers();
    repo.setItems([sampleItem('n1')]);
    const svc = new NotificationService(repo);
    const spy = vi.spyOn(repo, 'fetchNotifications');
    svc.startPolling('u1', 5000);
    // Initial fetch
    await vi.advanceTimersByTimeAsync(0);
    expect(spy).toHaveBeenCalledTimes(1);
    // After interval
    await vi.advanceTimersByTimeAsync(5000);
    expect(spy).toHaveBeenCalledTimes(2);
    svc.stopPolling();
    vi.useRealTimers();
  });

  it('stopPolling stops the interval', async () => {
    vi.useFakeTimers();
    repo.setItems([sampleItem('n1')]);
    const svc = new NotificationService(repo);
    const spy = vi.spyOn(repo, 'fetchNotifications');
    svc.startPolling('u1', 1000);
    await vi.advanceTimersByTimeAsync(0);
    expect(spy).toHaveBeenCalledTimes(1);
    svc.stopPolling();
    await vi.advanceTimersByTimeAsync(5000);
    expect(spy).toHaveBeenCalledTimes(1); // No more calls
    vi.useRealTimers();
  });
});