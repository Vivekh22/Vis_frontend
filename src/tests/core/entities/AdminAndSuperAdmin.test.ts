import { describe, it, expect } from 'vitest';
import { Admin } from '../../../core/entities/Admin';
import { SuperAdmin } from '../../../core/entities/SuperAdmin';

describe('Admin entity', () => {
  it('constructs with module permissions and optional client allowlist', () => {
    const admin = new Admin(
      'a1',
      'Admin One',
      'admin@visprisca.ads',
      new Map([['campaigns', 'approve']]),
      new Set(['client-a']),
    );
    expect(admin.id).toBe('a1');
    expect(admin.fullName).toBe('Admin One');
  });

  it('canAccess returns true for client in allowlist with sufficient module permission', () => {
    const admin = new Admin(
      'a1',
      'Admin One',
      'admin@visprisca.ads',
      new Map([['campaigns', 'approve']]),
      new Set(['client-a']),
    );
    expect(admin.canAccess('client-a', 'campaigns', 'approve')).toBe(true);
  });

  it('canAccess returns false for client NOT in allowlist', () => {
    const admin = new Admin(
      'a1',
      'Admin One',
      'admin@visprisca.ads',
      new Map([['campaigns', 'approve']]),
      new Set(['client-a']),
    );
    expect(admin.canAccess('client-b', 'campaigns', 'view')).toBe(false);
  });

  it('canAccess returns true for all clients when no allowlist set', () => {
    const admin = new Admin(
      'a1',
      'Admin One',
      'admin@visprisca.ads',
      new Map([['campaigns', 'approve']]),
    );
    expect(admin.canAccess('any-client', 'campaigns', 'approve')).toBe(true);
  });
});

describe('SuperAdmin entity', () => {
  it('constructs with unrestricted access', () => {
    const sa = new SuperAdmin('sa1', 'Super Admin', 'super@visprisca.ads');
    expect(sa.id).toBe('sa1');
    expect(sa.fullName).toBe('Super Admin');
  });

  it('canAccess returns true for any client and module', () => {
    const sa = new SuperAdmin('sa1', 'Super Admin', 'super@visprisca.ads');
    expect(sa.canAccess('any-client', 'campaigns', 'approve')).toBe(true);
    expect(sa.canAccess('any-client', 'billing', 'approve')).toBe(true);
    expect(sa.canAccess('any-client', 'settings', 'approve')).toBe(true);
  });
});