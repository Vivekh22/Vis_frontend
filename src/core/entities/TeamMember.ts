/**
 * TeamMember.ts — core/entities/
 *
 * Represents a team member in a client account. The Account Owner is pinned
 * and non-removable — enforced by isOwner and the TeamService which refuses
 * to delete owners.
 *
 * Permissions use TeamPermissionLevel (view/edit/none) — NOT the platform-wide
 * PermissionLevel which includes 'approve'. Client-tier team members can NEVER
 * have approve-level permissions. This is enforced at the type level: the
 * permissions field's value type is TeamPermissionLevel, which doesn't include
 * 'approve' as an option.
 */
import type { TeamRole } from '../enums/TeamRole';
import type { TeamMemberStatus } from '../enums/TeamMemberStatus';
import type { TeamPermissionLevel } from '../types/TeamPermissionLevel';

export class TeamMember {
  private _status: TeamMemberStatus;
  private _role: TeamRole;

  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly email: string,
    public readonly fullName: string,
    role: TeamRole,
    status: TeamMemberStatus,
    public readonly dateAdded: Date = new Date(),
    public readonly lastActiveAt?: Date,
    public readonly isOwner: boolean = false,
    public readonly permissions: Readonly<Record<string, TeamPermissionLevel>> = {},
  ) {
    this._role = role;
    this._status = status;
  }

  public get role(): TeamRole {
    return this._role;
  }

  public get status(): TeamMemberStatus {
    return this._status;
  }

  public get isRemovable(): boolean {
    return !this.isOwner;
  }

  public updateRole(role: TeamRole, permissions: Readonly<Record<string, TeamPermissionLevel>>): void {
    if (this.isOwner) {
      throw new Error('Cannot change the Account Owner role');
    }
    this._role = role;
    (this as { permissions: Record<string, TeamPermissionLevel> }).permissions = permissions;
  }

  public suspend(): void {
    if (this.isOwner) {
      throw new Error('Cannot suspend the Account Owner');
    }
    this._status = 'suspended';
  }

  public reactivate(): void {
    this._status = 'active';
  }
}