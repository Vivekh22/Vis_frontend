/**
 * TeamService.ts — services/
 *
 * Orchestrates team member CRUD. The Account Owner is pinned and non-removable
 * — removeMember() throws if the member is the owner.
 *
 * Permissions use TeamPermissionLevel (view/edit/none) — NOT the platform-wide
 * PermissionLevel which includes 'approve'. Client-tier team members can NEVER
 * have approve-level permissions. This is enforced at the type level: the
 * permissions field's value type is TeamPermissionLevel, which doesn't include
 * 'approve' as an option.
 */
import type { TeamMember } from '../core/entities/TeamMember';
import type { TeamRole } from '../core/enums/TeamRole';
import type { TeamPermissionLevel } from '../core/types/TeamPermissionLevel';

export interface InviteMemberData {
  clientId: string;
  email: string;
  role: TeamRole;
  permissions: Readonly<Record<string, TeamPermissionLevel>>;
}

export interface UpdateMemberData {
  role: TeamRole;
  permissions: Readonly<Record<string, TeamPermissionLevel>>;
}

export interface TeamRepository {
  findAll(clientId: string): Promise<TeamMember[]>;
  findById(id: string): Promise<TeamMember | null>;
  create(data: InviteMemberData): Promise<TeamMember>;
  update(id: string, data: UpdateMemberData): Promise<TeamMember>;
  delete(id: string): Promise<void>;
}

export class TeamService {
  constructor(private readonly teamRepo: TeamRepository) {}

  async listMembers(clientId: string): Promise<TeamMember[]> {
    return await this.teamRepo.findAll(clientId);
  }

  async inviteMember(data: InviteMemberData): Promise<TeamMember> {
    return await this.teamRepo.create(data);
  }

  async updateMemberRole(memberId: string, data: UpdateMemberData): Promise<TeamMember> {
    return await this.teamRepo.update(memberId, data);
  }

  /**
   * Removes a team member. Throws if the member is the Account Owner —
   * owners are pinned and non-removable.
   */
  async removeMember(memberId: string): Promise<void> {
    const member = await this.teamRepo.findById(memberId);
    if (!member) {
      throw new Error(`Team member not found: ${memberId}`);
    }
    if (!member.isRemovable) {
      throw new Error('Cannot remove the Account Owner');
    }
    await this.teamRepo.delete(memberId);
  }
}