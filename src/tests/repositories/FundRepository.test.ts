/**
 * FundRepository.test.ts — tests for repositories/FundRepository.
 *
 * Tests correct endpoints called, DTO → FundTransaction/Money mapping, and
 * filter query params for getTransactions.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../../repositories/ApiClient';
import { FundRepository, mapDtoToFundTransaction, mapFundTransactionToDto } from '../../repositories/FundRepository';
import { FundTransaction } from '../../core/entities/FundTransaction';
import { Money } from '../../core/value-objects/Money';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('FundRepository', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('getBalance calls GET /api/funds/:clientId/balance', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ amountMinorUnits: 50000, currency: 'USD' }));
    const repo = new FundRepository(new ApiClient('https://api.test'));
    const balance = await repo.getBalance('client-a');

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/funds/client-a/balance');
    expect(init.method).toBe('GET');
    expect(balance.getAmountMinorUnits()).toBe(50000);
    expect(balance.getCurrency()).toBe('USD');
  });

  it('addTransaction calls POST with serialized body', async () => {
    const txDto = {
      id: 'ft-1', clientId: 'client-a', type: 'deposit',
      amount: { amountMinorUnits: 10000, currency: 'USD' },
      createdAt: '2026-08-15T10:00:00.000Z', description: 'Test deposit',
    };
    fetchSpy.mockResolvedValue(mockResponse(txDto));
    const repo = new FundRepository(new ApiClient('https://api.test'));
    const tx = new FundTransaction('ft-1', 'client-a', 'deposit', new Money(10000, 'USD'), new Date(), 'Test deposit');
    await repo.addTransaction(tx);

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/funds/client-a/transactions');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.amount.amountMinorUnits).toBe(10000);
  });

  it('addTransaction maps response back to FundTransaction', async () => {
    const txDto = {
      id: 'ft-1', clientId: 'client-a', type: 'deposit',
      amount: { amountMinorUnits: 10000, currency: 'USD' },
      createdAt: '2026-08-15T10:00:00.000Z', description: 'Test',
    };
    fetchSpy.mockResolvedValue(mockResponse(txDto));
    const repo = new FundRepository(new ApiClient('https://api.test'));
    const tx = new FundTransaction('ft-1', 'client-a', 'deposit', new Money(10000, 'USD'));
    const result = await repo.addTransaction(tx);

    expect(result).toBeInstanceOf(FundTransaction);
    expect(result.getAmount().getAmountMinorUnits()).toBe(10000);
  });

  it('getTransactions calls GET with filter params', async () => {
    fetchSpy.mockResolvedValue(mockResponse([]));
    const repo = new FundRepository(new ApiClient('https://api.test'));
    await repo.getTransactions('client-a', { type: 'deposit' });

    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toContain('/api/funds/client-a/transactions');
    expect(url).toContain('type=deposit');
  });

  it('setLowBalanceThreshold calls PUT with Money body', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new FundRepository(new ApiClient('https://api.test'));
    await repo.setLowBalanceThreshold('client-a', new Money(5000, 'USD'));

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/funds/client-a/threshold');
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body);
    expect(body.amountMinorUnits).toBe(5000);
  });

  it('setAutoRecharge calls PUT with config body', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new FundRepository(new ApiClient('https://api.test'));
    await repo.setAutoRecharge('client-a', {
      enabled: true,
      threshold: new Money(5000, 'USD'),
      amount: new Money(20000, 'USD'),
    });

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/funds/client-a/auto-recharge');
    const body = JSON.parse(init.body);
    expect(body.enabled).toBe(true);
    expect(body.threshold.amountMinorUnits).toBe(5000);
    expect(body.amount.amountMinorUnits).toBe(20000);
  });

  it('mapFundTransactionToDto and mapDtoToFundTransaction are inverses', () => {
    const tx = new FundTransaction('ft-1', 'client-a', 'deposit', new Money(10000, 'USD'), new Date(), 'Test');
    const dto = mapFundTransactionToDto(tx);
    const restored = mapDtoToFundTransaction(dto);
    expect(restored.id).toBe(tx.id);
    expect(restored.type).toBe('deposit');
    expect(restored.getAmount().getAmountMinorUnits()).toBe(10000);
  });
});