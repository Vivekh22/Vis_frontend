/**
 * AuthRepository.test.ts — tests for repositories/AuthRepository.
 *
 * Tests correct endpoints called, DTO → AuthResponse mapping (including
 * Set conversion for allowedClientIds), and error propagation.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../../repositories/ApiClient';
import { AuthRepository } from '../../repositories/AuthRepository';
import { ApiError } from '../../core/errors/ApiError';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('AuthRepository', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('calls POST /api/auth/login with email and password', async () => {
    fetchSpy.mockResolvedValue(mockResponse({
      token: 'jwt-token',
      user: { id: 'u1', email: 'a@b.com', fullName: 'Test User', role: 'admin' },
    }));
    const repo = new AuthRepository(new ApiClient('https://api.test'));
    await repo.login('a@b.com', 'pass123');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/auth/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'a@b.com', password: 'pass123' });
  });

  it('maps response with permissions and allowedClientIds', async () => {
    fetchSpy.mockResolvedValue(mockResponse({
      token: 'jwt-token',
      user: {
        id: 'u1', email: 'a@b.com', fullName: 'Test User', role: 'admin',
        permissions: { campaigns: 'edit' },
        allowedClientIds: ['c1', 'c2'],
      },
    }));
    const repo = new AuthRepository(new ApiClient('https://api.test'));
    const result = await repo.login('a@b.com', 'pass123');

    expect(result.token).toBe('jwt-token');
    expect(result.user.id).toBe('u1');
    expect(result.user.role).toBe('admin');
    expect(result.user.permissions!.campaigns).toBe('edit');
    expect(result.user.allowedClientIds).toBeInstanceOf(Set);
    expect(result.user.allowedClientIds!.has('c1')).toBe(true);
  });

  it('maps response without optional fields', async () => {
    fetchSpy.mockResolvedValue(mockResponse({
      token: 'jwt-token',
      user: { id: 'u1', email: 'a@b.com', fullName: 'Test', role: 'client' },
    }));
    const repo = new AuthRepository(new ApiClient('https://api.test'));
    const result = await repo.login('a@b.com', 'pass123');

    expect(result.user.permissions).toBeUndefined();
    expect(result.user.allowedClientIds).toBeUndefined();
  });

  it('calls POST /api/auth/refresh with token', async () => {
    fetchSpy.mockResolvedValue(mockResponse({
      token: 'new-jwt',
      user: { id: 'u1', email: 'a@b.com', fullName: 'Test', role: 'admin' },
    }));
    const repo = new AuthRepository(new ApiClient('https://api.test'));
    await repo.refreshToken('old-jwt');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/auth/refresh');
    expect(JSON.parse(init.body)).toEqual({ token: 'old-jwt' });
  });

  it('propagates 401 as ApiError', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ error: 'bad credentials' }, 401));
    const repo = new AuthRepository(new ApiClient('https://api.test'));

    await expect(repo.login('a@b.com', 'wrong')).rejects.toThrow(ApiError);
  });
});