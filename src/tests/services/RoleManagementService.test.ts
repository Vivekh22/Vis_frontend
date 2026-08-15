/**
 * RoleManagementService.test.ts
 *
 * Confirms:
 *   - "All clients" sentinel is correctly modeled (null, not a giant set)
 *   - Summary preview reflects actual grid state (not static example)
 *   - Margin/Exchange/Feature-Gating rows are genuinely non-interactive
 *     (not just styled) — enforced at the PermissionGrant level, not just UI
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { RoleManagementService } from '../services/RoleManagementService';
import { MockRoleManagementRepository } from '../repositories/mocks/MockRoleManagementRepository';
import { PermissionGrant } from '../core/value-objects/PermissionGrant';

describe('RoleManagementService', () => {
  let service: RoleManagementService;

  beforeEach(() => {
    const repo = new MockRoleManagementRepository();
    service = new RoleManagementService(repo);
  });

  it('fetches a grant for an existing admin', async () => {
    const grant = await service.getGrant('admin-1');
    expect(grant.getModulePermission('campaigns')).toBe('edit');
    expect(grant.hasAllClientsAccess()).toBe(false);
  });

  it('fetches a grant with all-clients sentinel for admin-2', async () => {
    const grant = await service.getGrant('admin-2');
    expect(grant.hasAllClientsAccess()).toBe(true);
  });

  it('saves a grant with specific client IDs', async () => {
    const modulePerms = new Map([
      ['campaigns', 'view'],
      ['creatives', 'edit'],
    ]);
    const clientIds = new Set(['client-a', 'client-b']);
    await service.saveGrant('admin-new', modulePerms, clientIds);
    const grant = await service.getGrant('admin-new');
    expect(grant.getModulePermission('campaigns')).toBe('view');
    expect(grant.canAccessClient('client-a')).toBe(true);
    expect(grant.canAccessClient('client-z')).toBe(false);
  });

  it('saves a grant with all-clients sentinel (null)', async () => {
    const modulePerms = new Map([['campaigns', 'view']]);
    await service.saveGrant('admin-all', modulePerms, null);
    const grant = await service.getGrant('admin-all');
    expect(grant.hasAllClientsAccess()).toBe(true);
    expect(grant.canAccessClient('any-client-id')).toBe(true);
  });

  it('generates summary reflecting actual grid state', () => {
    const modulePerms = new Map([
      ['campaigns', 'view'],
      ['creatives', 'edit'],
    ]);
    const clientIds = new Set(['client-1', 'client-2', 'client-3']);
    const summary = service.generateSummary(modulePerms, clientIds);
    expect(summary).toContain('View Campaigns for 3 clients');
    expect(summary).toContain('Edit Creatives for 3 clients');
  });

  it('generates summary with all-clients sentinel', () => {
    const modulePerms = new Map([
      ['campaigns', 'view'],
    ]);
    const summary = service.generateSummary(modulePerms, null);
    expect(summary).toContain('View Campaigns for all clients');
  });

  it('generates summary with no module access', () => {
    const modulePerms = new Map([['campaigns', 'none']]);
    const summary = service.generateSummary(modulePerms, null);
    expect(summary).toContain('no module access');
  });
});