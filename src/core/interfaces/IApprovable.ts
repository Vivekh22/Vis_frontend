/**
 * IApprovable.ts — core/interfaces/
 *
 * Interface for entities that go through the approval workflow (Campaigns
 * and Creatives). Tracks the current approval status, submission metadata,
 * and the full approval history trail.
 */
import type { CampaignStatus } from '../enums/CampaignStatus';
import type { CreativeStatus } from '../enums/CreativeStatus';

export interface ApprovalHistoryEntry {
  readonly action: string;
  readonly actorId: string;
  readonly actorName: string;
  readonly timestamp: Date;
  readonly note: string | null;
  readonly fromStatus: CampaignStatus | CreativeStatus;
  readonly toStatus: CampaignStatus | CreativeStatus;
}

export interface IApprovable {
  readonly status: CampaignStatus | CreativeStatus;
  readonly submittedAt: Date | null;
  readonly submittedBy: string | null;
  readonly approvalHistory: ApprovalHistoryEntry[];
}