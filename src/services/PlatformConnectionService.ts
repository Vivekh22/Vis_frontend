/**
 * PlatformConnectionService.ts — services/
 *
 * Manages platform-level connections to exchanges/SSPs, publishers, and DSPs.
 * This is the SINGLE SOURCE OF TRUTH for which exchanges exist on the
 * platform — Part 12's Exchange Management reads from this service via
 * MockExchangeRepository.getAvailableExchanges(), which delegates here.
 *
 * DATA SOURCE NOTE:
 *   Connected Exchanges data is currently mock-backed. In production, this
 *   will come from Taranga's own monitoring output — NOT something this
 *   frontend computes itself.
 */
export type ConnectionStatus = 'live' | 'degraded' | 'down';

export interface ConnectedExchange {
  readonly id: string;
  readonly name: string;
  readonly status: ConnectionStatus;
  readonly openRtbVersion: string;
  readonly currentQps: number;
  readonly uptimeHistory: { label: string; value: number }[];
}

export interface PlatformConnectionRepository {
  getConnectedExchanges(): Promise<ConnectedExchange[]>;
  getConnectedPublishers(): Promise<never[]>;
  getConnectedDsps(): Promise<never[]>;
}

export class PlatformConnectionService {
  constructor(private readonly repo: PlatformConnectionRepository) {}

  async getConnectedExchanges(): Promise<ConnectedExchange[]> {
    return this.repo.getConnectedExchanges();
  }

  async getConnectedPublishers(): Promise<never[]> {
    return this.repo.getConnectedPublishers();
  }

  async getConnectedDsps(): Promise<never[]> {
    return this.repo.getConnectedDsps();
  }
}