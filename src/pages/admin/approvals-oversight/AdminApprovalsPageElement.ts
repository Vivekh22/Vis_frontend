/**
 * AdminApprovalsPageElement.ts — pages/admin/approvals-oversight/
 *
 * Reuses the SAME ApprovalQueueElement from Part 2, filtered to this
 * Admin's allowedClientIds. Does NOT build a second approval-queue
 * component — the shared one is used with a scope parameter (the items
 * array is pre-filtered by the caller).
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../platform/rendering/SafeHtml';
import { approvalService } from '../../../../services';
import { authStore } from '../../../../platform/state/AuthStore';
import type { ApprovalQueueItem } from '../../../../components/approval-queue/ApprovalQueueElement';

interface ApprovalQueueHost extends HTMLElement {
  items: ApprovalQueueItem[];
}

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
`;

class AdminApprovalsPageElement extends BaseComponent {
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    void this.loadApprovals();
  }

  private async loadApprovals(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      const user = authStore.getState().currentUser;
      const clientIds = user?.allowedClientIds;
      const items = await approvalService.listPendingApprovals(clientIds);
      const queue = this.shadow.querySelector<ApprovalQueueHost>('approval-queue');
      if (queue) {
        queue.items = items;
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
      <h1 class="page-title">Pending Approvals</h1>
      <approval-queue></approval-queue>
    `;
  }
}

ComponentRegistry.register('admin-approvals', AdminApprovalsPageElement);
export { AdminApprovalsPageElement };