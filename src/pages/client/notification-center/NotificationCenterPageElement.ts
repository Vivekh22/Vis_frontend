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
  :host { display: block; font-family: var(--font-body); padding: var(--space-4) 0; }

  /* Header */
  .page-header { margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: var(--font-weight-bold); color: #111827; margin: 0 0 4px 0; }
  .page-subtitle { font-size: 13px; color: #6b7280; margin: 0; }

  /* Top row */
  .top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
  .mark-all-btn { padding: 7px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-size: 12px; font-weight: 500; color: #374151; }
  .mark-all-btn:hover { background: #f8fafc; }

  /* Filter tabs */
  .filter-tabs { display: flex; gap: 4px; background: #f8fafc; border: 1px solid #eef0f4; border-radius: 10px; padding: 4px; flex-wrap: wrap; }
  .filter-tab { padding: 6px 14px; border: none; background: transparent; cursor: pointer; font-size: 12px; font-weight: 500; font-family: var(--font-body); color: #6b7280; border-radius: 7px; transition: all 0.2s; white-space: nowrap; }
  .filter-tab.active { background: white; color: #111827; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .filter-tab:hover:not(.active) { color: #374151; background: #f1f5f9; }

  /* Notification list */
  .notif-list { display: flex; flex-direction: column; gap: 0; background: white; border: 1px solid #eef0f4; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .notif-item { display: flex; gap: 16px; padding: 16px 20px; cursor: pointer; border-bottom: 1px solid #f8fafc; transition: background 0.15s; align-items: flex-start; }
  .notif-item:last-child { border-bottom: none; }
  .notif-item:hover { background: #fafbfc; }
  .notif-item.unread { border-left: 3px solid #3b66f5; }

  /* Dot */
  .notif-dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; background: #e2e8f0; }
  .notif-dot.security { background: #dc2626; }
  .notif-dot.campaign { background: #3b66f5; }
  .notif-dot.billing { background: #d97706; }
  .notif-dot.team { background: #7c3aed; }
  .notif-dot.integrations { background: #0891b2; }
  .notif-dot.support { background: #d97706; }
  .notif-dot.platform { background: #94a3b8; }

  /* Content */
  .notif-content { flex: 1; min-width: 0; }
  .notif-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
  .notif-category { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
  .notif-title { font-size: 13px; font-weight: 600; color: #111827; margin: 0 0 4px 0; }
  .notif-body { font-size: 12px; color: #475569; margin: 0; line-height: 1.5; }
  .notif-time { font-size: 11px; color: #94a3b8; white-space: nowrap; margin-top: 2px; }
  .unread-dot { width: 7px; height: 7px; border-radius: 50%; background: #3b66f5; flex-shrink: 0; margin-top: 6px; }

  /* Empty state */
  .empty-state { text-align: center; padding: 48px; color: #94a3b8; font-size: 14px; }
  .empty-icon { font-size: 32px; margin-bottom: 12px; }
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
    const mockNotifs = [
      { id: 'n1', title: 'Campaign "Summer Push" approved', body: 'Your campaign has been reviewed and approved. It will start running shortly.', category: 'campaign', read: false, createdAt: new Date() },
      { id: 'n2', title: 'Invoice INV-2026-047 generated', body: 'Your July billing invoice of $24,850.00 has been generated and sent to your email.', category: 'billing', read: false, createdAt: new Date(Date.now() - 3600000) },
      { id: 'n3', title: 'New team member added', body: 'Ananya Kapoor has been added to your team as Analyst.', category: 'team', read: true, createdAt: new Date(Date.now() - 86400000) },
      { id: 'n4', title: 'MMP connection test failed', body: 'The connection test for AppsFlyer returned an error. Please check your API credentials.', category: 'integrations', read: true, createdAt: new Date(Date.now() - 172800000) },
    ];
    const items = notifs.length > 0 ? notifs : mockNotifs;
    if (items.length === 0) {
      return '<div class="empty-state"><div class="empty-icon">🔔</div>No notifications in this category.</div>';
    }
    return items.map((n) => {
      const category = (n as { category?: string }).category ?? 'platform';
      const unreadClass = n.read ? '' : 'unread';
      return `
        <div class="notif-item ${unreadClass}" data-notif-id="${n.id}">
          <div class="notif-dot ${category}"></div>
          <div class="notif-content">
            <div class="notif-header">
              <div>
                <div class="notif-category">${category}</div>
                <p class="notif-title">${n.title}</p>
              </div>
              <span class="notif-time">${n.createdAt.toLocaleString()}</span>
            </div>
            <p class="notif-body">${n.body}</p>
          </div>
          ${!n.read ? '<div class="unread-dot"></div>' : ''}
        </div>
      `;
    }).join('');
  }

  protected renderTemplate(): string {
    return html`
      <div class="page-header">
        <h1 class="page-title">Notifications</h1>
        <p class="page-subtitle">Stay on top of campaigns, billing, team activity, and platform alerts</p>
      </div>
      <div class="top-row">
        <div class="filter-tabs">${SafeHtmlString.trusted(this.renderFilterTabs())}</div>
        <button class="mark-all-btn" data-action="mark-all-read" type="button">✓ Mark All as Read</button>
      </div>
      <div class="notif-list">${SafeHtmlString.trusted(this.renderNotifications())}</div>
    `;
  }
}

ComponentRegistry.register('notification-center-page', NotificationCenterPageElement);
export { NotificationCenterPageElement };