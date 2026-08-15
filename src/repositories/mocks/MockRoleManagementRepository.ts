/**
 * MockRoleManagementRepository.ts — repositories/mocks/
 *
 * In-memory mock for RoleManagementService. Stores PermissionGrant
 * data per user. When allowedClientIds is null, the "all clients"
 * sentinel is stored (represented as null in the map, which
 * PermissionGrant interprets as ALL_CLIENTS).
 */
import type { PermissionLevel } from '../../core/enums/PermissionLevel';
import type { RoleManagementRepository } from '../../services/RoleManagementService';

interface StoredGrant {
  modulePermissions: Map<string, PermissionLevel>;
  allowedClientIds: ReadonlySet<string> | null;
}

export class MockRoleManagementRepository implements RoleManagementRepository {
  private readonly grants: Map<string, StoredGrant> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    // Admin: Alice — 3 specific clients, view+edit on campaigns/creatives
    this.grants.set('admin-1', {
      modulePermissions: new Map([
        ['dashboard', 'view'],
        ['campaigns', 'edit'],
        ['creatives', 'edit'],
        ['billing', 'view'],
      ]),
      allowedClientIds: new Set(['client-1', 'client-2', 'client-3']),
    });

    // Admin: Bob — all clients, view-only on everything
    this.grants.set('admin-2', {
      modulePermissions: new Map([
        ['dashboard', 'view'],
        ['campaigns', 'view'],
        ['creatives', 'view'],
      ]),
      allowedClientIds: null, // "all clients" sentinel
    });
  }

  async fetchPermissions(userId: string): Promise<{
    modulePermissions: ReadonlyMap<string, PermissionLevel>;
    allowedClientIds: ReadonlySet<string>;
  }> {
    const stored = this.grants.get(userId);
    if (!stored) {
      return { modulePermissions: new Map(), allowedClientIds: new Set() };
    }
    // If allowedClientIds is null (all-clients sentinel), return an
    // empty set — PermissionGrant treats undefined/null as ALL_CLIENTS.
    return {
      modulePermissions: stored.modulePermissions,
      allowedClientIds: stored.allowedClientIds ?? new Set(),
    };
  }

  async saveGrant(
    userId: string,
    modulePermissions: ReadonlyMap<string, PermissionLevel>,
    allowedClientIds: ReadonlySet<string> | null,
  ): Promise<void> {
    this.grants.set(userId, {
      modulePermissions: new Map(modulePermissions),
      allowedClientIds: allowedClientIds ? new Set(allowedClientIds) : null,
    });
  }
}