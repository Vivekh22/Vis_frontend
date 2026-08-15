/**
 * SessionStore.test.ts — unit tests for platform/state/SessionStore.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { sessionStore } from '../../../platform/state/SessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    sessionStore.clearSession();
  });

  it('startImpersonation sets impersonation state with type constrained to client and role recorded', () => {
    sessionStore.startImpersonation({ entityName: 'Acme Corp', actingAsUserId: 'admin-1', actingAsRole: 'admin' });
    const s = sessionStore.getState();
    expect(s.isImpersonating).toBe(true);
    expect(s.impersonatedEntityName).toBe('Acme Corp');
    expect(s.impersonatedEntityType).toBe('client');
    expect(s.actingAsUserId).toBe('admin-1');
    expect(s.actingAsRole).toBe('admin');
    expect(s.sessionStartedAt).not.toBeNull();
  });

  it('startImpersonation accepts super-admin actingAsRole for the Super Admin banner wording', () => {
    sessionStore.startImpersonation({ entityName: 'Acme Corp', actingAsUserId: 'root-1', actingAsRole: 'super-admin' });
    const s = sessionStore.getState();
    expect(s.actingAsRole).toBe('super-admin');
  });

  it('endImpersonation clears the session but preserves actingAsUserId and actingAsRole for audit', () => {
    sessionStore.startImpersonation({ entityName: 'Acme Corp', actingAsUserId: 'admin-1', actingAsRole: 'admin' });
    sessionStore.endImpersonation();
    const s = sessionStore.getState();
    expect(s.isImpersonating).toBe(false);
    expect(s.impersonatedEntityName).toBeNull();
    expect(s.impersonatedEntityType).toBeNull();
    expect(s.actingAsUserId).toBe('admin-1');
    expect(s.actingAsRole).toBe('admin');
    expect(s.sessionStartedAt).toBeNull();
  });

  it('clearSession fully resets every field including the audit-trail fields', () => {
    sessionStore.startImpersonation({ entityName: 'Acme Corp', actingAsUserId: 'admin-1', actingAsRole: 'super-admin' });
    sessionStore.clearSession();
    const s = sessionStore.getState();
    expect(s.isImpersonating).toBe(false);
    expect(s.impersonatedEntityName).toBeNull();
    expect(s.impersonatedEntityType).toBeNull();
    expect(s.actingAsUserId).toBeNull();
    expect(s.actingAsRole).toBeNull();
    expect(s.sessionStartedAt).toBeNull();
  });
});
