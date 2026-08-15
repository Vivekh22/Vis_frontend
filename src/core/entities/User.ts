/**
 * User.ts — core/entities/
 *
 * Real class replacing the User interface stub from platform/types.ts.
 *
 * The platform/types.ts User interface is kept (re-exported from core/) as
 * the structural contract for code that RECEIVES a user as a parameter
 * (e.g. AuthStore.login(user: User)). This class is for code that
 * INSTANTIATES a user. TypeScript's structural typing makes the class
 * directly assignable to the interface — no adapter needed.
 */
import type { UserRole } from '../enums/UserRole';
import type { PermissionLevel } from '../enums/PermissionLevel';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly role: UserRole,
    public readonly permissions: Readonly<Record<string, PermissionLevel>> = {},
    public readonly allowedClientIds?: ReadonlySet<string>,
  ) {}

  /**
   * Returns the permission level for a module, or 'none' if not granted.
   */
  public getModulePermission(module: string): PermissionLevel {
    return this.permissions[module] ?? 'none';
  }
}