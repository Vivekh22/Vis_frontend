/**
 * Admin.ts — core/entities/
 *
 * An Admin user with a two-dimensional permission grant: a client allowlist
 * and a module permission matrix. This is the entity that PermissionGrant
 * models — an Admin's access is scoped by BOTH dimensions together.
 */
import { PermissionGrant } from '../value-objects/PermissionGrant';
import type { PermissionLevel } from '../enums/PermissionLevel';

export class Admin {
  private readonly permissionGrant: PermissionGrant;

  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly email: string,
    modulePermissions: ReadonlyMap<string, PermissionLevel>,
    allowedClientIds?: ReadonlySet<string>,
  ) {
    this.permissionGrant = new PermissionGrant(modulePermissions, allowedClientIds);
  }

  public canAccess(clientId: string, module: string, requiredLevel: PermissionLevel): boolean {
    return this.permissionGrant.canAccess(clientId, module, requiredLevel);
  }

  public getPermissionGrant(): PermissionGrant {
    return this.permissionGrant;
  }
}