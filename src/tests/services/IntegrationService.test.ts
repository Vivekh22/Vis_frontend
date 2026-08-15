/**
 * IntegrationService.test.ts — tests/services/
 */
import { describe, it, expect, vi } from 'vitest';
import { IntegrationService } from '../../services/IntegrationService';
import type { IntegrationRepository } from '../../services/IntegrationService';

function createMockRepo(): IntegrationRepository {
  return {
    findIntegrations: vi.fn().mockResolvedValue([]),
    createIntegration: vi.fn().mockResolvedValue({}),
    deleteIntegration: vi.fn(),
    findWebhooks: vi.fn().mockResolvedValue([]),
    createWebhook: vi.fn().mockResolvedValue({}),
    deleteWebhook: vi.fn(),
    testPostback: vi.fn().mockResolvedValue({ success: true, message: 'OK' }),
  };
}

describe('IntegrationService', () => {
  it('listIntegrations returns from repository', async () => {
    const service = new IntegrationService(createMockRepo());
    const result = await service.listIntegrations('client-1');
    expect(result).toEqual([]);
  });

  it('testPostback returns result from repository', async () => {
    const service = new IntegrationService(createMockRepo());
    const result = await service.testPostback('https://example.com/pb', 'install');
    expect(result.success).toBe(true);
  });

  it('createWebhook calls repository createWebhook', async () => {
    const repo = createMockRepo();
    const service = new IntegrationService(repo);
    await service.createWebhook({ clientId: 'client-1', url: 'https://example.com/wh', events: ['campaign.approved'] as never });
    expect(repo.createWebhook).toHaveBeenCalledTimes(1);
  });
});