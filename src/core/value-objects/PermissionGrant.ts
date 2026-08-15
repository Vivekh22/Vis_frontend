/**
 * PermissionGrant.ts — core/value-objects/
 *
 * Models the Admin TWO-DIMENSIONAL permission structure:
 *   (1) allowedClientIds — which specific Client accounts an Admin may act on;
 *   (2) modulePermissions — View / Edit / Approve / None per module,
 *       applying ONLY within that allowlist.
 *
 * The .canAccess() method checks BOTH dimensions together: an Admin must have
 * the required module permission level AND the target client must be in their
 * allowedClientIds (unless they have the "all clients" sentinel).
 *
 * This class replaces RouteGuard.ts's temporary DefaultPermissionChecker from
 * Part 1, which implemented only dimension (2) and left the client-allowlist
 * dimension unchecked — the known limitation flagged and documented there.
 */
import type { PermissionLevel } from '../enums/PermissionLevel';
import { PERMISSION_LEVEL_RANK } from '../enums/PermissionLevel';

/** Sentinel indicating an Admin has access to ALL clients (Super Admin only). */
const ALL_CLIENTS = Symbol('all-clients');

export class PermissionGrant {
  private readonly clientAllowlist: ReadonlySet<string> | typeof ALL_CLIENTS;

  constructor(
    modulePermissions: ReadonlyMap<string, PermissionLevel>,
    allowedClientIds?: ReadonlySet<string>,
  ) {
    this.modulePermissions = modulePermissions;
    this.clientAllowlist = allowedClientIds ?? ALL_CLIENTS;
  }

  private readonly modulePermissions: ReadonlyMap<string, PermissionLevel>;

  /**
   * Checks both dimensions:
   *   1. Does the user have the required permission level on this module?
   *   2. Is the target client within the user's allowlist (or do they have
   *      all-clients access)?
   *
   * Returns true only if BOTH dimensions pass.
   */
  public canAccess(clientId: string, module: string, requiredLevel: PermissionLevel): boolean {
    // Dimension 1: module permission level
    const grantedLevel = this.modulePermissions.get(module) ?? 'none';
    const grantedRank = PERMISSION_LEVEL_RANK[grantedLevel];
    const requiredRank = PERMISSION_LEVEL_RANK[requiredLevel];
    if (grantedRank < requiredRank) {
      return false;
    }

    // Dimension 2: client allowlist
    if (this.clientAllowlist === ALL_CLIENTS) {
      return true;
    }
    return this.clientAllowlist.has(clientId);
  }

  /**
   * Returns the permission level for a module, or 'none' if not granted.
   */
  public getModulePermission(module: string): PermissionLevel {
    return this.modulePermissions.get(module) ?? 'none';
  }

  /**
   * Returns true if the user has all-clients access (no allowlist restriction).
   */
  public hasAllClientsAccess(): boolean {
    return this.clientAllowlist === ALL_CLIENTS;
  }

  /**
   * Returns true if the user can access the given client at all (any module).
   */
  public canAccessClient(clientId: string): boolean {
    if (this.clientAllowlist === ALL_CLIENTS) {
      return true;
    }
    return this.clientAllowlist.has(clientId);
  }
}