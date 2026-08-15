/**
 * TeamMemberStatus.ts — core/enums/
 *
 * Status of a team member's membership in a client account.
 */
export const TeamMemberStatus = {
  Active: 'active',
  Invited: 'invited',
  Suspended: 'suspended',
} as const;

export type TeamMemberStatus = (typeof TeamMemberStatus)[keyof typeof TeamMemberStatus];