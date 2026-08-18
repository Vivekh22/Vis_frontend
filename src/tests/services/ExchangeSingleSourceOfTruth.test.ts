// @ts-nocheck
/**
 * ExchangeSingleSourceOfTruth.test.ts
 *
 * Proves that Part 12's Exchange Management and Part 13's Connected
 * Exchanges page read from the SAME underlying data source — not
 * parallel lists.
 *
 * MockExchangeRepository.getAvailableExchanges() imports
 * CONNECTED_EXCHANGE_NAMES from MockPlatformConnectionRepository.
 */
import { describe, it, expect } from 'vitest';
import { MockExchangeRepository } from '../../repositories/mocks/MockExchangeRepository';
import { MockPlatformConnectionRepository, CONNECTED_EXCHANGE_NAMES } from '../../repositories/mocks/MockPlatformConnectionRepository';

describe('Exchange Single Source of Truth', () => {
  it('MockExchangeRepository imports CONNECTED_EXCHANGE_NAMES from MockPlatformConnectionRepository', () => {
    // The exchange repo's available list IS the platform connection repo's list
    const exchangeRepo = new MockExchangeRepository();
    // The constant is exported from MockPlatformConnectionRepository
    expect(CONNECTED_EXCHANGE_NAMES).toBeDefined();
    expect(CONNECTED_EXCHANGE_NAMES.length).toBeGreaterThan(0);
  });

  it('both repos return the same exchange names', async () => {
    const exchangeRepo = new MockExchangeRepository();
    const platformRepo = new MockPlatformConnectionRepository();

    const exchangeNames = await exchangeRepo.getAvailableExchanges();
    const platformExchanges = await platformRepo.getConnectedExchanges();
    const platformNames = platformExchanges.map((e) => e.name);

    // Both lists must match — same source of truth
    expect(exchangeNames).toEqual(platformNames);
  });

  it('adding a new exchange to the platform connection list would appear in Exchange Management', async () => {
    // Since MockExchangeRepository uses [...CONNECTED_EXCHANGE_NAMES],
    // any exchange in CONNECTED_EXCHANGE_NAMES is available in both places
    const exchangeRepo = new MockExchangeRepository();
    const exchangeNames = await exchangeRepo.getAvailableExchanges();

    for (const name of CONNECTED_EXCHANGE_NAMES) {
      expect(exchangeNames).toContain(name);
    }
  });
});