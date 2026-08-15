/**
 * PermissionLevel.ts — core/enums/
 *
 * Canonical definition of permission levels, ordered from least to most
 * permissive. The ordering is significant — RouteGuard compares ranks
 * (none < view < edit < approve).
 *
 * Source of truth:
 *   Like UserRole, this was previously defined in platform/types.ts and has
 *   been moved here to core/enums/. platform/types.ts re-exports from this
 *   file to maintain a single canonical definition.
 */
export const PermissionLevel = {
  None: 'none',
  View: 'view',
  Edit: 'edit',
  Approve: 'approve',
} as const;

export type PermissionLevel = (typeof PermissionLevel)[keyof typeof PermissionLevel];

/**
 * Rank ordering for permission level comparison. none(0) < view(1) < edit(2)
 * < approve(3). Used by RouteGuard and PermissionGrant.
 */
export const PERMISSION_LEVEL_RANK: Readonly<Record<PermissionLevel, number>> = {
  none: 0,
  view: 1,
  edit: 2,
  approve: 3,
};