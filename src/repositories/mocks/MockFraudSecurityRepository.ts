/**
 * MockFraudSecurityRepository.ts — repositories/mocks/
 */
import type { FraudSecuritySummary, FraudSecurityRepository } from '../../services/FraudSecurityService';

export class MockFraudSecurityRepository implements FraudSecurityRepository {
  async getSummary(): Promise<FraudSecuritySummary> {
    return {
      ivtRateTrend: [
        { label: 'Jun', value: 3.2 },
        { label: 'Jul', value: 2.8 },
        { label: 'Aug', value: 3.1 },
      ],
      blocklistSize: 14820,
      recentBlocklistAdditions: [
        { ip: '192.168.1.100', reason: 'Bot traffic pattern', addedAt: new Date('2026-08-14') },
        { ip: '10.0.0.55', reason: 'Click spamming', addedAt: new Date('2026-08-13') },
        { ip: '172.16.0.22', reason: 'IVT detected', addedAt: new Date('2026-08-12') },
      ],
      incidents: [
        { id: 'inc-1', type: 'IVT Spike', severity: 'high', description: 'IVT rate exceeded 5% threshold on client-2', detectedAt: new Date('2026-08-12'), status: 'resolved' },
        { id: 'inc-2', type: 'Click Spam', severity: 'medium', description: 'Suspicious click pattern from IP range', detectedAt: new Date('2026-08-14'), status: 'investigating' },
        { id: 'inc-3', type: 'SDK Spoofing', severity: 'low', description: 'Minor SDK spoofing attempt detected', detectedAt: new Date('2026-08-10'), status: 'open' },
      ],
    };
  }
}