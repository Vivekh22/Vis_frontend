// @ts-nocheck
/**
 * NotificationRepository.test.ts — tests for repositories/NotificationRepository.
 *
 * Tests correct endpoints called and DTO → NotificationItem mapping
 * (ISO date string → Date object).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../../repositories/ApiClient';
import { NotificationRepository } from '../../repositories/NotificationRepository';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('NotificationRepository', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetches notifications from correct endpoint', async () => {
    fetchSpy.mockResolvedValue(mockResponse([
      { id: 'n1', title: 'Test', body: 'Body', read: false, createdAt: '2026-08-15T10:00:00.000Z' },
    ]));
    const repo = new NotificationRepository(new ApiClient('https://api.test'));
    await repo.fetchNotifications('user-1');

    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/notifications?userId=user-1');
  });

  it('maps DTO to NotificationItem with Date conversion', async () => {
    fetchSpy.mockResolvedValue(mockResponse([
      { id: 'n1', title: 'Test', body: 'Body', read: false, createdAt: '2026-08-15T10:00:00.000Z' },
      { id: 'n2', title: 'Read', body: 'Body2', read: true, createdAt: '2026-08-14T12:00:00.000Z' },
    ]));
    const repo = new NotificationRepository(new ApiClient('https://api.test'));
    const items = await repo.fetchNotifications('user-1');

    expect(items).toHaveLength(2);
    expect(items[0]!.id).toBe('n1');
    expect(items[0]!.read).toBe(false);
    expect(items[0]!.createdAt).toBeInstanceOf(Date);
    expect(items[0]!.createdAt.toISOString()).toBe('2026-08-15T10:00:00.000Z');
  });

  it('calls correct endpoint for markAsRead', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new NotificationRepository(new ApiClient('https://api.test'));
    await repo.markAsRead('notif-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/notifications/notif-1/read');
    expect(init.method).toBe('POST');
  });

  it('calls correct endpoint for markAllAsRead', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new NotificationRepository(new ApiClient('https://api.test'));
    await repo.markAllAsRead('user-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/notifications/read-all?userId=user-1');
    expect(init.method).toBe('POST');
  });
});