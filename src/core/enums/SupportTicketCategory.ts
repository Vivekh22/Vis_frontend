/**
 * SupportTicketCategory.ts — core/enums/
 *
 * Categories for support ticket classification.
 */
export const SupportTicketCategory = {
  Technical: 'technical',
  Billing: 'billing',
  Campaign: 'campaign',
  Account: 'account',
  Other: 'other',
} as const;

export type SupportTicketCategory = (typeof SupportTicketCategory)[keyof typeof SupportTicketCategory];