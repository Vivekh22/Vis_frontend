/**
 * WebhookEvent.ts — core/enums/
 *
 * Platform events that can trigger webhook notifications.
 */
export const WebhookEvent = {
  CampaignApproved: 'campaign.approved',
  CampaignRejected: 'campaign.rejected',
  CampaignPaused: 'campaign.paused',
  FundCredited: 'fund.credited',
  InvoiceGenerated: 'invoice.generated',
  CreativeApproved: 'creative.approved',
  CreativeRejected: 'creative.rejected',
  TeamMemberInvited: 'team.member.invited',
} as const;

export type WebhookEvent = (typeof WebhookEvent)[keyof typeof WebhookEvent];