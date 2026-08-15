/**
 * NotificationRepository.ts — repositories/
 *
 * Real implementation of the NotificationRepository interface from
 * NotificationService. Calls the notification API endpoints.
 *
 * Assumed endpoint shape (de facto API contract):
 *   GET /api/notifications?userId=:userId
 *     Response: NotificationItemDto[]
 *   POST /api/notifications/:id/read
 *   POST /api/notifications/read-all?userId=:userId
 *
 *   NotificationItemDto: {
 *     id: string, title: string, body: string,
 *     read: boolean, createdAt: string (ISO 8601)
 *   }
 */
import type { NotificationItem } from '../platform/state/NotificationStore';
import type { NotificationRepository as INotificationRepository } from '../services/NotificationService';
import { ApiClient } from './ApiClient';

interface NotificationItemDto {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export class NotificationRepository implements INotificationRepository {
  constructor(private readonly api: ApiClient) {}

  async fetchNotifications(userId: string): Promise<NotificationItem[]> {
    const dtos = await this.api.get<NotificationItemDto[]>(
      `/api/notifications?userId=${encodeURIComponent(userId)}`,
    );
    return dtos.map(this.mapNotification);
  }

  async markAsRead(id: string): Promise<void> {
    await this.api.post<void>(`/api/notifications/${encodeURIComponent(id)}/read`);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.api.post<void>(
      `/api/notifications/read-all?userId=${encodeURIComponent(userId)}`,
    );
  }

  private mapNotification(dto: NotificationItemDto): NotificationItem {
    return {
      id: dto.id,
      title: dto.title,
      body: dto.body,
      read: dto.read,
      createdAt: new Date(dto.createdAt),
    };
  }
}