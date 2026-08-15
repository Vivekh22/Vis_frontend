/**
 * IntegrationRepository.ts — repositories/
 *
 * Real implementation of IntegrationRepository.
 */
import { IntegrationConfig } from '../core/entities/IntegrationConfig';
import { WebhookConfig } from '../core/entities/WebhookConfig';
import type { IntegrationProvider } from '../core/enums/IntegrationProvider';
import type { WebhookEvent } from '../core/enums/WebhookEvent';
import type { CreateIntegrationData, CreateWebhookData, PostbackTestResult, IntegrationRepository as IIntegrationRepository } from '../services/IntegrationService';
import { ApiClient } from './ApiClient';

interface IntegrationDto {
  id: string; clientId: string; provider: IntegrationProvider; appName: string;
  apiKey: string; appId?: string; connected: boolean; connectedAt?: string;
}
interface WebhookDto {
  id: string; clientId: string; url: string; events: WebhookEvent[];
  active: boolean; secret?: string; createdAt: string;
}

export function mapDtoToIntegration(dto: IntegrationDto): IntegrationConfig {
  return new IntegrationConfig(
    dto.id, dto.clientId, dto.provider, dto.appName, dto.apiKey, dto.appId,
    dto.connected, dto.connectedAt ? new Date(dto.connectedAt) : undefined,
  );
}

export function mapDtoToWebhook(dto: WebhookDto): WebhookConfig {
  return new WebhookConfig(
    dto.id, dto.clientId, dto.url, dto.events, dto.active, dto.secret, new Date(dto.createdAt),
  );
}

export class IntegrationRepository implements IIntegrationRepository {
  constructor(private readonly api: ApiClient) {}

  async findIntegrations(clientId: string): Promise<IntegrationConfig[]> {
    const dtos = await this.api.get<IntegrationDto[]>(`/api/integrations?clientId=${encodeURIComponent(clientId)}`);
    return dtos.map(mapDtoToIntegration);
  }

  async createIntegration(data: CreateIntegrationData): Promise<IntegrationConfig> {
    const dto = await this.api.post<IntegrationDto>('/api/integrations', data);
    return mapDtoToIntegration(dto);
  }

  async deleteIntegration(id: string): Promise<void> {
    await this.api.delete<void>(`/api/integrations/${encodeURIComponent(id)}`);
  }

  async findWebhooks(clientId: string): Promise<WebhookConfig[]> {
    const dtos = await this.api.get<WebhookDto[]>(`/api/integrations/webhooks?clientId=${encodeURIComponent(clientId)}`);
    return dtos.map(mapDtoToWebhook);
  }

  async createWebhook(data: CreateWebhookData): Promise<WebhookConfig> {
    const dto = await this.api.post<WebhookDto>('/api/integrations/webhooks', data);
    return mapDtoToWebhook(dto);
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.api.delete<void>(`/api/integrations/webhooks/${encodeURIComponent(id)}`);
  }

  async testPostback(url: string, eventType: string): Promise<PostbackTestResult> {
    const dto = await this.api.post<PostbackTestResult>('/api/integrations/test-postback', { url, eventType });
    return dto;
  }
}