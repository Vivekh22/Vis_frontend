/**
 * MockTeamRepository.ts — repositories/mocks/
 *
 * In-memory mock for TeamService. Seeds an owner + team members.
 */
import { TeamMember } from '../../core/entities/TeamMember';
import { TeamRole } from '../../core/enums/TeamRole';
import { TeamMemberStatus } from '../../core/enums/TeamMemberStatus';
import { PRESET_ROLE_PERMISSIONS } from '../../core/types/TeamPermissionLevel';
import type { InviteMemberData, UpdateMemberData, TeamRepository } from '../../services/TeamService';

export class MockTeamRepository implements TeamRepository {
  private readonly members: TeamMember[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    this.members.push(new TeamMember('tm_001', 'client-1', 'owner@visprisca.ads', 'Account Owner', TeamRole.Owner, TeamMemberStatus.Active, new Date(Date.now() - 365 * 86400000), new Date(), true, PRESET_ROLE_PERMISSIONS['full_access']));
    this.members.push(new TeamMember('tm_002', 'client-1', 'manager@visprisca.ads', 'Campaign Manager', TeamRole.CampaignManager, TeamMemberStatus.Active, new Date(Date.now() - 90 * 86400000), new Date(Date.now() - 86400000), false, PRESET_ROLE_PERMISSIONS['campaign_manager']));
    this.members.push(new TeamMember('tm_003', 'client-1', 'finance@visprisca.ads', 'Finance User', TeamRole.Finance, TeamMemberStatus.Invited, new Date(Date.now() - 7 * 86400000), undefined, false, PRESET_ROLE_PERMISSIONS['finance']));
  }

  async findAll(clientId: string): Promise<TeamMember[]> {
    return this.members.filter((m) => m.clientId === clientId);
  }

  async findById(id: string): Promise<TeamMember | null> {
    return this.members.find((m) => m.id === id) ?? null;
  }

  async create(data: InviteMemberData): Promise<TeamMember> {
    const member = new TeamMember(
      `tm_${Date.now().toString(36)}`,
      data.clientId,
      data.email,
      data.email.split('@')[0] ?? 'Team Member',
      data.role,
      TeamMemberStatus.Invited,
      new Date(),
      undefined,
      false,
      data.permissions,
    );
    this.members.push(member);
    return member;
  }

  async update(id: string, data: UpdateMemberData): Promise<TeamMember> {
    const member = this.members.find((m) => m.id === id);
    if (!member) throw new Error(`Team member not found: ${id}`);
    member.updateRole(data.role, data.permissions);
    return member;
  }

  async delete(id: string): Promise<void> {
    const idx = this.members.findIndex((m) => m.id === id);
    if (idx >= 0) this.members.splice(idx, 1);
  }
}