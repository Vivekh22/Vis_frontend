// @ts-nocheck
/**
 * ApiClient.test.ts — tests for repositories/ApiClient.
 *
 * Tests the HTTP client's contract: correct method, correct headers
 * (Authorization, Content-Type, CSRF), correct error translation (non-2xx →
 * ApiError with statusCode/body), correct AbortSignal handling, and correct
 * 401 → onUnauthorized callback firing.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../../repositories/ApiClient';
import { ApiError } from '../../core/errors/ApiError';
import { TokenStorage } from '../../security/TokenStorage';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ApiClient', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    TokenStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sends GET request with correct method and Accept header', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }));
    const client = new ApiClient('https://api.test');
    await client.get('/api/users/1');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.method).toBe('GET');
    expect(init.headers['Accept']).toBe('application/json');
    expect(init.body).toBeUndefined();
  });

  it('sends POST request with JSON body and Content-Type header', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }));
    const client = new ApiClient('https://api.test');
    await client.post('/api/items', { name: 'test' });

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ name: 'test' }));
  });

  it('attaches Authorization header when token is present', async () => {
    TokenStorage.setToken('my-token');
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }));
    const client = new ApiClient('https://api.test');
    await client.get('/api/data');

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.headers['Authorization']).toBe('Bearer my-token');
  });

  it('omits Authorization header when no token is present', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }));
    const client = new ApiClient('https://api.test');
    await client.get('/api/data');

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.headers['Authorization']).toBeUndefined();
  });

  it('sets credentials: include', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }));
    const client = new ApiClient('https://api.test');
    await client.get('/api/data');

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.credentials).toBe('include');
  });

  it('attaches CSRF header on state-changing requests', async () => {
    document.cookie = 'csrf_token=test-csrf-token; path=/';
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }));
    const client = new ApiClient('https://api.test');
    await client.post('/api/data', {});

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.headers['X-CSRF-Token']).toBe('test-csrf-token');
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('does not attach CSRF header on GET requests', async () => {
    document.cookie = 'csrf_token=test-csrf-token; path=/';
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }));
    const client = new ApiClient('https://api.test');
    await client.get('/api/data');

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.headers['X-CSRF-Token']).toBeUndefined();
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('translates non-2xx response into ApiError with statusCode and body', async () => {
    fetchSpy.mockImplementation(() => Promise.resolve(mockResponse({ error: 'not found' }, 404)));
    const client = new ApiClient('https://api.test');

    try {
      await client.get('/api/missing');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.body).toEqual({ error: 'not found' });
      expect(apiErr.isNotFound).toBe(true);
    }
  });

  it('calls onUnauthorized callback on 401', async () => {
    const onUnauthorized = vi.fn();
    fetchSpy.mockResolvedValue(mockResponse({ error: 'unauthorized' }, 401));
    const client = new ApiClient('https://api.test', onUnauthorized);

    await expect(client.get('/api/protected')).rejects.toThrow(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not call onUnauthorized on non-401 errors', async () => {
    const onUnauthorized = vi.fn();
    fetchSpy.mockResolvedValue(mockResponse({ error: 'server error' }, 500));
    const client = new ApiClient('https://api.test', onUnauthorized);

    await expect(client.get('/api/data')).rejects.toThrow(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('passes AbortSignal to fetch', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }));
    const client = new ApiClient('https://api.test');
    const controller = new AbortController();
    await client.get('/api/data', { signal: controller.signal });

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.signal).toBe(controller.signal);
  });

  it('handles 204 No Content with undefined return', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 204 }));
    const client = new ApiClient('https://api.test');
    const result = await client.delete('/api/items/1');
    expect(result).toBeUndefined();
  });

  it('translates network errors into ApiError with statusCode 0', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'));
    const client = new ApiClient('https://api.test');

    await expect(client.get('/api/data')).rejects.toThrow(ApiError);
    try {
      await client.get('/api/data');
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.statusCode).toBe(0);
    }
  });

  it('re-throws AbortError without wrapping in ApiError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    fetchSpy.mockRejectedValue(abortError);
    const client = new ApiClient('https://api.test');
    const controller = new AbortController();
    controller.abort();

    await expect(client.get('/api/data', { signal: controller.signal })).rejects.toThrow(abortError);
  });
});