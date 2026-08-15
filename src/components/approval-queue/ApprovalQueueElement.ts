/**
 * ApprovalQueueElement.ts — components/approval-queue/
 *
 * Purpose:
 *   The second universally-shared component. Renders the approval queue with
 *   tab filtering (All/Campaigns/Creatives/Overdue) and Approve/Reject/
 *   Request Changes actions — each requiring the mandatory-note flow.
 *
 * Architectural decision — client-side tab filtering (unlike ActivityLog):
 *   ActivityLogElement delegates filtering upward because activity logs can be
 *   large and filtering may be server-side. THIS component filters tabs
 *   client-side because the approval queue is realistically bounded in size
 *   (a queue that's already fully fetched for the current view) and the four
 *   tabs are a simple, pure client-side filter with no security implication.
 *   This is an intentional, different decision — documented here.
 *
 * Action flow:
 *   Clicking an action button does NOT perform the action directly. It opens
 *   a MandatoryNoteDialogElement (dynamically created and appended) with an
 *   appropriate actionDescription. Only once the dialog's onConfirm fires with
 *   a valid note does this component emit 'approval-action' with
 *   { itemId, action, note }. This component NEVER calls ApiClient or any
 *   repository directly — it only emits intent.
 */
import { BaseComponent } from '../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../platform/component/ShadowRenderMixin';
import { html, SafeHtmlString } from '../../platform/rendering/SafeHtml';
import { MandatoryNoteDialogElement } from '../mandatory-note-dialog/MandatoryNoteDialogElement';

export type ApprovalQueueTab = 'all' | 'campaigns' | 'creatives' | 'overdue';
export type ApprovalAction = 'approve' | 'reject' | 'request-changes';

