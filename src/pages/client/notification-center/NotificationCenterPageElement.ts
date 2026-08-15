/**
 * NotificationCenterPageElement.ts — pages/client/notification-center/
 *
 * Full-page version of NotificationBellElement's dropdown, with category
 * filters, severity styling, mark-as-read, click-through.
 *
 * Severity colors reuse existing token patterns (StatusBadgeElement /
 * ErrorStateElement) — no new severity colors invented.
 */
import { BaseComponent } from '../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../../platform/rendering/SafeHtml';
import { notificationService } from '../../../services';
import { notificationStore } from '../../../platform/state/NotificationStore';
import type { NotificationItem } from '../../../platform/state/NotificationStore';
import { NotificationCategory } from '../../../core/enums/NotificationCategory';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: NotificationCategory.Security, label: 'Security' },
  { value: NotificationCategory.Campaign, label: 'Campaign' },
  { value: NotificationCategory.Billing, label: 'Billing' },
  { value: NotificationCategory.Team, label: 'Team' },
  { value: NotificationCategory.Integrations, label: 'Integrations' },
  { value: NotificationCategory.Support, label: 'Support' },
  { value: NotificationCategory.Platform, label: 'Platform' },
];

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-4); }
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
  .filter-tabs { display: flex; gap: var(--space-1); flex-wrap: wrap; }
  .filter-tab { padding: var(--space-1) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-full); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-xs); font-family: var(--font-body); color: var(--color-text-muted); }
  .filter-tab.active { background: var(--color-primary); color: var(--color-primary-foreground); border-color: var(--color-primary); }
  .mark-all-btn { padding: var(--space-1) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: var(--font-size-xs); color: var(--color-text-primary); }
  .notif-list { display: flex; flex-direction: column; gap: var(--space-2); }
  .notif-item { display: flex; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); cursor: pointer; }
  .notif-item.unread { border-left: 3px solid var(--color-primary); }
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: var(--space-1); flex-shrink: 0; }
  .notif-dot.security { background: var(--color-danger); }
  .notif-dot.campaign { background: var(--color-primary); }
  .notif-dot.billing { background: var(--color-warning); }
  .notif-dot.team { background: var(--color-primary); }
  .notif-dot.integrations { background: var(--color-primary); }
  .notif-dot.support { background: var(--color-warning); }
  .notif-dot.platform { background: var(--color-text-muted); }
  .notif-dot.unread { background: var(--color-primary); }
  .notif-content { flex: 1; }
  .notif-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0 0 var(--space-1); }
  .notif-body { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0 0 var(--space-1); }
  .notif-time { font-size: var(--font-size-xs); color: var(--color-text-muted); }
  .notif-category { font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .empty-state { text-align: center; padding: var(--space-8); color: var(--color-text-muted); font-size: var(--font-size-sm); }
`;

class NotificationCenterPageElement extends BaseComponent {
  private notifications: NotificationItem[] = [];
  private selectedCategory = 'all';

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
    void this.loadNotifications();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
  }

  private async loadNotifications(): Promise<void> {
    try {
      await notificationService.fetchNotifications('client-1');
    } catch {
      // Use defaults
    }
    const state = notificationStore.getState();
    this.notifications = state.items;
    this.rerender();
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const filterTab = target.closest('[data-category]');
    if (filterTab) {
      this.selectedCategory = filterTab.getAttribute('data-category') ?? 'all';
      this.rerender();
      return;
    }
    if (target.closest('[data-action="mark-all-read"]')) {
      notificationService.markAllAsRead('client-1');
      const state = notificationStore.getState();
      this.notifications = state.items;
      this.rerender();
      return;
    }
    const notifItem = target.closest('[data-notif-id]');
    if (notifItem) {
      const id = notifItem.getAttribute('data-notif-id') ?? '';
      notificationService.markAsRead(id);
      const state = notificationStore.getState();
      this.notifications = state.items;
      this.rerender();
      return;
    }
  };

  private get filteredNotifications(): NotificationItem[] {
    if (this.selectedCategory === 'all') return this.notifications;
    return this.notifications.filter((n) => (n.category ?? 'platform') === this.selectedCategory);
  }

  private renderFilterTabs(): string {
    return CATEGORIES.map((c) => `<button class="filter-tab ${this.selectedCategory === c.value ? 'active' : ''}" data-category="${c.value}" type="button">${c.label}</button>`).join('');
  }

  private renderNotifications(): string {
    const notifs = this.filteredNotifications;
    if (notifs.length === 0) {
      return '<div class="empty-state">No notifications in this category.</div>';
    }
    return notifs.map((n) => {
      const category = n.category ?? 'platform';
      const unreadClass = n.read ? '' : 'unread';
      const dotClass = n.read ? category : `${category} unread`;
      return `
        <div class="notif-item ${unreadClass}" data-notif-id="${n.id}">
          <div class="notif-dot ${dotClass}"></div>
          <div class="notif-content">
            <div class="notif-category">${category}</div>
            <p class="notif-title">${n.title}</p>
            <p class="notif-body">${n.body}</p>
            <span class="notif-time">${n.createdAt.toLocaleString()}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  protected renderTemplate(): string {
    return html`
      <h1 class="page-title">Notification Center</h1>
      <div class="header-row">
        <div class="filter-tabs">${SafeHtmlString.trusted(this.renderFilterTabs())}</div>
        <button class="mark-all-btn" data-action="mark-all-read" type="button">Mark All as Read</button>
      </div>
      <div class="notif-list">${SafeHtmlString.trusted(this.renderNotifications())}</div>
    `;
  }
}

ComponentRegistry.register('notification-center-page', NotificationCenterPageElement);
export { NotificationCenterPageElement };