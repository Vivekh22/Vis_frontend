/**
 * ApiKeyRepository.ts — repositories/
 *
 * Real implementation of ApiKeyRepository.
 *
 * !!! ONE-TIME REVEAL !!!
 * The create() method returns { apiKey, realKey } from the API response.
 * The API returns the real key ONCE — it is never stored in the entity
 * (only maskedKey is persisted). There is no endpoint to retrieve the
 * real key after creation.
 */
import { ApiKey } from '../core/entities/ApiKey';
import type { ApiKeyStatus } from '../core/enums/ApiKeyStatus';
import type { GenerateKeyData, ApiKeyRepository as IApiKeyRepository } from '../services/ApiKeyService';
import { ApiClient } from './ApiClient';

interface ApiKeyDto {
  id: string; name: string; scope: string; maskedKey: string;
  status: ApiKeyStatus; createdAt: string; expiresAt?: string; lastUsedAt?: string;
}
interface CreateKeyResponseDto extends ApiKeyDto { realKey: string; }

export function mapDtoToApiKey(dto: ApiKeyDto): ApiKey {
  return new ApiKey(
    dto.id, dto.name, dto.scope, dto.maskedKey, dto.status,
    new Date(dto.createdAt), dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    dto.lastUsedAt ? new Date(dto.lastUsedAt) : undefined,
  );
}

export class ApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly api: ApiClient) {}

  async create(data: GenerateKeyData): Promise<{ apiKey: ApiKey; realKey: string }> {
    const dto = await this.api.post<CreateKeyResponseDto>('/api/api-keys', {
      clientId: data.clientId, name: data.name, scope: data.scope, expiryDays: data.expiryDays,
    });
    return { apiKey: mapDtoToApiKey(dto), realKey: dto.realKey };
  }

  async findAll(clientId: string): Promise<ApiKey[]> {
    const dtos = await this.api.get<ApiKeyDto[]>(`/api/api-keys?clientId=${encodeURIComponent(clientId)}`);
    return dtos.map(mapDtoToApiKey);
  }

  async revoke(id: string): Promise<void> {
    await this.api.post<void>(`/api/api-keys/${encodeURIComponent(id)}/revoke`, {});
  }
}