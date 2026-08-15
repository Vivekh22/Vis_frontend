/**
 * NotificationService.ts — services/
 *
 * Purpose:
 *   Orchestrates fetching notifications via a NotificationRepository and
 *   pushing them into notificationStore. Also provides markAsRead /
 *   markAllAsRead pass-throughs.
 *
 *   startPolling(intervalMs) / stopPolling() provide near-real-time
 *   notification delivery via setInterval. A production version would
 *   likely use Server-Sent Events or WebSockets instead — documented here
 *   but out of scope for this part.
 */
import type { NotificationItem } from '../platform/state/NotificationStore';
import { notificationStore } from '../platform/state/NotificationStore';

export interface NotificationRepository {
  fetchNotifications(userId: string): Promise<NotificationItem[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}

export class NotificationService {
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly notifRepo: NotificationRepository) {}

  async fetchNotifications(userId: string): Promise<void> {
    const items = await this.notifRepo.fetchNotifications(userId);
    notificationStore.setNotifications(items);
  }

  markAsRead(id: string): void {
    notificationStore.markAsRead(id);
    void this.notifRepo.markAsRead(id);
  }

  markAllAsRead(userId: string): void {
    notificationStore.markAllAsRead();
    void this.notifRepo.markAllAsRead(userId);
  }

  startPolling(userId: string, intervalMs: number = 30_000): void {
    this.stopPolling();
    void this.fetchNotifications(userId);
    this.pollingTimer = setInterval(() => {
      void this.fetchNotifications(userId);
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}