/**
 * UserRepository.ts — repositories/
 *
 * Real implementation of the UserRepository interface from PermissionService.
 * Fetches user permission data from the API.
 *
 * Assumed endpoint shape (de facto API contract):
 *   GET /api/users/:userId/permissions
 *   Response: {
 *     modulePermissions: Record<string, PermissionLevel>,
 *     allowedClientIds: string[]
 *   }
 *
 * The DTO uses plain objects/arrays (JSON-serializable). The repository maps
 * these into the Map/Set shapes the interface requires.
 */
import type { PermissionLevel } from '../core/enums/PermissionLevel';
import type { UserRepository as IUserRepository } from '../services/PermissionService';
import { ApiClient } from './ApiClient';

interface UserPermissionsDto {
  modulePermissions: Record<string, PermissionLevel>;
  allowedClientIds: string[];
}

export class UserRepository implements IUserRepository {
  constructor(private readonly api: ApiClient) {}

  async fetchPermissions(userId: string): Promise<{
    modulePermissions: ReadonlyMap<string, PermissionLevel>;
    allowedClientIds: ReadonlySet<string>;
  }> {
    const dto = await this.api.get<UserPermissionsDto>(`/api/users/${encodeURIComponent(userId)}/permissions`);
    return {
      modulePermissions: new Map(Object.entries(dto.modulePermissions)),
      allowedClientIds: new Set(dto.allowedClientIds),
    };
  }
}