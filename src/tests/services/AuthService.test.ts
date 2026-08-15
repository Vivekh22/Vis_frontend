/**
 * AuthService.test.ts — tests for services/AuthService.
 *
 * Tests the ORCHESTRATION logic: login constructs User entity and sets token,
 * logout clears auth state and tokens, refreshSession renews token,
 * getCurrentUser reads from authStore.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../../services/AuthService';
import type { AuthRepository, AuthResponse, RegistrationSubmission, RegistrationStatus } from '../../services/AuthService';
import { authStore } from '../../platform/state/AuthStore';
import { TokenStorage } from '../../security/TokenStorage';

class MockAuthRepo implements AuthRepository {
  private users: Map<string, { password: string; user: AuthResponse['user'] }> = new Map();
  public refreshCalls = 0;

  addUser(email: string, password: string, user: AuthResponse['user']): void {
    this.users.set(email, { password, user });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const cred = this.users.get(email);
    if (!cred || cred.password !== password) throw new Error('Invalid credentials');
    return { token: `tok-${Date.now()}`, user: cred.user };
  }

  async refreshToken(_token: string): Promise<AuthResponse> {
    this.refreshCalls++;
    const first = Array.from(this.users.values())[0];
    if (!first) throw new Error('No users');
    return { token: `refreshed-${Date.now()}`, user: first.user };
  }

  async submitRegistration(_data: RegistrationSubmission): Promise<void> {
    // Mock: no-op
  }

  async getRegistrationStatus(_email: string): Promise<RegistrationStatus> {
    return { status: 'pending' };
  }
}

describe('AuthService', () => {
  let repo: MockAuthRepo;

  beforeEach(() => {
    authStore.logout();
    repo = new MockAuthRepo();
    repo.addUser('admin@visprisca.ads', 'pass123', {
      id: 'u1',
      email: 'admin@visprisca.ads',
      fullName: 'Demo Admin',
      role: 'admin',
      permissions: { campaigns: 'approve' },
      allowedClientIds: new Set(['client-a']),
    });
  });

  it('login constructs User entity, sets token, and updates authStore', async () => {
    const svc = new AuthService(repo);
    const user = await svc.login('admin@visprisca.ads', 'pass123');
    expect(user.id).toBe('u1');
    expect(user.fullName).toBe('Demo Admin');
    expect(user.role).toBe('admin');
    expect(TokenStorage.getToken()).not.toBeNull();
    expect(authStore.getState().isAuthenticated).toBe(true);
    expect(authStore.getState().currentUser?.email).toBe('admin@visprisca.ads');
  });

  it('login throws on invalid credentials', async () => {
    const svc = new AuthService(repo);
    await expect(svc.login('admin@visprisca.ads', 'wrong')).rejects.toThrow('Invalid credentials');
    expect(authStore.getState().isAuthenticated).toBe(false);
  });

  it('logout clears auth state and tokens', async () => {
    const svc = new AuthService(repo);
    await svc.login('admin@visprisca.ads', 'pass123');
    expect(TokenStorage.getToken()).not.toBeNull();
    svc.logout();
    expect(authStore.getState().isAuthenticated).toBe(false);
    expect(authStore.getState().currentUser).toBeNull();
    expect(TokenStorage.getToken()).toBeNull();
  });

  it('refreshSession renews token and updates authStore', async () => {
    const svc = new AuthService(repo);
    await svc.login('admin@visprisca.ads', 'pass123');
    const originalToken = TokenStorage.getToken();
    await svc.refreshSession();
    expect(repo.refreshCalls).toBe(1);
    expect(TokenStorage.getToken()).not.toBe(originalToken);
    expect(authStore.getState().isAuthenticated).toBe(true);
  });

  it('refreshSession throws when no token is present', async () => {
    const svc = new AuthService(repo);
    await expect(svc.refreshSession()).rejects.toThrow('no token');
  });

  it('getCurrentUser returns the logged-in user or null', async () => {
    const svc = new AuthService(repo);
    expect(svc.getCurrentUser()).toBeNull();
    await svc.login('admin@visprisca.ads', 'pass123');
    expect(svc.getCurrentUser()?.id).toBe('u1');
  });
});