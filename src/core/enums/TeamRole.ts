/**
 * TeamRole.ts — core/enums/
 *
 * Preset roles for client team members. The Account Owner role is special:
 * it is pinned and non-removable.
 *
 * NOTE: This enum is distinct from the platform-wide UserRole. TeamRole
 * represents client-tier team member roles only — there is no 'admin' or
 * 'super-admin' here.
 */
export const TeamRole = {
  Owner: 'owner',
  FullAccess: 'full_access',
  CampaignManager: 'campaign_manager',
  Finance: 'finance',
  Viewer: 'viewer',
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];