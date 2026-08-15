/**
 * ApprovalRepository.test.ts — tests for repositories/ApprovalRepository.
 *
 * Tests correct endpoints called, DTO → ApprovalItem mapping, 404 → null,
 * and approve/reject/requestChanges endpoint shapes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../../repositories/ApiClient';
import { ApprovalRepository } from '../../repositories/ApprovalRepository';
import { ApprovalItem } from '../../core/entities/ApprovalItem';
import { ApiError } from '../../core/errors/ApiError';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const approvalDto = {
  id: 'ap-1',
  itemType: 'campaign',
  itemId: 'camp-1',
  itemName: 'Q3 Campaign',
  clientId: 'client-a',
  submittedBy: 'user-1',
  submittedAt: '2026-08-14T10:00:00.000Z',
  status: 'pending_approval',
  note: null,
};

describe('ApprovalRepository', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('findById calls GET /api/approvals/:id', async () => {
    fetchSpy.mockResolvedValue(mockResponse(approvalDto));
    const repo = new ApprovalRepository(new ApiClient('https://api.test'));
    const result = await repo.findById('ap-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/approvals/ap-1');
    expect(init.method).toBe('GET');
    expect(result).toBeInstanceOf(ApprovalItem);
    expect(result!.itemType).toBe('campaign');
  });

  it('findById maps Date correctly', async () => {
    fetchSpy.mockResolvedValue(mockResponse(approvalDto));
    const repo = new ApprovalRepository(new ApiClient('https://api.test'));
    const result = await repo.findById('ap-1');

    expect(result!.submittedAt).toBeInstanceOf(Date);
    expect(result!.submittedAt.toISOString()).toBe('2026-08-14T10:00:00.000Z');
  });

  it('findById returns null on 404', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ error: 'not found' }, 404));
    const repo = new ApprovalRepository(new ApiClient('https://api.test'));
    const result = await repo.findById('missing');
    expect(result).toBeNull();
  });

  it('findById propagates non-404 errors', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ error: 'server error' }, 500));
    const repo = new ApprovalRepository(new ApiClient('https://api.test'));
    await expect(repo.findById('ap-1')).rejects.toThrow(ApiError);
  });

  it('findAll calls GET /api/approvals with filter params', async () => {
    fetchSpy.mockResolvedValue(mockResponse([approvalDto]));
    const repo = new ApprovalRepository(new ApiClient('https://api.test'));
    await repo.findAll({ status: 'pending_approval', clientId: 'client-a' });

    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toContain('status=pending_approval');
    expect(url).toContain('clientId=client-a');
  });

  it('approve calls POST /api/approvals/:id/approve', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new ApprovalRepository(new ApiClient('https://api.test'));
    await repo.approve('ap-1', 'Looks good', 'admin-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/approvals/ap-1/approve');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body).toEqual({ note: 'Looks good', actorId: 'admin-1' });
  });

  it('reject calls POST /api/approvals/:id/reject', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new ApprovalRepository(new ApiClient('https://api.test'));
    await repo.reject('ap-1', 'Not compliant', 'admin-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/approvals/ap-1/reject');
    const body = JSON.parse(init.body);
    expect(body.note).toBe('Not compliant');
  });

  it('requestChanges calls POST /api/approvals/:id/request-changes', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new ApprovalRepository(new ApiClient('https://api.test'));
    await repo.requestChanges('ap-1', 'Update creative', 'admin-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/approvals/ap-1/request-changes');
    const body = JSON.parse(init.body);
    expect(body.note).toBe('Update creative');
  });
});