/**
 * PermissionService.ts — services/
 *
 * Purpose:
 *   The permanent, real implementation of the PermissionChecker interface
 *   that platform/router/RouteGuard.ts has been using a temporary version of
 *   since Part 1. Replaces the temporary GrantBasedPermissionChecker.
 *
 *   Key improvement: fetches the user's current PermissionGrant from a
 *   UserRepository (interface, not concrete class) rather than trusting
 *   whatever permission data happens to be attached to the in-memory User
 *   object at auth time. Permissions can change server-side after login, so
 *   this service supports re-fetching current grants via refreshGrants(),
 *   with TTL-based caching to avoid hitting the repository on every check.
 *
 *   The synchronous hasPermission() and canAccessClient() methods (required
 *   by the PermissionChecker interface for RouteGuard's synchronous
 *   canActivate()) read from the cache. If the cache is empty or expired,
 *   they fall back to the user's attached permission snapshot — the same
 *   behavior as the old GrantBasedPermissionChecker. This makes
 *   PermissionService a safe drop-in replacement.
 */
import type { PermissionChecker } from '../platform/router/RouteGuard';
import type { User } from '../platform/types';
import type { PermissionLevel } from '../core/enums/PermissionLevel';
import { PERMISSION_LEVEL_RANK } from '../core/enums/PermissionLevel';
import { PermissionGrant } from '../core/value-objects/PermissionGrant';

/**
 * Repository interface for fetching user permission data. Implemented by
 * MockUserRepository today (repositories/mocks/) and real repository
 * implementations in Part 6.
 */
export interface UserRepository {
  fetchPermissions(userId: string): Promise<{
    modulePermissions: ReadonlyMap<string, PermissionLevel>;
    allowedClientIds: ReadonlySet<string>;
  }>;
}

interface CacheEntry {
  grant: PermissionGrant;
  expiresAt: number;
}

const DEFAULT_CACHE_TTL_MS = 60_000;

export class PermissionService implements PermissionChecker {
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly cacheTtlMs: number;

  constructor(
    private readonly userRepo: UserRepository,
    cacheTtlMs: number = DEFAULT_CACHE_TTL_MS,
  ) {
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Re-fetches the user's current permission grant from the repository and
   * updates the cache. Should be called after login and periodically (or on
   * permission-change events) to ensure the cache reflects server-side
   * permission changes.
   */
  public async refreshGrants(user: User): Promise<void> {
    const { modulePermissions, allowedClientIds } = await this.userRepo.fetchPermissions(user.id);
    const grant = new PermissionGrant(modulePermissions, allowedClientIds);
    this.cache.set(user.id, { grant, expiresAt: Date.now() + this.cacheTtlMs });
  }

  public hasPermission(user: User, module: string, level: PermissionLevel): boolean {
    const grant = this.getGrant(user);
    const grantedLevel = grant.getModulePermission(module);
    return PERMISSION_LEVEL_RANK[grantedLevel] >= PERMISSION_LEVEL_RANK[level];
  }

  public canAccessClient(user: User, clientId: string): boolean {
    const grant = this.getGrant(user);
    return grant.canAccessClient(clientId);
  }

  private getGrant(user: User): PermissionGrant {
    const cached = this.cache.get(user.id);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.grant;
    }
    return this.buildGrantFromUser(user);
  }

  private buildGrantFromUser(user: User): PermissionGrant {
    const modulePermissions = new Map<string, PermissionLevel>();
    if (user.permissions) {
      for (const [mod, level] of Object.entries(user.permissions)) {
        modulePermissions.set(mod, level);
      }
    }
    return new PermissionGrant(modulePermissions, user.allowedClientIds);
  }
}