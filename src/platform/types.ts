/**
 * types.ts — platform/
 *
 * Purpose:
 *   The minimal domain-type contracts that the platform/ layer depends on.
 *   These are NOT the full domain model — the complete, encapsulated classes
 *   (Client, Admin, SuperAdmin, Campaign, Creative, Invoice, etc.) live in
 *   core/ and are built in a later part. platform/ depends only on these shapes
 *   via structural typing, so a future core/User class is directly assignable.
 *
 * Why an interface for User here (not a class):
 *   platform/ must not own domain concepts. It defines only the contract it
 *   needs to store authentication state. core/ will provide the real User class
 *   implementing this contract; TypeScript's structural typing makes that class
 *   interchangeable with this interface without a runtime dependency.
 */

/** The three platform roles. */
export type UserRole = 'client' | 'admin' | 'super-admin';

/**
 * Permission levels, ordered from least to most permissive. The ordering is
 * significant — RouteGuard compares ranks (none < view < edit < manage).
 */
export type PermissionLevel = 'none' | 'view' | 'edit' | 'approve';

/** A required permission for a route: a module plus the minimum level needed. */
export interface PermissionRequirement {
  readonly module: string;
  readonly level: PermissionLevel;
}

/**
 * User contract used by auth state. The full User class lives in core/.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  /** Per-module permission map; absent means "no permissions granted". */
  readonly permissions?: Readonly<Record<string, PermissionLevel>>;
}