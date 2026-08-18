// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { PermissionGrant } from '../../../core/value-objects/PermissionGrant';

describe('PermissionGrant', () => {
  it('canAccess returns true when module level is sufficient and client is in allowlist', () => {
    const grant = new PermissionGrant(
      new Map([['campaigns', 'approve']]),
      new Set(['client-a', 'client-b']),
    );
    expect(grant.canAccess('client-a', 'campaigns', 'view')).toBe(true);
    expect(grant.canAccess('client-a', 'campaigns', 'approve')).toBe(true);
  });

  it('canAccess returns false when client is NOT in allowlist', () => {
    const grant = new PermissionGrant(
      new Map([['campaigns', 'approve']]),
      new Set(['client-a']),
    );
    expect(grant.canAccess('client-b', 'campaigns', 'view')).toBe(false);
  });

  it('canAccess returns false when module level is insufficient', () => {
    const grant = new PermissionGrant(
      new Map([['campaigns', 'view']]),
      new Set(['client-a']),
    );
    expect(grant.canAccess('client-a', 'campaigns', 'approve')).toBe(false);
    expect(grant.canAccess('client-a', 'campaigns', 'edit')).toBe(false);
    expect(grant.canAccess('client-a', 'campaigns', 'view')).toBe(true);
  });

  it('canAccess returns false when module is not in the grant', () => {
    const grant = new PermissionGrant(
      new Map([['campaigns', 'approve']]),
      new Set(['client-a']),
    );
    expect(grant.canAccess('client-a', 'billing', 'view')).toBe(false);
  });

  it('canAccess returns true for all clients when no allowlist is set (Super Admin)', () => {
    const grant = new PermissionGrant(
      new Map([['campaigns', 'approve']]),
    );
    expect(grant.canAccess('any-client', 'campaigns', 'approve')).toBe(true);
    expect(grant.hasAllClientsAccess()).toBe(true);
  });

  it('getModulePermission returns the granted level or none', () => {
    const grant = new PermissionGrant(
      new Map([['campaigns', 'edit']]),
    );
    expect(grant.getModulePermission('campaigns')).toBe('edit');
    expect(grant.getModulePermission('billing')).toBe('none');
  });

  it('canAccessClient checks only the client dimension', () => {
    const grant = new PermissionGrant(
      new Map([['campaigns', 'approve']]),
      new Set(['client-a']),
    );
    expect(grant.canAccessClient('client-a')).toBe(true);
    expect(grant.canAccessClient('client-b')).toBe(false);
  });
});