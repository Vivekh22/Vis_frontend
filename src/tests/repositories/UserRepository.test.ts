// @ts-nocheck
/**
 * UserRepository.test.ts — tests for repositories/UserRepository.
 *
 * Tests correct endpoint called and DTO → entity mapping (Record → Map,
 * string[] → Set) for the permission fetch.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../../repositories/ApiClient';
import { UserRepository } from '../../repositories/UserRepository';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('UserRepository', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetches permissions from correct endpoint', async () => {
    fetchSpy.mockResolvedValue(mockResponse({
      modulePermissions: { campaigns: 'view', reports: 'approve' },
      allowedClientIds: ['client-a', 'client-b'],
    }));
    const repo = new UserRepository(new ApiClient('https://api.test'));
    await repo.fetchPermissions('user-1');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/users/user-1/permissions');
  });

  it('maps DTO to Map and Set correctly', async () => {
    fetchSpy.mockResolvedValue(mockResponse({
      modulePermissions: { campaigns: 'view', reports: 'approve' },
      allowedClientIds: ['client-a', 'client-b'],
    }));
    const repo = new UserRepository(new ApiClient('https://api.test'));
    const result = await repo.fetchPermissions('user-1');

    expect(result.modulePermissions.get('campaigns')).toBe('view');
    expect(result.modulePermissions.get('reports')).toBe('approve');
    expect(result.allowedClientIds.has('client-a')).toBe(true);
    expect(result.allowedClientIds.has('client-b')).toBe(true);
    expect(result.allowedClientIds.has('client-c')).toBe(false);
  });

  it('handles empty permissions', async () => {
    fetchSpy.mockResolvedValue(mockResponse({
      modulePermissions: {},
      allowedClientIds: [],
    }));
    const repo = new UserRepository(new ApiClient('https://api.test'));
    const result = await repo.fetchPermissions('user-1');

    expect(result.modulePermissions.size).toBe(0);
    expect(result.allowedClientIds.size).toBe(0);
  });
});