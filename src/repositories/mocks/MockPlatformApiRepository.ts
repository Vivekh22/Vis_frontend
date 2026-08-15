/**
 * MockPlatformApiRepository.ts — repositories/mocks/
 *
 * Mock-backed platform API key management. Does NOT share state with
 * client-level MockApiKeyRepository — different audience, different data.
 */
import type {
  PlatformApiKey,
  WebhookDeliveryHealth,
  PlatformApiRepository,
} from '../../services/PlatformApiService';

function maskKey(suffix: string): string {
  return `va_pk_••••••••••••${suffix}`;
}

export class MockPlatformApiRepository implements PlatformApiRepository {
  private keys: PlatformApiKey[] = [
    {
      id: 'pak-1', name: 'Partner Portal Integration', maskedKey: maskKey('a1b2'),
      scope: 'read', status: 'active', issuedTo: 'Acme Corp',
      createdAt: new Date('2025-11-15'), expiresAt: null, rateLimit: 1000,
    },
    {
      id: 'pak-2', name: 'Reporting API', maskedKey: maskKey('c3d4'),
      scope: 'read', status: 'active', issuedTo: 'GlobalMetrics Ltd',
      createdAt: new Date('2026-01-20'), expiresAt: new Date('2027-01-20'), rateLimit: 5000,
    },
    {
      id: 'pak-3', name: 'Legacy Feed', maskedKey: maskKey('e5f6'),
      scope: 'full', status: 'revoked', issuedTo: 'Old Partner Inc',
      createdAt: new Date('2024-06-10'), expiresAt: null, rateLimit: 500,
    },
  ];
  private rateLimitConfig = { defaultLimit: 1000, burstLimit: 2000 };
  private webhookHealth: WebhookDeliveryHealth[] = [
    { clientId: 'client-1', clientName: 'Acme Corp', totalDeliveries: 1240, successRate: 99.2, failedDeliveries: 10, lastFailure: new Date('2026-08-10') },
    { clientId: 'client-2', clientName: 'TechStart LLC', totalDeliveries: 830, successRate: 98.1, failedDeliveries: 16, lastFailure: new Date('2026-08-12') },
    { clientId: 'client-3', clientName: 'GrowthCo', totalDeliveries: 2100, successRate: 99.8, failedDeliveries: 4, lastFailure: null },
  ];

  async listPlatformApiKeys(): Promise<PlatformApiKey[]> {
    return [...this.keys];
  }

  async createPlatformApiKey(name: string, scope: string, rateLimit: number): Promise<{ id: string; realKey: string }> {
    const id = `pak-${this.keys.length + 1}`;
    const realKey = `va_pk_live_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    this.keys.push({
      id, name, maskedKey: maskKey(realKey.slice(-4)), scope, status: 'active',
      issuedTo: 'External Integrator', createdAt: new Date(), expiresAt: null, rateLimit,
    });
    return { id, realKey };
  }

  async revokePlatformApiKey(id: string): Promise<void> {
    const key = this.keys.find((k) => k.id === id);
    if (key) (key as { status: string }).status = 'revoked';
  }

  async getPlatformRateLimitConfig(): Promise<{ defaultLimit: number; burstLimit: number }> {
    return { ...this.rateLimitConfig };
  }

  async updatePlatformRateLimitConfig(defaultLimit: number, burstLimit: number): Promise<void> {
    this.rateLimitConfig = { defaultLimit, burstLimit };
  }

  async getWebhookDeliveryHealth(): Promise<WebhookDeliveryHealth[]> {
    return [...this.webhookHealth];
  }
}