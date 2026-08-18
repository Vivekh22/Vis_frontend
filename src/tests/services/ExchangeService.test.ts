// @ts-nocheck
/**
 * ExchangeService.test.ts
 *
 * Tests per-client exchange allow/block, bulk allow all / block all,
 * and per-campaign-type overrides.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ExchangeService } from '../../services/ExchangeService';
import { MockExchangeRepository } from '../../repositories/mocks/MockExchangeRepository';

describe('ExchangeService', () => {
  let service: ExchangeService;

  beforeEach(() => {
    const repo = new MockExchangeRepository();
    service = new ExchangeService(repo);
  });

  it('returns available exchanges', async () => {
    const exchanges = await service.getAvailableExchanges();
    expect(exchanges.length).toBeGreaterThan(0);
    expect(exchanges).toContain('Google AdMob');
  });

  it('returns client exchanges with allowed/blocked status', async () => {
    const configs = await service.getClientExchanges('client-1');
    expect(configs.length).toBeGreaterThan(0);
    const statuses = configs.map((c) => c.status);
    expect(statuses).toContain('allowed');
  });

  it('sets exchange status to blocked', async () => {
    await service.setExchangeStatus('client-1', 'Google AdMob', 'blocked');
    const configs = await service.getClientExchanges('client-1');
    const adMob = configs.find((c) => c.exchangeName === 'Google AdMob');
    expect(adMob!.status).toBe('blocked');
  });

  it('bulk allows all exchanges', async () => {
    await service.bulkAllowAll('client-1');
    const configs = await service.getClientExchanges('client-1');
    const allAllowed = configs.every((c) => c.status === 'allowed');
    expect(allAllowed).toBe(true);
  });

  it('bulk blocks all exchanges', async () => {
    await service.bulkBlockAll('client-1');
    const configs = await service.getClientExchanges('client-1');
    const allBlocked = configs.every((c) => c.status === 'blocked');
    expect(allBlocked).toBe(true);
  });

  it('sets per-campaign-type override', async () => {
    await service.setExchangeOverride('client-1', 'Google AdMob', 'Acquisition', 'blocked');
    const configs = await service.getClientExchanges('client-1');
    const adMob = configs.find((c) => c.exchangeName === 'Google AdMob');
    const overrideStatus = adMob!.getOverrideStatus('Acquisition');
    expect(overrideStatus).toBe('blocked');
  });
});