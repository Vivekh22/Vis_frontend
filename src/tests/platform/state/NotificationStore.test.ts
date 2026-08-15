/**
 * NotificationStore.test.ts — unit tests for platform/state/NotificationStore.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { notificationStore } from '../../../platform/state/NotificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    notificationStore.clear();
  });

  it('addNotification increments unreadCount', () => {
    notificationStore.addNotification({ title: 't', body: 'b' });
    expect(notificationStore.getState().unreadCount).toBe(1);
  });

  it('markAsRead decrements unreadCount', () => {
    notificationStore.addNotification({ title: 't', body: 'b' });
    const id = notificationStore.getState().items[0]!.id;
    notificationStore.markAsRead(id);
    expect(notificationStore.getState().unreadCount).toBe(0);
  });

  it('markAllAsRead sets unreadCount to 0', () => {
    notificationStore.addNotification({ title: 'a', body: 'b' });
    notificationStore.addNotification({ title: 'c', body: 'd' });
    expect(notificationStore.getState().unreadCount).toBe(2);
    notificationStore.markAllAsRead();
    expect(notificationStore.getState().unreadCount).toBe(0);
  });

  it('unreadCount is derived — never drifts from items', () => {
    notificationStore.addNotification({ title: 'a', body: 'b' });
    notificationStore.addNotification({ title: 'c', body: 'd' });
    const items = notificationStore.getState().items;
    const expected = items.filter((n) => !n.read).length;
    expect(notificationStore.getState().unreadCount).toBe(expected);
  });
});