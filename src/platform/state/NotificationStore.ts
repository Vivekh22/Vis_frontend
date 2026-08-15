/**
 * NotificationStore.ts — platform/state/
 *
 * Purpose:
 *   Concrete Store for notifications. unreadCount is always DERIVED from items
 *   inside the store's own update logic — never trusted to be set correctly by
 *   each caller. This removes an entire bug class (badge-count drift between the
 *   items list and the count, a common source of UI bugs).
 *
 * clear():
 *   Resets all notifications. Used on logout / user switch so notifications from
 *   a previous session never leak into the next.
 */
import { Store } from './Store';

export interface NotificationItem {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly read: boolean;
  readonly createdAt: Date;
}

export interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
}

const INITIAL_NOTIFICATION_STATE: NotificationState = {
  items: [],
  unreadCount: 0,
};

class NotificationStoreImpl {
  private readonly store: Store<NotificationState> = new Store<NotificationState>(
    INITIAL_NOTIFICATION_STATE,
  );

  public getState(): NotificationState {
    return this.store.getState();
  }

  public subscribe(
    callback: (newState: NotificationState, previousState: NotificationState) => void,
  ): () => void {
    return this.store.subscribe(callback);
  }

  /** Adds a notification (unread by default) and recomputes unreadCount. */
  public addNotification(item: { title: string; body: string }): void {
    const current = this.store.getState();
    const full: NotificationItem = {
      id: this.generateId(),
      title: item.title,
      body: item.body,
      read: false,
      createdAt: new Date(),
    };
    const items = [full, ...current.items];
    this.store.setState({ items, unreadCount: items.filter((n) => !n.read).length });
  }

  /** Marks a single notification as read and recomputes unreadCount. */
  public markAsRead(id: string): void {
    const current = this.store.getState();
    const items = current.items.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.store.setState({ items, unreadCount: items.filter((n) => !n.read).length });
  }

  /** Marks all notifications as read and recomputes unreadCount. */
  public markAllAsRead(): void {
    const current = this.store.getState();
    const items = current.items.map((n) => ({ ...n, read: true }));
    this.store.setState({ items, unreadCount: 0 });
  }

  /** Clears all notifications. Use on logout / user switch. */
  public clear(): void {
    this.store.setState(INITIAL_NOTIFICATION_STATE);
  }

  private generateId(): string {
    return `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export const notificationStore = new NotificationStoreImpl();