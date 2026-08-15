/**
 * TeamRepository.ts — repositories/
 *
 * Real implementation of TeamRepository.
 */
import { TeamMember } from '../core/entities/TeamMember';
import type { TeamRole } from '../core/enums/TeamRole';
import type { TeamMemberStatus } from '../core/enums/TeamMemberStatus';
import type { TeamPermissionLevel } from '../core/types/TeamPermissionLevel';
import type { InviteMemberData, UpdateMemberData, TeamRepository as ITeamRepository } from '../services/TeamService';
import { ApiClient } from './ApiClient';

interface TeamMemberDto {
  id: string; clientId: string; email: string; fullName: string; role: TeamRole;
  status: TeamMemberStatus; dateAdded: string; lastActiveAt?: string;
  isOwner: boolean; permissions: Record<string, TeamPermissionLevel>;
}

export function mapDtoToTeamMember(dto: TeamMemberDto): TeamMember {
  return new TeamMember(
    dto.id, dto.clientId, dto.email, dto.fullName, dto.role, dto.status,
    new Date(dto.dateAdded), dto.lastActiveAt ? new Date(dto.lastActiveAt) : undefined,
    dto.isOwner, dto.permissions,
  );
}

export class TeamRepository implements ITeamRepository {
  constructor(private readonly api: ApiClient) {}

  async findAll(clientId: string): Promise<TeamMember[]> {
    const dtos = await this.api.get<TeamMemberDto[]>(`/api/team?clientId=${encodeURIComponent(clientId)}`);
    return dtos.map(mapDtoToTeamMember);
  }

  async findById(id: string): Promise<TeamMember | null> {
    const dto = await this.api.get<TeamMemberDto>(`/api/team/${encodeURIComponent(id)}`);
    return mapDtoToTeamMember(dto);
  }

  async create(data: InviteMemberData): Promise<TeamMember> {
    const dto = await this.api.post<TeamMemberDto>('/api/team', data);
    return mapDtoToTeamMember(dto);
  }

  async update(id: string, data: UpdateMemberData): Promise<TeamMember> {
    const dto = await this.api.put<TeamMemberDto>(`/api/team/${encodeURIComponent(id)}`, data);
    return mapDtoToTeamMember(dto);
  }

  async delete(id: string): Promise<void> {
    await this.api.delete<void>(`/api/team/${encodeURIComponent(id)}`);
  }
}