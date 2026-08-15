/**
 * TeamPermissionLevel.ts — core/types/
 *
 * !!! TYPE-LEVEL CONSTRAINT — NO 'approve' OPTION !!!
 *
 * This type is the ONLY permission level type available in the Team & Roles
 * UI context. It deliberately excludes 'approve' — client-tier team members
 * can NEVER have approve-level permissions, period.
 *
 * This is NOT the same as the platform-wide PermissionLevel (which includes
 * 'approve' for admin/super-admin approval workflows). A developer using
 * TeamPermissionLevel in the Team & Roles UI literally cannot assign 'approve'
 * — the TypeScript type system prevents it at compile time. The constraint is
 * enforced by the type definition itself, not by a filtered dropdown that
 * could be bypassed.
 *
 * This is the type-level guarantee the spec requires: "the permission-level
 * type available in this specific UI context should not even include 'approve'
 * as an option, not just hide it via a filtered dropdown."
 */

/**
 * The only permission levels available for client-tier team members.
 * 'approve' is intentionally absent — it is NOT a valid TeamPermissionLevel.
 */
export const TEAM_PERMISSION_LEVELS = ['view', 'edit', 'none'] as const;

export type TeamPermissionLevel = (typeof TEAM_PERMISSION_LEVELS)[number];

/**
 * All valid TeamPermissionLevel values as a readonly array, for use in
 * UI dropdowns and validation. This array CANNOT contain 'approve' because
 * the type itself doesn't include it.
 */
export const ALL_TEAM_PERMISSION_LEVELS: readonly TeamPermissionLevel[] = TEAM_PERMISSION_LEVELS;

/**
 * Preset role → permission matrix mapping. Each preset role maps each
 * module to a TeamPermissionLevel. None of these mappings include 'approve'
 * because TeamPermissionLevel doesn't have that option — enforced by the
 * type system.
 */
export const PRESET_ROLE_PERMISSIONS: Readonly<Record<string, Readonly<Record<string, TeamPermissionLevel>>>> = {
  full_access: {
    campaigns: 'edit',
    creatives: 'edit',
    audiences: 'edit',
    app_lists: 'edit',
    fund: 'edit',
    invoices: 'view',
    reports: 'view',
    integrations: 'edit',
    team: 'view',
    settings: 'edit',
  },
  campaign_manager: {
    campaigns: 'edit',
    creatives: 'edit',
    audiences: 'edit',
    app_lists: 'edit',
    fund: 'none',
    invoices: 'none',
    reports: 'view',
    integrations: 'view',
    team: 'none',
    settings: 'view',
  },
  finance: {
    campaigns: 'view',
    creatives: 'none',
    audiences: 'none',
    app_lists: 'none',
    fund: 'edit',
    invoices: 'edit',
    reports: 'view',
    integrations: 'none',
    team: 'none',
    settings: 'view',
  },
  viewer: {
    campaigns: 'view',
    creatives: 'view',
    audiences: 'view',
    app_lists: 'view',
    fund: 'view',
    invoices: 'view',
    reports: 'view',
    integrations: 'view',
    team: 'none',
    settings: 'view',
  },
};