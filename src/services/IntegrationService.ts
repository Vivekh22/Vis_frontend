/**
 * IntegrationService.ts — services/
 *
 * Orchestrates MMP integration connections, postback/S2S testing, and
 * webhook management.
 */
import type { IntegrationConfig } from '../core/entities/IntegrationConfig';
import type { WebhookConfig } from '../core/entities/WebhookConfig';
import type { WebhookEvent } from '../core/enums/WebhookEvent';

export interface CreateIntegrationData {
  clientId: string;
  provider: string;
  appName: string;
  apiKey: string;
  appId?: string;
}

export interface CreateWebhookData {
  clientId: string;
  url: string;
  events: WebhookEvent[];
}

export interface PostbackTestResult {
  success: boolean;
  message: string;
}

export interface IntegrationRepository {
  findIntegrations(clientId: string): Promise<IntegrationConfig[]>;
  createIntegration(data: CreateIntegrationData): Promise<IntegrationConfig>;
  deleteIntegration(id: string): Promise<void>;
  findWebhooks(clientId: string): Promise<WebhookConfig[]>;
  createWebhook(data: CreateWebhookData): Promise<WebhookConfig>;
  deleteWebhook(id: string): Promise<void>;
  testPostback(url: string, eventType: string): Promise<PostbackTestResult>;
}

export class IntegrationService {
  constructor(private readonly integrationRepo: IntegrationRepository) {}

  async listIntegrations(clientId: string): Promise<IntegrationConfig[]> {
    return await this.integrationRepo.findIntegrations(clientId);
  }

  async connectIntegration(data: CreateIntegrationData): Promise<IntegrationConfig> {
    return await this.integrationRepo.createIntegration(data);
  }

  async disconnectIntegration(id: string): Promise<void> {
    await this.integrationRepo.deleteIntegration(id);
  }

  async listWebhooks(clientId: string): Promise<WebhookConfig[]> {
    return await this.integrationRepo.findWebhooks(clientId);
  }

  async createWebhook(data: CreateWebhookData): Promise<WebhookConfig> {
    return await this.integrationRepo.createWebhook(data);
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.integrationRepo.deleteWebhook(id);
  }

  async testPostback(url: string, eventType: string): Promise<PostbackTestResult> {
    return await this.integrationRepo.testPostback(url, eventType);
  }
}