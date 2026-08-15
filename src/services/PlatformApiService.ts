/**
 * PlatformApiService.ts — services/
 *
 * Platform-level API key management — DISTINCT from client-level ApiKey
 * (Part 10). Different audience (external platform integrators vs. client
 * users), different data model. This service does NOT share state with
 * the client IntegrationsPageElement's ApiKeyService.
 */
export interface PlatformApiKey {
  readonly id: string;
  readonly name: string;
  readonly maskedKey: string;
  readonly scope: string;
  readonly status: 'active' | 'revoked' | 'expired';
  readonly issuedTo: string;
  readonly createdAt: Date;
  readonly expiresAt: Date | null;
  readonly rateLimit: number;
}

export interface WebhookDeliveryHealth {
  readonly clientId: string;
  readonly clientName: string;
  readonly totalDeliveries: number;
  readonly successRate: number;
  readonly failedDeliveries: number;
  readonly lastFailure: Date | null;
}

export interface PlatformApiRepository {
  listPlatformApiKeys(): Promise<PlatformApiKey[]>;
  createPlatformApiKey(name: string, scope: string, rateLimit: number): Promise<{ id: string; realKey: string }>;
  revokePlatformApiKey(id: string): Promise<void>;
  getPlatformRateLimitConfig(): Promise<{ defaultLimit: number; burstLimit: number }>;
  updatePlatformRateLimitConfig(defaultLimit: number, burstLimit: number): Promise<void>;
  getWebhookDeliveryHealth(): Promise<WebhookDeliveryHealth[]>;
}

export class PlatformApiService {
  constructor(private readonly repo: PlatformApiRepository) {}

  async listPlatformApiKeys(): Promise<PlatformApiKey[]> {
    return this.repo.listPlatformApiKeys();
  }

  async createPlatformApiKey(name: string, scope: string, rateLimit: number): Promise<{ id: string; realKey: string }> {
    return this.repo.createPlatformApiKey(name, scope, rateLimit);
  }

  async revokePlatformApiKey(id: string): Promise<void> {
    await this.repo.revokePlatformApiKey(id);
  }

  async getPlatformRateLimitConfig(): Promise<{ defaultLimit: number; burstLimit: number }> {
    return this.repo.getPlatformRateLimitConfig();
  }

  async updatePlatformRateLimitConfig(defaultLimit: number, burstLimit: number): Promise<void> {
    await this.repo.updatePlatformRateLimitConfig(defaultLimit, burstLimit);
  }

  async getWebhookDeliveryHealth(): Promise<WebhookDeliveryHealth[]> {
    return this.repo.getWebhookDeliveryHealth();
  }
}