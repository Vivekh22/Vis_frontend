/**
 * UserRole.ts — core/enums/
 *
 * Canonical definition of the three platform roles.
 *
 * Source of truth:
 *   This file is the SINGLE canonical definition of UserRole. platform/types.ts
 *   re-exports it from here. Previously, platform/types.ts owned this type;
 *   it has been moved to core/ (the domain layer) because UserRole is a domain
 *   concept, not a platform-layer concern. platform/ now depends on core/
 *   for this type, and the old definition in platform/types.ts was replaced
 *   with a re-export to ensure there is exactly ONE definition, not two that
 *   could silently drift.
 */
export const UserRole = {
  Client: 'client',
  Admin: 'admin',
  SuperAdmin: 'super-admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];