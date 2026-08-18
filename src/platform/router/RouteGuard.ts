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
 * Permission checking — TWO-DIMENSIONAL (Part 3 reconciliation):
 *   RouteGuard now consults a real PermissionGrant instance via the injected
 *   PermissionChecker. This closes Part 1's known limitation: the old
 *   DefaultPermissionChecker checked ONLY the module-matrix dimension and
 *   ignored the client-allowlist dimension entirely. The new
 *   GrantBasedPermissionChecker checks BOTH dimensions:
 *     (1) client allowlist — via canAccessClient() when route.targetClientId is set;
 *     (2) module permission matrix — via hasPermission().
 *   An Admin acting on a client OUTSIDE their allowedClientIds is now correctly
 *   denied at the client-allowlist level, the exact gap Part 1 left open.
 */
import { Route } from './Route';
import { authStore } from '../state/AuthStore';
import { sessionStore } from '../state/SessionStore';
import type { User, PermissionLevel } from '../types';
import { PermissionGrant } from '../../core/value-objects/PermissionGrant';
import { PERMISSION_LEVEL_RANK } from '../../core/enums/PermissionLevel';

export interface PermissionChecker {
  hasPermission(user: User, module: string, level: PermissionLevel): boolean;
  canAccessClient(user: User, clientId: string): boolean;
}

/**
 * Grant-based PermissionChecker — constructs a real PermissionGrant from the
 * user's permissions and allowedClientIds, then delegates to it.
 *
 * This replaces Part 1's DefaultPermissionChecker, which checked only the
 * module-matrix dimension and left the client-allowlist dimension unchecked.
 */
class GrantBasedPermissionChecker implements PermissionChecker {
  private buildGrant(user: User): PermissionGrant {
    const modulePermissions = new Map<string, PermissionLevel>();
    if (user.permissions) {
      for (const [mod, level] of Object.entries(user.permissions)) {
        modulePermissions.set(mod, level);
      }
    }
    return new PermissionGrant(modulePermissions, user.allowedClientIds);
  }

  public hasPermission(user: User, module: string, level: PermissionLevel): boolean {
    const grant = this.buildGrant(user);
    const grantedLevel = grant.getModulePermission(module);
    const grantedRank = PERMISSION_LEVEL_RANK[grantedLevel];
    const requiredRank = PERMISSION_LEVEL_RANK[level];
    return grantedRank >= requiredRank;
  }

  public canAccessClient(user: User, clientId: string): boolean {
    const grant = this.buildGrant(user);
    return grant.canAccessClient(clientId);
  }
}

export class RouteGuard {
  private static checker: PermissionChecker = new GrantBasedPermissionChecker();

  /** Replaces the default permission checker. Called by PermissionService at boot. */
  public static setPermissionChecker(checker: PermissionChecker): void {
    RouteGuard.checker = checker;
  }

  /**
   * Returns true iff the current user may activate `route`.
   * 1. If the route requires a role and the user is unauthenticated → deny.
   * 2. If authenticated but the user's role is not in requiredRole → deny.
   *    DURING an active impersonation of a Client, the effective role is the
   *    impersonated entity's role ('client'), NOT the acting user's own role.
   *    The underlying authStore identity stays the true Admin / Super Admin —
   *    only the *route-access* check is re-scoped to the impersonation target.
   * 3. If requiredPermission is set and the user lacks that level → deny.
   * 4. If targetClientId is set and the user cannot access that client → deny.
   */
  public static canActivate(route: Route): boolean {
    const auth = authStore.getState();
    const session = sessionStore.getState();
    // While impersonating a Client, the acting Admin / Super Admin should be
    // permitted onto Client routes (Client layout + Client pages). Fall back
    // to the real authenticated role only when NOT impersonating.
    const effectiveRole =
      session.isImpersonating && session.impersonatedEntityType === 'client'
        ? 'client'
        : auth.role;
    if (route.requiredRole !== null) {
      if (!auth.isAuthenticated) {
        return false;
      }
      if (!effectiveRole || !route.requiredRole.includes(effectiveRole)) {
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
    if (route.targetClientId !== null && auth.currentUser) {
      if (!RouteGuard.checker.canAccessClient(auth.currentUser, route.targetClientId)) {
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