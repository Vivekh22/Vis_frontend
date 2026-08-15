/**
 * MockIntegrationRepository.ts — repositories/mocks/
 *
 * In-memory mock for IntegrationService.
 */
import { IntegrationConfig } from '../../core/entities/IntegrationConfig';
import { WebhookConfig } from '../../core/entities/WebhookConfig';
import { IntegrationProvider } from '../../core/enums/IntegrationProvider';
import { WebhookEvent } from '../../core/enums/WebhookEvent';
import type { CreateIntegrationData, CreateWebhookData, PostbackTestResult, IntegrationRepository } from '../../services/IntegrationService';

export class MockIntegrationRepository implements IntegrationRepository {
  private readonly integrations: IntegrationConfig[] = [];
  private readonly webhooks: WebhookConfig[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    this.integrations.push(new IntegrationConfig('int_001', 'client-1', IntegrationProvider.AppsFlyer, 'MyApp Pro', 'af_key_***', 'com.example.myapp', true, new Date(Date.now() - 60 * 86400000)));
    this.webhooks.push(new WebhookConfig('wh_001', 'client-1', 'https://example.com/webhooks/visprisca', [WebhookEvent.CampaignApproved, WebhookEvent.FundCredited], true, 'whsec_***', new Date(Date.now() - 30 * 86400000)));
  }

  async findIntegrations(clientId: string): Promise<IntegrationConfig[]> {
    return this.integrations.filter((i) => i.clientId === clientId);
  }

  async createIntegration(data: CreateIntegrationData): Promise<IntegrationConfig> {
    const config = new IntegrationConfig(`int_${Date.now().toString(36)}`, data.clientId, data.provider as never, data.appName, data.apiKey, data.appId, true, new Date());
    this.integrations.push(config);
    return config;
  }

  async deleteIntegration(id: string): Promise<void> {
    const idx = this.integrations.findIndex((i) => i.id === id);
    if (idx >= 0) this.integrations.splice(idx, 1);
  }

  async findWebhooks(clientId: string): Promise<WebhookConfig[]> {
    return this.webhooks.filter((w) => w.clientId === clientId);
  }

  async createWebhook(data: CreateWebhookData): Promise<WebhookConfig> {
    const config = new WebhookConfig(`wh_${Date.now().toString(36)}`, data.clientId, data.url, data.events, true, undefined, new Date());
    this.webhooks.push(config);
    return config;
  }

  async deleteWebhook(id: string): Promise<void> {
    const idx = this.webhooks.findIndex((w) => w.id === id);
    if (idx >= 0) this.webhooks.splice(idx, 1);
  }

  async testPostback(url: string, eventType: string): Promise<PostbackTestResult> {
    // Mock: simulate a successful postback test if URL is valid
    if (!url || !url.startsWith('http')) {
      return { success: false, message: 'Invalid URL format' };
    }
    return { success: true, message: `Postback test sent for event: ${eventType}` };
  }
}