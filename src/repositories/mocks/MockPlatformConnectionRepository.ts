/**
 * MockPlatformConnectionRepository.ts — repositories/mocks/
 *
 * Mock-backed platform connections. Exports CONNECTED_EXCHANGE_NAMES as
 * the SINGLE SOURCE OF TRUTH for which exchanges exist — MockExchangeRepository
 * imports this constant so Part 12's Exchange Management and Part 13's
 * Connected Exchanges page read from the same list.
 *
 * In production, this data will come from Taranga's monitoring output.
 */
import type {
  ConnectedExchange,
  PlatformConnectionRepository,
} from '../../services/PlatformConnectionService';

export const CONNECTED_EXCHANGE_NAMES = [
  'Google AdMob',
  'Meta Audience Network',
  'Unity Ads',
  'AppLovin',
  'IronSource',
  'Vungle',
] as const;

function genUptimeHistory(base: number): { label: string; value: number }[] {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label) => ({
    label,
    value: Math.round((base + (Math.random() * 2 - 1)) * 10) / 10,
  }));
}

export class MockPlatformConnectionRepository implements PlatformConnectionRepository {
  private readonly exchanges: ConnectedExchange[] = [
    {
      id: 'ex-1',
      name: 'Google AdMob',
      status: 'live',
      openRtbVersion: '2.5',
      currentQps: 48200,
      uptimeHistory: genUptimeHistory(99.9),
    },
    {
      id: 'ex-2',
      name: 'Meta Audience Network',
      status: 'live',
      openRtbVersion: '2.5',
      currentQps: 31800,
      uptimeHistory: genUptimeHistory(99.8),
    },
    {
      id: 'ex-3',
      name: 'Unity Ads',
      status: 'degraded',
      openRtbVersion: '2.4',
      currentQps: 12400,
      uptimeHistory: genUptimeHistory(97.2),
    },
    {
      id: 'ex-4',
      name: 'AppLovin',
      status: 'live',
      openRtbVersion: '2.5',
      currentQps: 22600,
      uptimeHistory: genUptimeHistory(99.6),
    },
    {
      id: 'ex-5',
      name: 'IronSource',
      status: 'down',
      openRtbVersion: '2.3',
      currentQps: 0,
      uptimeHistory: genUptimeHistory(82.4),
    },
    {
      id: 'ex-6',
      name: 'Vungle',
      status: 'live',
      openRtbVersion: '2.5',
      currentQps: 9800,
      uptimeHistory: genUptimeHistory(99.4),
    },
  ];

  async getConnectedExchanges(): Promise<ConnectedExchange[]> {
    return [...this.exchanges];
  }

  async getConnectedPublishers(): Promise<never[]> {
    return [];
  }

  async getConnectedDsps(): Promise<never[]> {
    return [];
  }
}