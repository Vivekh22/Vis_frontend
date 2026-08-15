/**
 * ActivityLogPageElement.ts — pages/super-admin/admin-panel/activity-log/
 *
 * The SAME ActivityLogElement, zero filtering — every action by every
 * Admin and Super Admin, anywhere.
 *
 * This IS where margin-change entries appear (unlike Admin's scoped
 * version from Part 11, which filters by allowlist).
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../platform/rendering/SafeHtml';
import { reportService } from '../../../../services';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .note { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-4); }
`;

interface ActivityLogHost extends HTMLElement {
  entries: unknown[];
  showFilters: boolean;
  filters: Record<string, unknown>;
}

class ActivityLogPageElement extends BaseComponent {
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('filters-changed', this.handleFiltersChanged);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('filters-changed', this.handleFiltersChanged);
  }

  private async loadData(filters?: Record<string, unknown>): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      // ZERO filtering — every action by every Admin and Super Admin.
      // This IS where margin-change entries appear (unlike Admin's
      // scoped version which filters by allowlist).
      const entries = await reportService.getActivityLog({});
      const log = this.shadow.querySelector<ActivityLogHost>('activity-log');
      if (log) {
        log.entries = entries;
        log.showFilters = true;
        log.filters = filters ?? {};
      }
    } catch {
      // Use empty state
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleFiltersChanged = (event: Event): void => {
    const detail = (event as CustomEvent).detail;
    void this.loadData(detail);
  };

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    return html`
      <h1 class="page-title">Activity Log (Platform-Wide)</h1>
      <p class="note">Every action by every Admin and Super Admin — including margin-change entries.</p>
      <activity-log></activity-log>
    `;
  }
}

ComponentRegistry.register('super-admin-activity-log', ActivityLogPageElement);
export { ActivityLogPageElement };