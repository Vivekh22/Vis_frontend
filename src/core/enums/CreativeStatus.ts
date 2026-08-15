/**
 * CreativeStatus.ts — core/enums/
 *
 * Creative lifecycle states. Same const-object + union-type pattern as
 * CampaignStatus (see that file for the rationale on avoiding native enums).
 */
export const CreativeStatus = {
  Draft: 'draft',
  PendingApproval: 'pending_approval',
  Active: 'active',
  Paused: 'paused',
  Rejected: 'rejected',
} as const;

export type CreativeStatus = (typeof CreativeStatus)[keyof typeof CreativeStatus];