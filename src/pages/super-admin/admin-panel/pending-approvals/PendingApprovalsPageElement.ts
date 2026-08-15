/**
 * PendingApprovalsPageElement.ts — pages/super-admin/admin-panel/pending-approvals/
 *
 * The SAME ApprovalQueueElement from Part 2, here with ZERO client-
 * allowlist filtering — every pending item platform-wide.
 *
 * This is a genuine reuse with a "no scope restriction" parameter
 * (passing undefined for allowedClientIds), not a rebuilt component.
 */
import { BaseComponent } from '../../../../platform/component/BaseComponent';
import { ComponentRegistry } from '../../../../platform/component/ComponentRegistry';
import { injectStyles, injectGlobalTokens } from '../../../../platform/component/ShadowRenderMixin';
import { html } from '../../../../platform/rendering/SafeHtml';
import { approvalService } from '../../../../services';
import type { ApprovalQueueItem } from '../../../../components/approval-queue/ApprovalQueueElement';

const STYLES = `
  :host { display: block; font-family: var(--font-body); }
  .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 var(--space-6); }
  .note { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0 0 var(--space-4); }
`;

interface ApprovalQueueHost extends HTMLElement {
  items: ApprovalQueueItem[];
}

class PendingApprovalsPageElement extends BaseComponent {
  private isLoading = true;

  constructor() {
    super();
    injectGlobalTokens(this.shadow);
    injectStyles(this.shadow, STYLES);
  }

  protected onMount(): void {
    this.shadow.addEventListener('approval-action', this.handleApprovalAction);
    void this.loadData();
  }

  protected onUnmount(): void {
    this.shadow.removeEventListener('approval-action', this.handleApprovalAction);
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.rerender();
    try {
      // ZERO client-allowlist filtering — every pending item platform-wide.
      // Passing undefined for allowedClientIds means no scope restriction.
      const items = await approvalService.listPendingApprovals(undefined);
      const queue = this.shadow.querySelector<ApprovalQueueHost>('approval-queue');
      if (queue) {
        queue.items = items;
      }
    } catch {
      // Use empty state
    }
    this.isLoading = false;
    this.rerender();
  }

  private handleApprovalAction = (event: Event): void => {
    const detail = (event as CustomEvent).detail;
    if (detail.action === 'approve') {
      void approvalService.approveItem(detail.itemId, detail.note).then(() => this.loadData());
    } else if (detail.action === 'reject') {
      void approvalService.rejectItem(detail.itemId, detail.note).then(() => this.loadData());
    } else if (detail.action === 'request-changes') {
      void approvalService.requestChanges(detail.itemId, detail.note).then(() => this.loadData());
    }
  };

  protected renderTemplate(): string {
    if (this.isLoading) {
      return '<loading-state variant="skeleton" shape="card"></loading-state>';
    }
    return html`
      <h1 class="page-title">Pending Approvals (Platform-Wide)</h1>
      <p class="note">All pending approval items across the entire platform — no client scope restriction.</p>
      <approval-queue></approval-queue>
    `;
  }
}

ComponentRegistry.register('super-admin-pending-approvals', PendingApprovalsPageElement);
export { PendingApprovalsPageElement };