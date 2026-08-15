/**
 * MockApiKeyRepository.ts — repositories/mocks/
 *
 * In-memory mock for ApiKeyService.
 *
 * !!! ONE-TIME REVEAL !!!
 * create() generates a real key, creates an ApiKey entity with only the
 * masked version, and returns { apiKey, realKey } ONCE. The real key is
 * never stored in the mock's state — only the masked entity is retained.
 */
import { ApiKey } from '../../core/entities/ApiKey';
import type { GenerateKeyData, ApiKeyRepository } from '../../services/ApiKeyService';

export class MockApiKeyRepository implements ApiKeyRepository {
  private readonly keys: ApiKey[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    this.keys.push(new ApiKey('key_001', 'Production API', 'full', 'va_sk_...a1b2', 'active', new Date(Date.now() - 30 * 86400000), new Date(Date.now() + 335 * 86400000), new Date(Date.now() - 86400000)));
  }

  async create(data: GenerateKeyData): Promise<{ apiKey: ApiKey; realKey: string }> {
    const realKey = `va_sk_${this.generateRandom(32)}`;
    const maskedKey = `va_sk_...${realKey.slice(-4)}`;
    const expiresAt = data.expiryDays
      ? new Date(Date.now() + data.expiryDays * 86400000)
      : undefined;
    const apiKey = new ApiKey(
      `key_${Date.now().toString(36)}`,
      data.name,
      data.scope,
      maskedKey,
      'active',
      new Date(),
      expiresAt,
    );
    this.keys.push(apiKey);
    // The real key is returned ONCE and never stored — only maskedKey is on the entity.
    return { apiKey, realKey };
  }

  async findAll(_clientId: string): Promise<ApiKey[]> {
    return [...this.keys];
  }

  async revoke(id: string): Promise<void> {
    const key = this.keys.find((k) => k.id === id);
    if (key) key.revoke();
  }

  private generateRandom(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}