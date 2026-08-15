/**
 * MockUserRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of UserRepository for PermissionService.
 * Temporary — real repository implementations in Part 6.
 */
import type { PermissionLevel } from '../../core/enums/PermissionLevel';
import type { UserRepository } from '../../services/PermissionService';

export class MockUserRepository implements UserRepository {
  private readonly users: Map<string, {
    modulePermissions: Map<string, PermissionLevel>;
    allowedClientIds: Set<string>;
  }> = new Map();

  addUser(
    userId: string,
    modulePermissions: Map<string, PermissionLevel>,
    allowedClientIds?: Set<string>,
  ): void {
    this.users.set(userId, {
      modulePermissions,
      allowedClientIds: allowedClientIds ?? new Set(),
    });
  }

  async fetchPermissions(userId: string): Promise<{
    modulePermissions: ReadonlyMap<string, PermissionLevel>;
    allowedClientIds: ReadonlySet<string>;
  }> {
    const data = this.users.get(userId);
    if (!data) {
      return { modulePermissions: new Map(), allowedClientIds: new Set() };
    }
    return {
      modulePermissions: data.modulePermissions,
      allowedClientIds: data.allowedClientIds,
    };
  }
}