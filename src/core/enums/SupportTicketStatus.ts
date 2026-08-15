/**
 * SupportTicketStatus.ts — core/enums/
 *
 * Lifecycle states for support tickets.
 */
export const SupportTicketStatus = {
  Open: 'open',
  InProgress: 'in_progress',
  Resolved: 'resolved',
  Closed: 'closed',
} as const;

export type SupportTicketStatus = (typeof SupportTicketStatus)[keyof typeof SupportTicketStatus];