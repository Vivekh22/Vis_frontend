/**
 * CreativeRepository.test.ts — tests for repositories/CreativeRepository.
 *
 * Tests correct endpoints called, DTO → Creative entity mapping, 404 → null,
 * and filter query params.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../../repositories/ApiClient';
import { CreativeRepository, mapDtoToCreative, mapCreativeToDto } from '../../repositories/CreativeRepository';
import { Creative } from '../../core/entities/Creative';
import { ApiError } from '../../core/errors/ApiError';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const creativeDto = {
  id: 'cr-1',
  name: 'Banner Ad',
  campaignId: 'camp-1',
  format: 'html5',
  assetUrl: 'https://cdn.test/ad.html',
  status: 'active',
  createdAt: '2026-07-20T10:00:00.000Z',
};

describe('CreativeRepository', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('findById calls GET /api/creatives/:id', async () => {
    fetchSpy.mockResolvedValue(mockResponse(creativeDto));
    const repo = new CreativeRepository(new ApiClient('https://api.test'));
    const result = await repo.findById('cr-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/creatives/cr-1');
    expect(init.method).toBe('GET');
    expect(result).toBeInstanceOf(Creative);
    expect(result!.id).toBe('cr-1');
    expect(result!.format).toBe('html5');
  });

  it('findById returns null on 404', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ error: 'not found' }, 404));
    const repo = new CreativeRepository(new ApiClient('https://api.test'));
    const result = await repo.findById('missing');
    expect(result).toBeNull();
  });

  it('findById propagates non-404 errors', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ error: 'server error' }, 500));
    const repo = new CreativeRepository(new ApiClient('https://api.test'));
    await expect(repo.findById('cr-1')).rejects.toThrow(ApiError);
  });

  it('findAll calls GET /api/creatives with filter params', async () => {
    fetchSpy.mockResolvedValue(mockResponse([creativeDto]));
    const repo = new CreativeRepository(new ApiClient('https://api.test'));
    await repo.findAll({ campaignId: 'camp-1', status: 'active' });

    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toContain('campaignId=camp-1');
    expect(url).toContain('status=active');
  });

  it('save calls PUT /api/creatives/:id with serialized body', async () => {
    fetchSpy.mockResolvedValue(mockResponse(creativeDto));
    const repo = new CreativeRepository(new ApiClient('https://api.test'));
    const creative = new Creative('cr-1', 'Banner Ad', 'camp-1', 'html5', 'https://cdn.test/ad.html');
    await repo.save(creative);

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/creatives/cr-1');
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body);
    expect(body.format).toBe('html5');
    expect(body.assetUrl).toBe('https://cdn.test/ad.html');
  });

  it('delete calls DELETE /api/creatives/:id', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new CreativeRepository(new ApiClient('https://api.test'));
    await repo.delete('cr-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/creatives/cr-1');
    expect(init.method).toBe('DELETE');
  });

  it('mapCreativeToDto and mapDtoToCreative are inverses', () => {
    const creative = new Creative('cr-1', 'Test', 'camp-1', 'image', 'https://cdn.test/ad.png');
    const dto = mapCreativeToDto(creative);
    const restored = mapDtoToCreative(dto);
    expect(restored.id).toBe(creative.id);
    expect(restored.format).toBe('image');
    expect(restored.assetUrl).toBe('https://cdn.test/ad.png');
  });
});