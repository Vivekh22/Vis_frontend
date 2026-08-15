/**
 * Route.ts — platform/router/
 *
 * Purpose:
 *   Represents a single route definition: URL pattern, page component, required
 *   role, and optional required permission (module + level).
 *
 * Dynamic segments:
 *   Paths support :paramName segments (e.g. /campaigns/:campaignId). matches()
 *   extracts their values into a params object after URL-decoding.
 *
 * requiredRole:
 *   An array of roles permitted to access this route, or null if the route is
 *   public (e.g. login / registration pages).
 *
 * requiredPermission:
 *   For routes needing more granular permission-matrix checking beyond role —
 *   relevant especially for Admin routes given the two-dimensional
 *   allowlist-plus-module-matrix permission model.
 */
import type { UserRole, PermissionRequirement } from '../types';

export class Route {
  public readonly path: string;
  public readonly component: CustomElementConstructor;
  public readonly requiredRole: UserRole[] | null;
  public readonly requiredPermission: PermissionRequirement | null;
  /**
   * Optional: the client ID this route targets. When set, RouteGuard also
   * checks the client-allowlist dimension (dimension 1 of the Admin
   * two-dimensional permission model). Absent means the route is not
   * client-specific (e.g. a dashboard listing all accessible clients).
   */
  public readonly targetClientId: string | null;
  /**
   * Optional: the layout component that wraps the page. When set, the Router
   * creates the layout, sets the current user on it, and appends the page
   * as a child (slotted into the layout's <slot>).
   */
  public readonly layoutComponent: CustomElementConstructor | null;

  constructor(params: {
    path: string;
    component: CustomElementConstructor;
    requiredRole: UserRole[] | null;
    requiredPermission: PermissionRequirement | null;
    targetClientId?: string | null;
    layoutComponent?: CustomElementConstructor | null;
  }) {
    this.path = params.path;
    this.component = params.component;
    this.requiredRole = params.requiredRole;
    this.requiredPermission = params.requiredPermission;
    this.targetClientId = params.targetClientId ?? null;
    this.layoutComponent = params.layoutComponent ?? null;
  }

  /**
   * Checks whether pathname matches this route's pattern, extracting dynamic
   * segment values. Returns { matched, params }.
   *
   * Segments are compared positionally. A :paramName segment captures any
   * non-empty path segment (URL-decoded). Mismatched lengths or literal
   * segments do not match.
   */
  public matches(pathname: string): { matched: boolean; params: Record<string, string> } {
    const patternSegments = this.path.split('/').filter((s) => s.length > 0);
    const pathSegments = pathname.split('/').filter((s) => s.length > 0);
    if (patternSegments.length !== pathSegments.length) {
      return { matched: false, params: {} };
    }
    const params: Record<string, string> = {};
    for (let i = 0; i < patternSegments.length; i++) {
      const pattern = patternSegments[i]!;
      const actual = pathSegments[i]!;
      if (pattern.startsWith(':')) {
        params[pattern.slice(1)] = decodeURIComponent(actual);
      } else if (pattern !== actual) {
        return { matched: false, params: {} };
      }
    }
    return { matched: true, params };
  }
}