/**
 * NotificationBellElement.ts — components/notification-bell/
 *
 * Purpose:
 *   Renders a bell icon with a numeric unread-count badge and a dropdown
 *   preview of recent notifications. Subscribes to notificationStore.
 *
 * Lifecycle:
 *   onMount   → subscribes to notificationStore, stores unsubscribe function.
 *   onUnmount → calls the unsubscribe function.
 *
 * Interaction:
 *   - Clicking the bell toggles the dropdown open/closed.
 *   - Clicking a notification item calls notificationStore.markAsRead(id)
 *     and emits 'notification-clicked' with the notification's id.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { notificationStore } from '../../platform/state/NotificationStore';

const STYLES = `
  :host { display: inline-block; position: relative; }
  .bell-btn {
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2);
    font-size: var(--font-size-xl);
    line-height: 1;
  }
  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--color-danger);
    color: var(--color-danger-foreground);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    border-radius: var(--radius-full);
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    font-family: var(--font-body);
  }
  .dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    min-width: 280px;
    max-width: 360px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    max-height: 400px;
    overflow-y: auto;
    z-index: 100;
  }
  .notif-item {
    padding: var(--space-3);
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    font-family: var(--font-body);
  }
  .notif-item:hover { background: var(--color-surface); }
  .notif-item--unread { font-weight: var(--font-weight-semibold); }
  .notif-title {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-1);
  }
  .notif-body {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }
  .dropdown-empty {
    padding: var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-family: var(--font-body);
  }
`;

class NotificationBellElement extends BaseComponent {
  private unsubscribe: (() => void) | null = null;
  private isDropdownOpen = false;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.unsubscribe = notificationStore.subscribe(() => this.rerender());
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-action="toggle"]')) {
      this.isDropdownOpen = !this.isDropdownOpen;
      this.rerender();
      return;
    }
    const notifItem = target.closest('[data-notification-id]');
    if (notifItem) {
      const id = notifItem.getAttribute('data-notification-id');
      if (id) {
        notificationStore.markAsRead(id);
        this.emit('notification-clicked', { id });
      }
    }
  };

  protected renderTemplate(): string {
    const state = notificationStore.getState();
    const unread = state.unreadCount;
    return html`
      <button class="bell-btn" data-action="toggle" type="button" aria-label="Notifications">
        🔔
        ${unread > 0 ? SafeHtmlString.trusted(`<span class="badge">${unread}</span>`) : ''}
      </button>
      ${this.isDropdownOpen ? SafeHtmlString.trusted(this.renderDropdown(state)) : ''}
    `;
  }

  private renderDropdown(state: { items: { id: string; title: string; body: string; read: boolean }[] }): string {
    if (state.items.length === 0) {
      return '<div class="dropdown"><div class="dropdown-empty">No notifications</div></div>';
    }
    const items = state.items.slice(0, 10).map((item) => {
      const itemClass = item.read ? 'notif-item' : 'notif-item notif-item--unread';
      return html`
        <div class="${itemClass}" data-notification-id="${item.id}">
          <p class="notif-title">${item.title}</p>
          <p class="notif-body">${item.body}</p>
        </div>
      `;
    });
    return '<div class="dropdown">' + items.join('') + '</div>';
  }
}

ComponentRegistry.register('notification-bell', NotificationBellElement);
export { NotificationBellElement };
