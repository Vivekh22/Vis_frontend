/**
 * RoleManagementService.ts — services/
 *
 * Persists PermissionGrant objects for Admin accounts. The Role &
 * Permission Builder (Section D) constructs a real PermissionGrant from
 * the grid state and saves it via this service.
 *
 * The "all clients" sentinel is modeled as a real sentinel value in
 * PermissionGrant (Symbol('all-clients')), NOT a giant enumerated set
 * of every client ID — because "all clients" must also cover clients
 * that don't exist yet.
 */
import { PermissionGrant } from '../core/value-objects/PermissionGrant';
import type { PermissionLevel } from '../core/enums/PermissionLevel';

export interface RoleManagementRepository {
  fetchPermissions(userId: string): Promise<{
    modulePermissions: ReadonlyMap<string, PermissionLevel>;
    allowedClientIds: ReadonlySet<string>;
  }>;
  saveGrant(userId: string, modulePermissions: ReadonlyMap<string, PermissionLevel>, allowedClientIds: ReadonlySet<string> | null): Promise<void>;
}

export class RoleManagementService {
  constructor(private readonly roleRepo: RoleManagementRepository) {}

  /**
   * Fetches the current PermissionGrant for a user.
   * If allowedClientIds is null, the "all clients" sentinel is used.
   */
  async getGrant(userId: string): Promise<PermissionGrant> {
    const { modulePermissions, allowedClientIds } = await this.roleRepo.fetchPermissions(userId);
    return new PermissionGrant(modulePermissions, allowedClientIds);
  }

  /**
   * Persists a PermissionGrant. If allowedClientIds is null, the "all
   * current and future clients" sentinel is stored — this covers clients
   * that don't exist yet, not just the current set.
   */
  async saveGrant(
    userId: string,
    modulePermissions: ReadonlyMap<string, PermissionLevel>,
    allowedClientIds: ReadonlySet<string> | null,
  ): Promise<void> {
    await this.roleRepo.saveGrant(userId, modulePermissions, allowedClientIds);
  }

  /**
   * Generates a plain-English summary of what the grant allows.
   * "This Admin will be able to: View Campaigns for 3 clients, Edit
   * Creatives for all clients, ..."
   *
   * This is real templated text reflecting the actual grid state, not
   * a static example.
   */
  public generateSummary(
    modulePermissions: ReadonlyMap<string, PermissionLevel>,
    allowedClientIds: ReadonlySet<string> | null,
  ): string {
    const parts: string[] = [];
    const moduleLabels: Record<string, string> = {
      dashboard: 'Dashboard',
      clients: 'Clients',
      campaigns: 'Campaigns',
      creatives: 'Creatives',
      app_lists: 'App Lists',
      audiences: 'Audiences',
      billing: 'Billing',
      reports: 'Reports',
      support: 'Support',
      settings: 'Settings',
    };

    const clientScope = allowedClientIds === null
      ? 'all clients'
      : `${allowedClientIds.size} client${allowedClientIds.size === 1 ? '' : 's'}`;

    for (const [module, level] of modulePermissions) {
      if (level === 'none') continue;
      const label = moduleLabels[module] ?? module;
      const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
      parts.push(`${levelLabel} ${label} for ${clientScope}`);
    }

    if (parts.length === 0) {
      return 'This Admin will have no module access.';
    }
    return `This Admin will be able to: ${parts.join(', ')}.`;
  }
}