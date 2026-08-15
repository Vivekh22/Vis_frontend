/**
 * ImpersonationService.test.ts — tests for services/ImpersonationService.
 *
 * Tests the ORCHESTRATION logic: Admin allowlist enforcement (blocks
 * out-of-allowlist client), Super Admin unrestricted access, sessionStore
 * mutation, and endImpersonation delegation.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ImpersonationService } from '../../services/ImpersonationService';
import { PermissionService } from '../../services/PermissionService';
import type { UserRepository } from '../../services/PermissionService';
import type { PermissionLevel } from '../../core/enums/PermissionLevel';
import { User } from '../../core/entities/User';
import { authStore } from '../../platform/state/AuthStore';
import { sessionStore } from '../../platform/state/SessionStore';
import { PermissionDeniedError } from '../../core/errors/PermissionDeniedError';

class MockUserRepo implements UserRepository {
  async fetchPermissions(_userId: string): Promise<{
    modulePermissions: ReadonlyMap<string, PermissionLevel>;
    allowedClientIds: ReadonlySet<string>;
  }> {
    return { modulePermissions: new Map(), allowedClientIds: new Set() };
  }
}

describe('ImpersonationService', () => {
  let permSvc: PermissionService;

  beforeEach(() => {
    authStore.logout();
    sessionStore.clearSession();
    permSvc = new PermissionService(new MockUserRepo());
  });

  it('blocks an Admin from impersonating an out-of-allowlist client', async () => {
    const admin = new User('a1', 'admin@v.com', 'Admin', 'admin', {}, new Set(['client-a']));
    authStore.login(admin);
    const svc = new ImpersonationService(permSvc);
    await expect(svc.startImpersonation('client-b', 'admin')).rejects.toThrow(PermissionDeniedError);
    expect(sessionStore.getState().isImpersonating).toBe(false);
  });

  it('permits an Admin to impersonate a client within their allowlist', async () => {
    const admin = new User('a1', 'admin@v.com', 'Admin', 'admin', {}, new Set(['client-a']));
    authStore.login(admin);
    const svc = new ImpersonationService(permSvc);
    await svc.startImpersonation('client-a', 'admin');
    expect(sessionStore.getState().isImpersonating).toBe(true);
    expect(sessionStore.getState().actingAsRole).toBe('admin');
    expect(sessionStore.getState().actingAsUserId).toBe('a1');
  });

  it('permits a Super Admin to impersonate any client (unrestricted)', async () => {
    const superAdmin = new User('s1', 'super@v.com', 'Super', 'super-admin');
    authStore.login(superAdmin);
    const svc = new ImpersonationService(permSvc);
    await svc.startImpersonation('any-client', 'super-admin');
    expect(sessionStore.getState().isImpersonating).toBe(true);
    expect(sessionStore.getState().actingAsRole).toBe('super-admin');
  });

  it('throws when no user is authenticated', async () => {
    const svc = new ImpersonationService(permSvc);
    await expect(svc.startImpersonation('client-a', 'admin')).rejects.toThrow(PermissionDeniedError);
  });

  it('endImpersonation ends the session and preserves audit trail', async () => {
    const admin = new User('a1', 'admin@v.com', 'Admin', 'admin', {}, new Set(['client-a']));
    authStore.login(admin);
    const svc = new ImpersonationService(permSvc);
    await svc.startImpersonation('client-a', 'admin');
    expect(sessionStore.getState().isImpersonating).toBe(true);
    svc.endImpersonation();
    expect(sessionStore.getState().isImpersonating).toBe(false);
    // Audit trail preserved
    expect(sessionStore.getState().actingAsUserId).toBe('a1');
    expect(sessionStore.getState().actingAsRole).toBe('admin');
  });
});