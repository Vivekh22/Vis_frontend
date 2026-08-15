/**
 * ApiKeyService.ts — services/
 *
 * Orchestrates API key generation, listing (masked), and revocation.
 *
 * !!! ONE-TIME REVEAL — REAL KEY NEVER RETAINED IN STATE !!!
 *
 * generateKey() returns { apiKey, realKey } exactly ONCE. The realKey
 * string is the full API key — it is returned to the caller for one-time
 * display and is NEVER stored in the service, the entity, or any client-
 * side state. The ApiKey entity stores only `maskedKey` (e.g.
 * "va_sk_...a1b2").
 *
 * After the reveal screen closes, the real key is irretrievable. The
 * service's listKeys() method returns only masked representations.
 * There is no getRealKey() method — by design.
 */
import type { ApiKey } from '../core/entities/ApiKey';

export interface GenerateKeyData {
  clientId: string;
  name: string;
  scope: string;
  expiryDays?: number;
}

export interface GeneratedKeyResult {
  apiKey: ApiKey;
  /** The full, real API key — returned ONCE. Never stored or retrievable again. */
  realKey: string;
}

export interface ApiKeyRepository {
  create(data: GenerateKeyData): Promise<{ apiKey: ApiKey; realKey: string }>;
  findAll(clientId: string): Promise<ApiKey[]>;
  revoke(id: string): Promise<void>;
}

export class ApiKeyService {
  constructor(private readonly apiKeyRepo: ApiKeyRepository) {}

  /**
   * Generates a new API key. Returns the real key ONCE — the caller must
   * display it immediately. After this call returns, the real key is never
   * retrievable again. The stored entity has only a masked representation.
   */
  async generateKey(data: GenerateKeyData): Promise<GeneratedKeyResult> {
    const result = await this.apiKeyRepo.create(data);
    return { apiKey: result.apiKey, realKey: result.realKey };
  }

  /**
   * Lists all API keys for a client. Returns ONLY masked representations —
   * the real keys are never retrievable.
   */
  async listKeys(clientId: string): Promise<ApiKey[]> {
    return await this.apiKeyRepo.findAll(clientId);
  }

  async revokeKey(id: string): Promise<void> {
    await this.apiKeyRepo.revoke(id);
  }
}