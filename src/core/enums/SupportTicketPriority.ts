/**
 * SupportTicketPriority.ts — core/enums/
 *
 * Priority levels for support tickets, ordered low to urgent.
 */
export const SupportTicketPriority = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Urgent: 'urgent',
} as const;

export type SupportTicketPriority = (typeof SupportTicketPriority)[keyof typeof SupportTicketPriority];