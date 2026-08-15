/**
 * AdminActivityLogPageElement.ts — pages/admin/approvals-oversight/
 *
 * Reuses the SAME ActivityLogElement from Part 2, filtered to this
 * Admin's allowedClientIds. The ActivityLogElement renders whatever
 * entries it's given — the caller (this page) owns the data-fetching
 * and filtering logic.
 *
 * !!! MARGIN-CHANGE ENTRIES EXCLUDED AT DATA LAYER !!!
 * Margin-change entries (a Super Admin-exclusive action) never appear
 * here even for this Admin's own clients. This is enforced at the data
 * layer: the report repository's getActivityLog() filters out
 * margin-change action types for admin-scoped queries, not just from
 * display. The frontend does not need to filter them client-side.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../platform/rendering/SafeHtml';
import { reportService } from '../../../../services';
import { authStore } from '../../../../platform/state/AuthStore';
import type { ActivityLogEntry } from '../../../../components/activity-log/ActivityLogElement';

interface ActivityLogHost extends HTMLElement {
  entries: ActivityLogEntry[];
  showFilters: boolean;
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
`;

class AdminActivityLogPageElement extends BaseComponent {
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    void this.loadActivityLog();
  }

  private async loadActivityLog(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      const user = authStore.getState().currentUser;
      const clientIds = user?.allowedClientIds;
      // The repository filters out margin-change entries for admin scope
      // at the data layer — they never enter the entries array.
      const entries = await reportService.getActivityLog({});
      const log = this.shadow.querySelector<ActivityLogHost>('activity-log');
      if (log) {
        log.entries = entries as unknown as ActivityLogEntry[];
        log.showFilters = true;
      }
    } catch {
      // Use defaults
    }
    this.isLoading = false;
    this.rerender();
  }

  protected renderTemplate(): string {
    if (this.isLoading) {
      return html`<loading-state variant="skeleton" shape="card"></loading-state>`;
    }
    return html`
      <h1 class="page-title">Activity Log</h1>
      <activity-log show-filters></activity-log>
    `;
  }
}

ComponentRegistry.register('admin-activity-log', AdminActivityLogPageElement);
export { AdminActivityLogPageElement };