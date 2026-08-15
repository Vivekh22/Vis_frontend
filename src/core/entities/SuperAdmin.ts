/**
 * SuperAdmin.ts — core/entities/
 *
 * A Super Admin user with unrestricted access. Super Admins have
 * all-clients access (no allowlist) and full module permissions.
 *
 * Internally, this is modeled as a PermissionGrant with ALL_CLIENTS access
 * and 'approve' level on all known modules — but the SuperAdmin entity
 * itself is the authority, not the permission matrix.
 */
import { PermissionGrant } from '../value-objects/PermissionGrant';
import type { PermissionLevel } from '../enums/PermissionLevel';

const ALL_MODULES = [
  'dashboard',
  'clients',
  'campaigns',
  'creatives',
  'approvals',
  'billing',
  'reports',
  'settings',
  'users',
  'audit',
  'support',
] as const;

export class SuperAdmin {
  private readonly permissionGrant: PermissionGrant;

  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly email: string,
  ) {
    // Super Admin has all-clients access (no allowlist) and 'approve' on all modules
    const modulePermissions = new Map<string, PermissionLevel>();
    for (const mod of ALL_MODULES) {
      modulePermissions.set(mod, 'approve');
    }
    this.permissionGrant = new PermissionGrant(modulePermissions);
  }

  public canAccess(clientId: string, module: string, requiredLevel: PermissionLevel): boolean {
    return this.permissionGrant.canAccess(clientId, module, requiredLevel);
  }

  public getPermissionGrant(): PermissionGrant {
    return this.permissionGrant;
  }
}