/**
 * ApprovalService.ts — services/
 *
 * Purpose:
 *   The service ApprovalQueueElement's emitted 'approval-action' event
 *   should ultimately reach. approveItem / rejectItem / requestChanges each
 *   validate the note meets the mandatory-note requirement (defense in depth,
 *   even though MandatoryNoteDialogElement already validates client-side)
 *   and call the appropriate repository method.
 *
 *   Also owns isOverdue(item, slaThreshold) — the SLA-deadline-comparison
 *   logic that ApprovalQueueElement's Part 2 build explicitly deferred to
 *   "the caller."
 */
import { authStore } from '../platform/state/AuthStore';
import { ValidationError } from '../core/errors/ValidationError';
import type { ApprovalItem } from '../core/entities/ApprovalItem';
import type { CampaignStatus } from '../core/enums/CampaignStatus';
import type { CreativeStatus } from '../core/enums/CreativeStatus';
import type { ApprovalQueueItem } from '../components/approval-queue/ApprovalQueueElement';
import type { PlatformSettingsService } from './PlatformSettingsService';

export interface ApprovalFilter {
  status?: CampaignStatus | CreativeStatus;
  clientId?: string;
}

export interface ApprovalRepository {
  findById(id: string): Promise<ApprovalItem | null>;
  findAll(filter?: ApprovalFilter): Promise<ApprovalItem[]>;
  approve(id: string, note: string, actorId: string): Promise<void>;
  reject(id: string, note: string, actorId: string): Promise<void>;
  requestChanges(id: string, note: string, actorId: string): Promise<void>;
}

export interface SlaCheckable {
  slaDeadline: Date | null;
  submittedAt: Date;
}

export class ApprovalService {
  private readonly platformSettingsService: PlatformSettingsService | null = null;

  constructor(
    private readonly approvalRepo: ApprovalRepository,
    platformSettingsService?: PlatformSettingsService,
  ) {
    if (platformSettingsService) {
      this.platformSettingsService = platformSettingsService;
    }
  }

  async approveItem(itemId: string, note: string): Promise<void> {
    this.validateNote(note);
    const actorId = authStore.getState().currentUser?.id ?? 'system';
    await this.approvalRepo.approve(itemId, note, actorId);
  }

  async rejectItem(itemId: string, note: string): Promise<void> {
    this.validateNote(note);
    const actorId = authStore.getState().currentUser?.id ?? 'system';
    await this.approvalRepo.reject(itemId, note, actorId);
  }

  async requestChanges(itemId: string, note: string): Promise<void> {
    this.validateNote(note);
    const actorId = authStore.getState().currentUser?.id ?? 'system';
    await this.approvalRepo.requestChanges(itemId, note, actorId);
  }

  /**
   * Lists pending approval items, mapped to ApprovalQueueItem format for
   * the shared ApprovalQueueElement. Optionally filters by allowedClientIds
   * (the Admin's allowlist from PermissionGrant).
   */
  async listPendingApprovals(allowedClientIds?: ReadonlySet<string>): Promise<ApprovalQueueItem[]> {
    const items = await this.approvalRepo.findAll();
    return items
      .filter((item) => {
        if (!allowedClientIds) return true;
        return allowedClientIds.has(item.clientId);
      })
      .map((item) => ({
        id: item.id,
        type: item.type,
        client: item.clientName,
        submittedBy: item.submittedBy,
        submittedAt: item.submittedAt,
        slaDeadline: item.slaDeadline,
        isOverdue: this.isOverdue(item, 4), // fallback; isOverdueWithConfig preferred when PlatformSettings available
        summary: item.summary,
      }));
  }

  /**
   * SLA-retrofitted version of isOverdue. Reads the SLA threshold from
   * PlatformSettingsService based on the item type (campaign or creative),
   * replacing Part 5's hardcoded `4` constant. Falls back to the provided
   * fallbackHours if PlatformSettingsService is not configured.
   */
  public async isOverdueWithConfig(
    item: SlaCheckable & { type?: 'campaign' | 'creative' },
    fallbackHours: number = 4,
  ): Promise<boolean> {
    if (item.slaDeadline) {
      return new Date() > item.slaDeadline;
    }
    let slaHours = fallbackHours;
    if (this.platformSettingsService && item.type) {
      try {
        slaHours = await this.platformSettingsService.getSlaThreshold(item.type);
      } catch {
        // Fall back to hardcoded if settings fetch fails
      }
    }
    const deadline = new Date(item.submittedAt.getTime() + slaHours * 60 * 60 * 1000);
    return new Date() > deadline;
  }

  public isOverdue(item: SlaCheckable, slaThresholdHours: number): boolean {
    if (item.slaDeadline) {
      return new Date() > item.slaDeadline;
    }
    const deadline = new Date(item.submittedAt.getTime() + slaThresholdHours * 60 * 60 * 1000);
    return new Date() > deadline;
  }

  private validateNote(note: string): void {
    if (!note || note.trim().length === 0) {
      throw new ValidationError(
        'A note is required for this action',
        'note',
        'non-empty',
      );
    }
  }
}