/**
 * MockExchangeRepository.ts — repositories/mocks/
 *
 * In-memory mock for ExchangeService. Seeds a reasonable exchange
 * list (mocked until Part 13's Connected Exchanges/SSPs page exists).
 */
import { ExchangeConfig, type ExchangeStatus } from '../../core/entities/ExchangeConfig';
import type { ExchangeRepository } from '../../services/ExchangeService';

// SINGLE SOURCE OF TRUTH: exchange names come from MockPlatformConnectionRepository
// (Part 13's Connected Exchanges page), not a separate list here.
import { CONNECTED_EXCHANGE_NAMES } from './MockPlatformConnectionRepository';
const MOCK_EXCHANGES = [...CONNECTED_EXCHANGE_NAMES];

export class MockExchangeRepository implements ExchangeRepository {
  private readonly configs: Map<string, ExchangeConfig[]> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    for (const clientId of ['client-1', 'client-2', 'client-3']) {
      const configs: ExchangeConfig[] = MOCK_EXCHANGES.map((name, i) => {
        const status: ExchangeStatus = i % 3 === 2 ? 'blocked' : 'allowed';
        return new ExchangeConfig(clientId, name, status);
      });
      this.configs.set(clientId, configs);
    }
  }

  async getClientExchanges(clientId: string): Promise<ExchangeConfig[]> {
    return this.configs.get(clientId) ?? [];
  }

  async setExchangeStatus(clientId: string, exchangeName: string, status: ExchangeStatus): Promise<void> {
    const configs = this.configs.get(clientId) ?? [];
    const config = configs.find((c) => c.exchangeName === exchangeName);
    if (config) config.setStatus(status);
  }

  async setExchangeOverride(clientId: string, exchangeName: string, campaignType: string, status: ExchangeStatus): Promise<void> {
    const configs = this.configs.get(clientId) ?? [];
    const config = configs.find((c) => c.exchangeName === exchangeName);
    if (config) config.setOverride(campaignType, status);
  }

  async bulkSetStatus(clientId: string, status: ExchangeStatus): Promise<void> {
    const configs = this.configs.get(clientId) ?? [];
    for (const config of configs) {
      config.setStatus(status);
    }
  }

  async getAvailableExchanges(): Promise<string[]> {
    return [...MOCK_EXCHANGES];
  }
}