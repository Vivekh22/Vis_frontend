/**
 * PermissionService.test.ts — tests for services/PermissionService.
 *
 * Tests the ORCHESTRATION logic: cache population, TTL expiry fallback,
 * synchronous permission checks using cached grants, and correct replacement
 * of RouteGuard's temporary checker (verified separately in RouteGuard.test.ts).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionService } from '../../services/PermissionService';
import type { UserRepository } from '../../services/PermissionService';
import { User } from '../../core/entities/User';
import type { PermissionLevel } from '../../core/enums/PermissionLevel';

class MockUserRepo implements UserRepository {
  public fetchCalls: string[] = [];
  private data: Map<string, {
    modulePermissions: Map<string, PermissionLevel>;
    allowedClientIds: Set<string>;
  }> = new Map();

  setUser(userId: string, perms: Map<string, PermissionLevel>, allowlist?: Set<string>): void {
    this.data.set(userId, {
      modulePermissions: perms,
      allowedClientIds: allowlist ?? new Set(),
    });
  }

  async fetchPermissions(userId: string): Promise<{
    modulePermissions: ReadonlyMap<string, PermissionLevel>;
    allowedClientIds: ReadonlySet<string>;
  }> {
    this.fetchCalls.push(userId);
    const d = this.data.get(userId);
    if (!d) return { modulePermissions: new Map(), allowedClientIds: new Set() };
    return { modulePermissions: d.modulePermissions, allowedClientIds: d.allowedClientIds };
  }
}

describe('PermissionService', () => {
  let repo: MockUserRepo;

  beforeEach(() => {
    repo = new MockUserRepo();
  });

  it('falls back to user snapshot when cache is empty (same behavior as GrantBasedPermissionChecker)', () => {
    const svc = new PermissionService(repo);
    const admin = new User('u1', 'a@b.com', 'Admin', 'admin', { campaigns: 'approve' });
    // No refreshGrants call — cache is empty, should fall back to user.permissions
    expect(svc.hasPermission(admin, 'campaigns', 'view')).toBe(true);
    expect(svc.hasPermission(admin, 'campaigns', 'approve')).toBe(true);
    expect(svc.hasPermission(admin, 'billing', 'view')).toBe(false);
  });

  it('falls back to user snapshot for canAccessClient when cache is empty', () => {
    const svc = new PermissionService(repo);
    const admin = new User('u1', 'a@b.com', 'Admin', 'admin', { campaigns: 'approve' }, new Set(['client-a']));
    expect(svc.canAccessClient(admin, 'client-a')).toBe(true);
    expect(svc.canAccessClient(admin, 'client-b')).toBe(false);
  });

  it('refreshGrants fetches from repository and populates cache', async () => {
    const svc = new PermissionService(repo);
    const admin = new User('u1', 'a@b.com', 'Admin', 'admin', { campaigns: 'view' });
    // Server has updated permissions to 'approve' since login
    repo.setUser('u1', new Map([['campaigns', 'approve']]), new Set(['client-a']));
    // Before refresh — falls back to user snapshot (view)
    expect(svc.hasPermission(admin, 'campaigns', 'approve')).toBe(false);
    // After refresh — uses cached grant from repo (approve)
    await svc.refreshGrants(admin);
    expect(svc.hasPermission(admin, 'campaigns', 'approve')).toBe(true);
    expect(repo.fetchCalls).toEqual(['u1']);
  });

  it('canAccessClient uses cached grant after refreshGrants', async () => {
    const svc = new PermissionService(repo);
    const admin = new User('u1', 'a@b.com', 'Admin', 'admin', {}, new Set(['client-a']));
    // Server says the admin can access client-b too (updated allowlist)
    repo.setUser('u1', new Map([['campaigns', 'approve']]), new Set(['client-a', 'client-b']));
    // Before refresh — falls back to user snapshot (only client-a)
    expect(svc.canAccessClient(admin, 'client-b')).toBe(false);
    // After refresh — uses cached grant (client-a AND client-b)
    await svc.refreshGrants(admin);
    expect(svc.canAccessClient(admin, 'client-b')).toBe(true);
  });

  it('Super Admin (no allowedClientIds) has all-clients access', () => {
    const svc = new PermissionService(repo);
    const superAdmin = new User('u2', 's@b.com', 'Super', 'super-admin', {});
    // No allowedClientIds → PermissionGrant treats as ALL_CLIENTS
    expect(svc.canAccessClient(superAdmin, 'any-client')).toBe(true);
  });

  it('cache expires after TTL and falls back to user snapshot', async () => {
    const svc = new PermissionService(repo, 50); // 50ms TTL
    const admin = new User('u1', 'a@b.com', 'Admin', 'admin', { campaigns: 'view' });
    repo.setUser('u1', new Map([['campaigns', 'approve']]));
    await svc.refreshGrants(admin);
    expect(svc.hasPermission(admin, 'campaigns', 'approve')).toBe(true);
    // Wait for cache to expire
    await new Promise((r) => setTimeout(r, 60));
    // Cache expired — falls back to user snapshot (view, not approve)
    expect(svc.hasPermission(admin, 'campaigns', 'approve')).toBe(false);
  });
});