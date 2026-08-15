/**
 * Route.test.ts — unit tests for platform/router/Route.ts.
 */
import { describe, it, expect } from 'vitest';
import { Route } from '../../../platform/router/Route';

function makeRoute(path: string): Route {
  return new Route({
    path,
    component: class extends HTMLElement {},
    requiredRole: null,
    requiredPermission: null,
  });
}

describe('Route.matches', () => {
  it('matches a static path', () => {
    const r = makeRoute('/campaigns');
    expect(r.matches('/campaigns')).toEqual({ matched: true, params: {} });
  });

  it('matches a dynamic segment and extracts the param', () => {
    const r = makeRoute('/campaigns/:campaignId');
    expect(r.matches('/campaigns/123')).toEqual({
      matched: true,
      params: { campaignId: '123' },
    });
  });

  it('returns matched:false for a non-matching path', () => {
    const r = makeRoute('/campaigns');
    expect(r.matches('/dashboard')).toEqual({ matched: false, params: {} });
  });

  it('matches multiple dynamic segments', () => {
    const r = makeRoute('/clients/:clientId/campaigns/:campaignId');
    expect(r.matches('/clients/c1/campaigns/c2')).toEqual({
      matched: true,
      params: { clientId: 'c1', campaignId: 'c2' },
    });
  });

  it('does not match when segment counts differ', () => {
    const r = makeRoute('/campaigns/:campaignId');
    expect(r.matches('/campaigns/123/extra')).toEqual({ matched: false, params: {} });
  });
});