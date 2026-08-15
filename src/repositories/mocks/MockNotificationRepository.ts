/**
 * MockNotificationRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of NotificationRepository for NotificationService.
 * Temporary — real repository implementations in Part 6.
 */
import type { NotificationItem } from '../../platform/state/NotificationStore';
import type { NotificationRepository } from '../../services/NotificationService';

export class MockNotificationRepository implements NotificationRepository {
  private readonly notifications: Map<string, NotificationItem[]> = new Map();
  private readonly readIds: Set<string> = new Set();

  setNotifications(userId: string, items: NotificationItem[]): void {
    this.notifications.set(userId, items);
  }

  async fetchNotifications(userId: string): Promise<NotificationItem[]> {
    const items = this.notifications.get(userId) ?? [];
    return items.map((n) => ({ ...n, read: this.readIds.has(n.id) || n.read }));
  }

  async markAsRead(id: string): Promise<void> {
    this.readIds.add(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const items = this.notifications.get(userId) ?? [];
    for (const item of items) {
      this.readIds.add(item.id);
    }
  }
}