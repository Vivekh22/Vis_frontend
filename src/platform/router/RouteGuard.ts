/**
 * RouteGuard.ts — platform/router/
 *
 * Purpose:
 *   Route-level security enforcement. canActivate() decides whether a route may
 *   be activated; getRedirectPath() decides where to send the user if not. The
 *   decision and the redirect destination are kept as two separate,
 *   independently testable concerns.
 *
 * !!! CLIENT-SIDE GUARD IS UX ONLY, NOT REAL AUTHORIZATION !!!
 *   This guard prevents a legitimate user from navigating somewhere confusing
 *   and hitting a wall of API errors. It is NOT a substitute for server-side
 *   authorization. Every actual API call made by repositories/ApiClient.ts
 *   must be independently authorized by the real backend regardless of what
 *   this client-side guard allows — a client-side check can always be bypassed
 *   by a sufficiently motivated attacker manipulating the client directly.
 *   This distinction is security-critical and must not be left implicit.
 *
 * Permission checking:
 *   When route.requiredPermission is set, RouteGuard delegates to an injectable
 *   PermissionChecker (default: a real rank-based check against the user's
 *   permission map). services/PermissionService.ts (built in a later part)
 *   replaces the default checker via setPermissionChecker() at boot.
 */
import { Route } from './Route';
import { authStore } from '../state/AuthStore';
import type { User, PermissionLevel } from '../types';

export interface PermissionChecker {
  hasPermission(user: User, module: string, level: PermissionLevel): boolean;
}

/** Rank ordering of permission levels — none < view < edit < manage. */
const LEVEL_RANK: Record<PermissionLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
  approve: 3,
};

/**
 * Default PermissionChecker — TEMPORARY, partial implementation.
 *
 * !!! KNOWN LIMITATION — CLIENT ALLOWLIST NOT CHECKED !!!
 * The Admin spec defines a TWO-DIMENSIONAL permission model:
 *   (1) a CLIENT ALLOWLIST — which specific Client accounts an Admin may act on;
 *   (2) a MODULE PERMISSION MATRIX — View / Edit / Approve / None per module,
 *       applying ONLY within that allowlist.
 *
 * This default checker implements ONLY dimension (2) — the module matrix — by
 * rank. It does NOT check dimension (1): whether the acting user is permitted to
 * act on the SPECIFIC client/target the route concerns. The current User type
 * (platform/types.ts) does not even model the allowlist yet.
 *
 * Consequence: until services/PermissionService.ts is built and injected via
 * setPermissionChecker(), RouteGuard.canActivate() may return true for an Admin
 * acting on a Client OUTSIDE their allowlist, as long as the module-level rank
 * passes. This is acceptable ONLY because the client-side guard is UX-only
 * (see the file-level warning) and every real authorisation is enforced
 * server-side by the backend behind ApiClient. It must NOT be mistaken for
 * complete authorisation.
 *
 * services/PermissionService.ts will replace this checker with the full
 * two-dimensional (allowlist AND module-matrix) implementation.
 */
class DefaultPermissionChecker implements PermissionChecker {
  public hasPermission(user: User, module: string, level: PermissionLevel): boolean {
    const granted = user.permissions?.[module] ?? 'none';
    const grantedRank = LEVEL_RANK[granted] ?? 0;
    const requiredRank = LEVEL_RANK[level] ?? 0;
    return grantedRank >= requiredRank;
  }
}

export class RouteGuard {
  private static checker: PermissionChecker = new DefaultPermissionChecker();

  /** Replaces the default permission checker. Called by PermissionService at boot. */
  public static setPermissionChecker(checker: PermissionChecker): void {
    RouteGuard.checker = checker;
  }

  /**
   * Returns true iff the current user may activate `route`.
   * 1. If the route requires a role and the user is unauthenticated → deny.
   * 2. If authenticated but the user's role is not in requiredRole → deny.
   * 3. If requiredPermission is set and the user lacks that level → deny.
   */
  public static canActivate(route: Route): boolean {
    const auth = authStore.getState();
    if (route.requiredRole !== null) {
      if (!auth.isAuthenticated) {
        return false;
      }
      if (!auth.role || !route.requiredRole.includes(auth.role)) {
        return false;
      }
    }
    if (route.requiredPermission !== null) {
      if (!auth.currentUser) {
        return false;
      }
      if (
        !RouteGuard.checker.hasPermission(
          auth.currentUser,
          route.requiredPermission.module,
          route.requiredPermission.level,
        )
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Decides where to redirect on denial.
   * - Unauthenticated → login page.
   * - Authenticated but insufficiently permitted → "not authorized" page.
   */
  public static getRedirectPath(_route: Route): string {
    const auth = authStore.getState();
    if (!auth.isAuthenticated) {
      return '/login';
    }
    return '/not-authorized';
  }
}