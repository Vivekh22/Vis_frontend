/**
 * ApprovalItem.ts — core/entities/
 *
 * An item in the approval queue — wraps a campaign or creative that's
 * pending approval, along with the submission metadata.
 */
import type { CampaignStatus } from '../enums/CampaignStatus';
import type { CreativeStatus } from '../enums/CreativeStatus';

export type ApprovalItemType = 'campaign' | 'creative';

export class ApprovalItem {
  constructor(
    public readonly id: string,
    public readonly itemType: ApprovalItemType,
    public readonly itemId: string,
    public readonly itemName: string,
    public readonly clientId: string,
    public readonly submittedBy: string,
    public readonly submittedAt: Date,
    public readonly status: CampaignStatus | CreativeStatus,
    public readonly note: string | null = null,
  ) {}
}