// @ts-nocheck
/**
 * CampaignRepository.test.ts — tests for repositories/CampaignRepository.
 *
 * Tests correct endpoints called, DTO → Campaign entity mapping (including
 * Money and Date conversion), 404 → null translation, and filter query params.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../../repositories/ApiClient';
import { CampaignRepository, mapDtoToCampaign, mapCampaignToDto } from '../../repositories/CampaignRepository';
import { Campaign } from '../../core/entities/Campaign';
import { Money } from '../../core/value-objects/Money';
import { ApiError } from '../../core/errors/ApiError';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const campaignDto = {
  id: 'camp-1',
  name: 'Q3 Campaign',
  clientId: 'client-a',
  budget: { amountMinorUnits: 500000, currency: 'USD' },
  optimizationGoal: 'maximize_clicks',
  startDate: '2026-08-01T00:00:00.000Z',
  endDate: '2026-08-31T00:00:00.000Z',
  status: 'running',
  createdAt: '2026-07-15T10:00:00.000Z',
};

describe('CampaignRepository', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('findById calls GET /api/campaigns/:id', async () => {
    fetchSpy.mockResolvedValue(mockResponse(campaignDto));
    const repo = new CampaignRepository(new ApiClient('https://api.test'));
    const result = await repo.findById('camp-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/campaigns/camp-1');
    expect(init.method).toBe('GET');
    expect(result).toBeInstanceOf(Campaign);
    expect(result!.id).toBe('camp-1');
    expect(result!.status).toBe('running');
  });

  it('findById maps Money and Date correctly', async () => {
    fetchSpy.mockResolvedValue(mockResponse(campaignDto));
    const repo = new CampaignRepository(new ApiClient('https://api.test'));
    const result = await repo.findById('camp-1');

    expect(result!.getBudget().getAmountMinorUnits()).toBe(500000);
    expect(result!.getBudget().getCurrency()).toBe('USD');
    expect(result!.startDate).toBeInstanceOf(Date);
    expect(result!.startDate.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  it('findById returns null on 404', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ error: 'not found' }, 404));
    const repo = new CampaignRepository(new ApiClient('https://api.test'));
    const result = await repo.findById('missing');
    expect(result).toBeNull();
  });

  it('findById propagates non-404 errors', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ error: 'server error' }, 500));
    const repo = new CampaignRepository(new ApiClient('https://api.test'));
    await expect(repo.findById('camp-1')).rejects.toThrow(ApiError);
  });

  it('findAll calls GET /api/campaigns with filter params', async () => {
    fetchSpy.mockResolvedValue(mockResponse([campaignDto]));
    const repo = new CampaignRepository(new ApiClient('https://api.test'));
    await repo.findAll({ clientId: 'client-a', status: 'running' });

    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toContain('/api/campaigns?');
    expect(url).toContain('clientId=client-a');
    expect(url).toContain('status=running');
  });

  it('findAll maps array of DTOs to Campaign entities', async () => {
    fetchSpy.mockResolvedValue(mockResponse([campaignDto, { ...campaignDto, id: 'camp-2' }]));
    const repo = new CampaignRepository(new ApiClient('https://api.test'));
    const results = await repo.findAll();

    expect(results).toHaveLength(2);
    expect(results[0]).toBeInstanceOf(Campaign);
    expect(results[1]).toBeInstanceOf(Campaign);
  });

  it('save calls PUT /api/campaigns/:id with serialized body', async () => {
    fetchSpy.mockResolvedValue(mockResponse(campaignDto));
    const repo = new CampaignRepository(new ApiClient('https://api.test'));
    const campaign = new Campaign(
      'camp-1', 'Q3 Campaign', 'client-a',
      new Money(500000, 'USD'), 'maximize_clicks',
      new Date('2026-08-01T00:00:00.000Z'), new Date('2026-08-31T00:00:00.000Z'),
    );
    await repo.save(campaign);

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/campaigns/camp-1');
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body);
    expect(body.budget.amountMinorUnits).toBe(500000);
    expect(body.optimizationGoal).toBe('maximize_clicks');
  });

  it('delete calls DELETE /api/campaigns/:id', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new CampaignRepository(new ApiClient('https://api.test'));
    await repo.delete('camp-1');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/campaigns/camp-1');
    expect(init.method).toBe('DELETE');
  });

  it('mapCampaignToDto and mapDtoToCampaign are inverses', () => {
    const campaign = new Campaign(
      'camp-1', 'Test', 'client-a',
      new Money(1000, 'USD'), 'maximize_reach',
      new Date('2026-01-01T00:00:00.000Z'), new Date('2026-02-01T00:00:00.000Z'),
      'draft', new Date('2026-01-01T00:00:00.000Z'),
    );
    const dto = mapCampaignToDto(campaign);
    const restored = mapDtoToCampaign(dto);
    expect(restored.id).toBe(campaign.id);
    expect(restored.name).toBe(campaign.name);
    expect(restored.getBudget().getAmountMinorUnits()).toBe(1000);
    expect(restored.status).toBe('draft');
  });
});