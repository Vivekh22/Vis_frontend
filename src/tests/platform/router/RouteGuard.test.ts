/**
 * RouteGuard.test.ts — unit tests for platform/router/RouteGuard.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Route } from '../../../platform/router/Route';
import { RouteGuard } from '../../../platform/router/RouteGuard';
import { authStore } from '../../../platform/state/AuthStore';
import type { User } from '../../../platform/types';

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
}): Route {
  return new Route({
    path: '/test',
    component: class extends HTMLElement {},
    requiredRole: opts.requiredRole,
    requiredPermission: opts.requiredPermission,
  });
}

describe('RouteGuard', () => {
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
});