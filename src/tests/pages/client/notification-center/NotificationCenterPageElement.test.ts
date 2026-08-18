// @ts-nocheck
/**
 * NotificationCenterPageElement.test.ts — tests/pages/client/notification-center/
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationCenterPageElement } from '../../../../pages/client/notification-center/NotificationCenterPageElement';

vi.mock('../../../../services', () => ({
  notificationService: {
    fetchNotifications: vi.fn().mockResolvedValue(undefined),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

import '../../../../pages/client/notification-center/NotificationCenterPageElement';

describe('NotificationCenterPageElement', () => {
  let el: NotificationCenterPageElement;

  beforeEach(() => {
    el = document.createElement('notification-center-page') as NotificationCenterPageElement;
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (el.parentNode) document.body.removeChild(el);
  });

  it('renders page title', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('.page-title')?.textContent).toBe('Notification Center');
  });

  it('renders category filter tabs', async () => {
    await new Promise((r) => setTimeout(r, 50));
    const tabs = el.shadowRoot!.querySelectorAll('.filter-tab');
    expect(tabs.length).toBeGreaterThanOrEqual(7);
  });

  it('renders Mark All as Read button', async () => {
    await new Promise((r) => setTimeout(r, 50));
    expect(el.shadowRoot!.querySelector('[data-action="mark-all-read"]')).not.toBeNull();
  });
});