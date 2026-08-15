/**
 * types.ts — platform/
 *
 * Purpose:
 *   The minimal domain-type contracts that the platform/ layer depends on.
 *   These are NOT the full domain model — the complete, encapsulated classes
 *   (Client, Admin, SuperAdmin, Campaign, Creative, Invoice, etc.) live in
 *   core/ and are built in Part 3. platform/ depends only on these shapes
 *   via structural typing, so a future core/User class is directly assignable.
 *
 * Source of truth for UserRole and PermissionLevel:
 *   These were previously defined here in Part 1. They have been moved to
 *   core/enums/UserRole.ts and core/enums/PermissionLevel.ts (the domain
 *   layer) as the canonical definitions. This file re-exports them so that
 *   existing imports from platform/types continue to work. There is exactly
 *   ONE definition of each type, not two that could silently drift.
 *
 * Why an interface for User here (not a class):
 *   platform/ must not own domain concepts. It defines only the contract it
 *   needs to store authentication state. core/entities/User.ts provides the
 *   real User class implementing this contract; TypeScript's structural
 *   typing makes that class interchangeable with this interface without a
 *   runtime dependency. Code that INSTANTIATES a user should use the
 *   core/entities/User class; code that RECEIVES a user as a parameter can
 *   use this interface for flexibility.
 */

// Re-export canonical definitions from core/enums/ (single source of truth)
export type { UserRole } from '../core/enums/UserRole';
export type { PermissionLevel } from '../core/enums/PermissionLevel';

import type { UserRole } from '../core/enums/UserRole';
import type { PermissionLevel } from '../core/enums/PermissionLevel';

/** A required permission for a route: a module plus the minimum level needed. */
export interface PermissionRequirement {
  readonly module: string;
  readonly level: PermissionLevel;
}

/**
 * User contract used by auth state. The full User class lives in
 * core/entities/User.ts.
 *
 * allowedClientIds:
 *   Models the Admin two-dimensional permission structure's client-allowlist
 *   dimension. Absent means "no client restriction" (all-clients access —
 *   used by Super Admin and by existing tests that don't test the allowlist).
 *   Present means the user can only act on clients whose IDs are in the set.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  /** Per-module permission map; absent means "no permissions granted". */
  readonly permissions?: Readonly<Record<string, PermissionLevel>>;
  /** Client allowlist; absent means all-clients access. */
  readonly allowedClientIds?: ReadonlySet<string>;
}