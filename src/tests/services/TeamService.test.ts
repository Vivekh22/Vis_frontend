/**
 * TeamService.test.ts — tests/services/
 *
 * Tests that the Account Owner is pinned and non-removable.
 * Also verifies TeamPermissionLevel (no 'approve') is used for permissions.
 */
import { describe, it, expect, vi } from 'vitest';
import { TeamService } from '../../services/TeamService';
import type { TeamRepository, InviteMemberData, UpdateMemberData } from '../../services/TeamService';
import { TeamMember } from '../../core/entities/TeamMember';
import { TeamRole } from '../../core/enums/TeamRole';
import { TeamMemberStatus } from '../../core/enums/TeamMemberStatus';
import { PRESET_ROLE_PERMISSIONS } from '../../core/types/TeamPermissionLevel';

function createMockRepo(): TeamRepository {
  const members: TeamMember[] = [
    new TeamMember('tm_001', 'client-1', 'owner@example.com', 'Owner', TeamRole.Owner, TeamMemberStatus.Active, new Date(), new Date(), true, PRESET_ROLE_PERMISSIONS['full_access']!),
    new TeamMember('tm_002', 'client-1', 'member@example.com', 'Member', TeamRole.CampaignManager, TeamMemberStatus.Active, new Date(), new Date(), false, PRESET_ROLE_PERMISSIONS['campaign_manager']!),
  ];
  return {
    findAll: vi.fn().mockResolvedValue(members),
    findById: vi.fn().mockImplementation(async (id: string) => members.find((m: TeamMember) => m.id === id) ?? null),
    create: vi.fn().mockImplementation(async (data: InviteMemberData) => {
      const m = new TeamMember(`tm_${Date.now()}`, data.clientId, data.email, data.email, data.role, TeamMemberStatus.Invited, new Date(), undefined, false, data.permissions);
      members.push(m);
      return m;
    }),
    update: vi.fn().mockImplementation(async (id: string, data: UpdateMemberData) => {
      const m = members.find((m) => m.id === id);
      if (m) m.updateRole(data.role, data.permissions);
      return m!;
    }),
    delete: vi.fn().mockImplementation(async (id: string) => {
      const idx = members.findIndex((m) => m.id === id);
      if (idx >= 0) members.splice(idx, 1);
    }),
  };
}

describe('TeamService — Owner Non-Removable', () => {
  it('removeMember throws when member is the Account Owner', async () => {
    const service = new TeamService(createMockRepo());
    await expect(service.removeMember('tm_001')).rejects.toThrow('Cannot remove the Account Owner');
  });

  it('removeMember succeeds for non-owner members', async () => {
    const repo = createMockRepo();
    const service = new TeamService(repo);
    await service.removeMember('tm_002');
    expect(repo.delete).toHaveBeenCalledWith('tm_002');
  });

  it('removeMember throws when member not found', async () => {
    const service = new TeamService(createMockRepo());
    await expect(service.removeMember('nonexistent')).rejects.toThrow('Team member not found');
  });

  it('listMembers returns all members including owner', async () => {
    const service = new TeamService(createMockRepo());
    const members = await service.listMembers('client-1');
    expect(members.length).toBe(2);
    expect(members.some((m) => m.isOwner)).toBe(true);
  });
});

describe('TeamService — No Approve Permission', () => {
  it('inviteMember with preset role permissions does not include approve', async () => {
    const repo = createMockRepo();
    const service = new TeamService(repo);
    await service.inviteMember({
      clientId: 'client-1',
      email: 'new@example.com',
      role: TeamRole.FullAccess,
      permissions: PRESET_ROLE_PERMISSIONS['full_access']!,
    });
    const created = vi.mocked(repo.create).mock.calls[0]![0];
    for (const level of Object.values(created.permissions)) {
      expect(level).not.toBe('approve');
    }
  });
});