/**
 * RouteGuard.test.ts — unit tests for platform/router/RouteGuard.ts.
 */
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { Route } from '../../../platform/router/Route';
import { RouteGuard } from '../../../platform/router/RouteGuard';
import { authStore } from '../../../platform/state/AuthStore';
import type { User } from '../../../platform/types';
import { PermissionService } from '../../../services/PermissionService';
import { MockUserRepository } from '../../../repositories/mocks/MockUserRepository';

const clientUser: User = {
  id: 'u1',
  email: 'client@visprisca.ads',
  fullName: 'Client One',
  role: 'client',
};

const adminUser: User = {
  id: 'u2',
  email: 'admin@visprisca.ads',
  fullName: 'Admin Two',
  role: 'admin',
  permissions: { campaigns: 'approve' },
};

function makeRoute(opts: {
  requiredRole: ('client' | 'admin' | 'super-admin')[] | null;
  requiredPermission: { module: string; level: 'none' | 'view' | 'edit' | 'approve' } | null;
  targetClientId?: string | null;
}): Route {
  return new Route({
    path: '/test',
    component: class extends HTMLElement {},
    requiredRole: opts.requiredRole,
    requiredPermission: opts.requiredPermission,
    targetClientId: opts.targetClientId ?? null,
  });
}

describe('RouteGuard', () => {
  beforeAll(() => {
    // Wire the real PermissionService into RouteGuard, replacing the temporary
    // GrantBasedPermissionChecker. This confirms the real service is a drop-in
    // replacement — all existing tests must pass with it.
    RouteGuard.setPermissionChecker(new PermissionService(new MockUserRepository()));
  });

  beforeEach(() => {
    authStore.logout();
  });

  it('permits an authenticated user with the correct role', () => {
    authStore.login(clientUser);
    const route = makeRoute({ requiredRole: ['client'], requiredPermission: null });
    expect(RouteGuard.canActivate(route)).toBe(true);
  });

  it('denies an unauthenticated user on a protected route', () => {
    const route = makeRoute({ requiredRole: ['client'], requiredPermission: null });
    expect(RouteGuard.canActivate(route)).toBe(false);
    expect(RouteGuard.getRedirectPath(route)).toBe('/login');
  });

  it('denies an authenticated user with the wrong role', () => {
    authStore.login(clientUser);
    const route = makeRoute({ requiredRole: ['admin'], requiredPermission: null });
    expect(RouteGuard.canActivate(route)).toBe(false);
    expect(RouteGuard.getRedirectPath(route)).toBe('/not-authorized');
  });

  it('denies a user with the correct role but insufficient module permission', () => {
    authStore.login(adminUser);
    const route = makeRoute({
      requiredRole: ['admin'],
      requiredPermission: { module: 'billing', level: 'approve' },
    });
    expect(RouteGuard.canActivate(route)).toBe(false);
  });

  it('permits a user with the correct role and sufficient permission', () => {
    authStore.login(adminUser);
    const route = makeRoute({
      requiredRole: ['admin'],
      requiredPermission: { module: 'campaigns', level: 'approve' },
    });
    expect(RouteGuard.canActivate(route)).toBe(true);
  });

  it('permits a public route (requiredRole null) for anyone', () => {
    const route = makeRoute({ requiredRole: null, requiredPermission: null });
    expect(RouteGuard.canActivate(route)).toBe(true);
  });

  // NEW TEST — closes Part 1's known limitation:
  // An Admin acting on a client OUTSIDE their allowedClientIds is now correctly
  // denied by the GrantBasedPermissionChecker, which checks BOTH dimensions
  // (module-matrix AND client-allowlist) via PermissionGrant.canAccessClient().
  it('denies an Admin acting on a client OUTSIDE their allowedClientIds', () => {
    const adminWithAllowlist: User = {
      id: 'u3',
      email: 'scoped-admin@visprisca.ads',
      fullName: 'Scoped Admin',
      role: 'admin',
      permissions: { campaigns: 'approve' },
      allowedClientIds: new Set(['client-a']),
    };
    authStore.login(adminWithAllowlist);
    const route = makeRoute({
      requiredRole: ['admin'],
      requiredPermission: { module: 'campaigns', level: 'view' },
      targetClientId: 'client-b', // NOT in the allowlist
    });
    // Module permission is sufficient (approve >= view), but client is outside allowlist
    expect(RouteGuard.canActivate(route)).toBe(false);
    expect(RouteGuard.getRedirectPath(route)).toBe('/not-authorized');
  });

  it('permits an Admin acting on a client WITHIN their allowedClientIds', () => {
    const adminWithAllowlist: User = {
      id: 'u3',
      email: 'scoped-admin@visprisca.ads',
      fullName: 'Scoped Admin',
      role: 'admin',
      permissions: { campaigns: 'approve' },
      allowedClientIds: new Set(['client-a']),
    };
    authStore.login(adminWithAllowlist);
    const route = makeRoute({
      requiredRole: ['admin'],
      requiredPermission: { module: 'campaigns', level: 'view' },
      targetClientId: 'client-a', // IN the allowlist
    });
    expect(RouteGuard.canActivate(route)).toBe(true);
  });
});