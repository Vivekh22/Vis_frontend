// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { notificationStore } from '../../../platform/state/NotificationStore';
import { NotificationBellElement } from '../../../components/notification-bell/NotificationBellElement';
import '../../../components/notification-bell/NotificationBellElement';

describe('NotificationBellElement', () => {
  beforeEach(() => { notificationStore.clear(); });

  it('badge count reflects notificationStore unreadCount', () => {
    notificationStore.addNotification({ title: 'Test', body: 'Body' });
    notificationStore.addNotification({ title: 'Test2', body: 'Body2' });
    const el = document.createElement('notification-bell') as NotificationBellElement;
    document.body.appendChild(el);
    const badge = el.shadowRoot!.querySelector('.badge');
    expect(badge?.textContent).toBe('2');
    document.body.removeChild(el);
  });

  it('badge is absent when unreadCount is zero', () => {
    const el = document.createElement('notification-bell') as NotificationBellElement;
    document.body.appendChild(el);
    expect(el.shadowRoot!.querySelector('.badge')).toBeNull();
    document.body.removeChild(el);
  });

  it('clicking the bell toggles the dropdown', () => {
    const el = document.createElement('notification-bell') as NotificationBellElement;
    document.body.appendChild(el);
    expect(el.shadowRoot!.querySelector('.dropdown')).toBeNull();
    const btn = el.shadowRoot!.querySelector('[data-action="toggle"]') as HTMLButtonElement;
    btn.click();
    expect(el.shadowRoot!.querySelector('.dropdown')).not.toBeNull();
    // Re-query after re-render — the previous button reference is now detached
    const btnAfterRerender = el.shadowRoot!.querySelector('[data-action="toggle"]') as HTMLButtonElement;
    btnAfterRerender.click();
    expect(el.shadowRoot!.querySelector('.dropdown')).toBeNull();
    document.body.removeChild(el);
  });

  it('clicking a notification calls markAsRead and emits notification-clicked', () => {
    notificationStore.addNotification({ title: 'Test', body: 'Body' });
    const el = document.createElement('notification-bell') as NotificationBellElement;
    document.body.appendChild(el);
    // Open dropdown
    (el.shadowRoot!.querySelector('[data-action="toggle"]') as HTMLButtonElement).click();
    let eventDetail: { id: string } | null = null;
    el.addEventListener('notification-clicked', (e) => { eventDetail = (e as CustomEvent).detail; });
    const item = el.shadowRoot!.querySelector('[data-notification-id]') as HTMLElement;
    item.click();
    expect(eventDetail).not.toBeNull();
    expect(notificationStore.getState().unreadCount).toBe(0);
    document.body.removeChild(el);
  });
});