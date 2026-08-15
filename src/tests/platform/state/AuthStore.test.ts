/**
 * AuthStore.test.ts — unit tests for platform/state/AuthStore.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { authStore } from '../../../platform/state/AuthStore';
import { sessionStore } from '../../../platform/state/SessionStore';
import { TokenStorage } from '../../../security/TokenStorage';
import type { User } from '../../../platform/types';

const clientUser: User = {
  id: 'u1',
  email: 'client@visprisca.ads',
  fullName: 'Client One',
  role: 'client',
};

describe('authStore', () => {
  beforeEach(() => {
    authStore.logout();
  });

  it('login() sets the authenticated user and role', () => {
    authStore.login(clientUser);
    const s = authStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.currentUser?.id).toBe('u1');
    expect(s.role).toBe('client');
  });

  it('logout() resets state and clears tokens', () => {
    TokenStorage.setToken('mock-token');
    authStore.login(clientUser);
    authStore.logout();
    const s = authStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.currentUser).toBeNull();
    expect(s.role).toBeNull();
    expect(TokenStorage.getToken()).toBeNull();
  });

  it('logout() also clears any active impersonation session so it cannot persist into a new login', () => {
    sessionStore.startImpersonation({ entityName: 'Acme Corp', actingAsUserId: 'admin-1', actingAsRole: 'admin' });
    TokenStorage.setToken('mock-token');
    authStore.login(clientUser);
    authStore.logout();
    const ss = sessionStore.getState();
    expect(ss.isImpersonating).toBe(false);
    expect(ss.actingAsUserId).toBeNull();
    expect(ss.actingAsRole).toBeNull();
    expect(TokenStorage.getToken()).toBeNull();
  });
});