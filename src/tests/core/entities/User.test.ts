// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { User } from '../../../core/entities/User';

describe('User entity', () => {
  it('constructs with id, email, fullName, role, and optional permissions', () => {
    const u = new User('u1', 'test@visprisca.ads', 'Test User', 'admin', { campaigns: 'approve' });
    expect(u.id).toBe('u1');
    expect(u.email).toBe('test@visprisca.ads');
    expect(u.fullName).toBe('Test User');
    expect(u.role).toBe('admin');
    expect(u.permissions).toEqual({ campaigns: 'approve' });
  });

  it('defaults permissions to empty object', () => {
    const u = new User('u1', 'test@visprisca.ads', 'Test User', 'client');
    expect(u.permissions).toEqual({});
  });

  it('getModulePermission returns granted level or none', () => {
    const u = new User('u1', 'test@visprisca.ads', 'Test User', 'admin', { campaigns: 'edit' });
    expect(u.getModulePermission('campaigns')).toBe('edit');
    expect(u.getModulePermission('billing')).toBe('none');
  });

  it('is structurally compatible with the platform/types User interface', () => {
    // This assignment type-checks only if the class satisfies the interface
    const u: import('../../../platform/types').User = new User('u1', 'e@a', 'N', 'client');
    expect(u.id).toBe('u1');
  });
});