export interface ApprovalQueueItem {
  id: string;
  type: 'campaign' | 'creative';
  client: string | null;
  submittedBy: string;
  submittedAt: Date;
  slaDeadline: Date | null;
  /** Computed by the CALLER (services/ApprovalService.ts), not this component. */
  isOverdue: boolean;
  summary: string;
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .tabs {
    display: flex;
    gap: var(--space-1);
    margin-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }
  .tab {
    padding: var(--space-2) var(--space-4);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    font-family: var(--font-body);
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }
  .tab--active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }
  .tab-badge {
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    border-radius: var(--radius-full);
    padding: 0 6px;
    font-size: var(--font-size-xs);
    min-width: 18px;
    text-align: center;
    line-height: 18px;
  }
  .tab-badge--active {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
  }
  .queue-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .queue-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    gap: var(--space-3);
  }
  .queue-item--overdue {
    border-color: var(--color-danger);
    border-left-width: 4px;
  }
  .overdue-indicator {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-danger);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  .queue-info { flex: 1; min-width: 0; }
  .queue-summary {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
    margin: 0 0 var(--space-1);
  }
  .queue-meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }
  .actions {
    display: flex;
    gap: var(--space-1);
    flex-shrink: 0;
  }
  .btn {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    border: 1px solid transparent;
    font-family: var(--font-body);
  }
  .btn--approve { background: var(--color-success); color: #fff; }
  .btn--reject { background: var(--color-danger); color: #fff; }
  .btn--changes { background: var(--color-surface); color: var(--color-text-primary); border-color: var(--color-border); }
  .empty-state {
    padding: var(--space-8) var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
`;

class ApprovalQueueElement extends BaseComponent {
  private _items: ApprovalQueueItem[] = [];
  private _activeTab: ApprovalQueueTab = 'all';
  private dialogEl: MandatoryNoteDialogElement | null = null;
  private pendingAction: { item: ApprovalQueueItem; action: ApprovalAction } | null = null;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  public set items(value: ApprovalQueueItem[]) {
    this._items = value;
    this.rerender();
  }

  public set activeTab(value: ApprovalQueueTab) {
    this._activeTab = value;
    this.rerender();
  }

  protected onMount(): void {
    this.shadow.addEventListener('click', this.handleClick);
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('click', this.handleClick);
    if (this.dialogEl) {
      this.dialogEl.remove();
      this.dialogEl = null;
    }
  }

  private handleClick = (event: Event): void => {
    const target = event.target as HTMLElement;

    // Tab switching
    const tabEl = target.closest('[data-tab]');
    if (tabEl) {
      const tab = tabEl.getAttribute('data-tab') as ApprovalQueueTab | null;
      if (tab) {
        this._activeTab = tab;
        this.rerender();
      }
      return;
    }

    // Action buttons
    const actionEl = target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.getAttribute('data-action') as ApprovalAction | null;
      const itemId = actionEl.getAttribute('data-item-id');
      if (!action || !itemId) return;
      const item = this._items.find((i) => i.id === itemId);
      if (!item) return;
      this.openNoteDialog(item, action);
    }
  };

  private openNoteDialog(item: ApprovalQueueItem, action: ApprovalAction): void {
    // Dynamically create and append a MandatoryNoteDialogElement
    if (!this.dialogEl) {
      this.dialogEl = new MandatoryNoteDialogElement();
      document.body.appendChild(this.dialogEl);
    }

    const actionVerb: Record<ApprovalAction, string> = {
      approve: 'Approve',
      reject: 'Reject',
      'request-changes': 'Request changes for',
    };
    const typeLabel = item.type === 'campaign' ? 'campaign' : 'creative';
    const clientLabel = item.client ? ` for ${item.client}` : '';

    this.pendingAction = { item, action };
    this.dialogEl.open({
      actionDescription: `${actionVerb[action]} ${typeLabel} '${item.summary}'${clientLabel}`,
      onConfirm: (note: string) => {
        if (this.pendingAction) {
          this.emit('approval-action', {
            itemId: this.pendingAction.item.id,
            action: this.pendingAction.action,
            note,
          });
        }
        this.pendingAction = null;
      },
      onCancel: () => {
        this.pendingAction = null;
      },
    });
  }

  private getFilteredItems(): ApprovalQueueItem[] {
    switch (this._activeTab) {
      case 'campaigns':
        return this._items.filter((i) => i.type === 'campaign');
      case 'creatives':
        return this._items.filter((i) => i.type === 'creative');
      case 'overdue':
        return this._items.filter((i) => i.isOverdue);
      default:
        return this._items;
    }
  }

  private getTabCounts(): Record<ApprovalQueueTab, number> {
    return {
      all: this._items.length,
      campaigns: this._items.filter((i) => i.type === 'campaign').length,
      creatives: this._items.filter((i) => i.type === 'creative').length,
      overdue: this._items.filter((i) => i.isOverdue).length,
    };
  }

  protected renderTemplate(): string {
    const counts = this.getTabCounts();
    const filtered = this.getFilteredItems();

    const tabs: { key: ApprovalQueueTab; label: string }[] = [
      { key: 'all', label: 'All' },
      { key: 'campaigns', label: 'Campaigns' },
      { key: 'creatives', label: 'Creatives' },
      { key: 'overdue', label: 'Overdue' },
    ];

    const tabsHtml = tabs.map((tab) => {
      const isActive = this._activeTab === tab.key;
      const badgeClass = isActive ? 'tab-badge tab-badge--active' : 'tab-badge';
      return html`
        <button class="tab ${isActive ? 'tab--active' : ''}" data-tab="${tab.key}" type="button">
          ${tab.label} <span class="${badgeClass}">${counts[tab.key]}</span>
        </button>
      `;
    }).join('');

    if (filtered.length === 0) {
      return html`
        <div class="tabs">${SafeHtmlString.trusted(tabsHtml)}</div>
        <div class="empty-state">No items in this queue</div>
      `;
    }

    const itemsHtml = filtered.map((item) => {
      const itemClass = item.isOverdue ? 'queue-item queue-item--overdue' : 'queue-item';
      const overdueBadge = item.isOverdue
        ? '<span class="overdue-indicator">⚠ OVERDUE</span>'
        : '';
      return html`
        <div class="${itemClass}">
          <div class="queue-info">
            <p class="queue-summary">${item.summary}${SafeHtmlString.trusted(overdueBadge ? ' ' + overdueBadge : '')}</p>
            <p class="queue-meta">Submitted by ${item.submittedBy}${item.client ? ' · ' + item.client : ''}</p>
          </div>
          <div class="actions">
            <button class="btn btn--approve" data-action="approve" data-item-id="${item.id}" type="button">Approve</button>
            <button class="btn btn--reject" data-action="reject" data-item-id="${item.id}" type="button">Reject</button>
            <button class="btn btn--changes" data-action="request-changes" data-item-id="${item.id}" type="button">Request Changes</button>
          </div>
        </div>
      `;
    }).join('');

    return html`
      <div class="tabs">${SafeHtmlString.trusted(tabsHtml)}</div>
      <div class="queue-list">${SafeHtmlString.trusted(itemsHtml)}</div>
    `;
  }
}

ComponentRegistry.register('approval-queue', ApprovalQueueElement);
export { ApprovalQueueElement };
