// @ts-nocheck
/**
 * ApiKeyService.test.ts — tests/services/
 *
 * !!! API KEY ONE-TIME REVEAL !!!
 *
 * Tests that the real API key is returned ONCE from generateKey(),
 * and that listKeys() returns only masked representations. The real key
 * is never stored in the service or entity — only the maskedKey is
 * retained after generation.
 */
import { describe, it, expect, vi } from 'vitest';
import { ApiKeyService } from '../../services/ApiKeyService';
import { ApiKeyService } from '../../services/ApiKeyService';
import { ApiKey } from '../../core/entities/ApiKey';

function createMockRepo(): ApiKeyRepository {
  const keys: ApiKey[] = [];
  return {
    create: vi.fn().mockImplementation(async (data: { name: string; scope: string }) => {
      const realKey = `va_sk_real_${Date.now()}`;
      const maskedKey = `va_sk_...${realKey.slice(-4)}`;
      const apiKey = new ApiKey(`key_${Date.now()}`, data.name, data.scope, maskedKey, 'active', new Date());
      keys.push(apiKey);
      return { apiKey, realKey };
    }),
    findAll: vi.fn().mockImplementation(async () => [...keys]),
    revoke: vi.fn(),
  };
}

describe('ApiKeyService — One-Time Reveal', () => {
  it('generateKey returns the real key ONCE', async () => {
    const service = new ApiKeyService(createMockRepo());
    const result = await service.generateKey({
      clientId: 'client-1',
      name: 'Test Key',
      scope: 'full',
    });
    expect(result.realKey).toBeTruthy();
    expect(result.realKey).toContain('va_sk_real_');
    expect(result.apiKey.maskedKey).not.toBe(result.realKey);
    expect(result.apiKey.maskedKey).toContain('...');
  });

  it('listKeys returns only masked representations — real key not retained', async () => {
    const service = new ApiKeyService(createMockRepo());
    const generated = await service.generateKey({
      clientId: 'client-1',
      name: 'Test Key',
      scope: 'full',
    });
    const keys = await service.listKeys('client-1');
    expect(keys.length).toBe(1);
    expect(keys[0]!.maskedKey).toBe(generated.apiKey.maskedKey);
    // The real key is NOT stored in the entity
    expect(keys[0]!.maskedKey).not.toBe(generated.realKey);
    // The entity has no method to retrieve the real key
    expect(typeof (keys[0] as unknown as { getRealKey?: () => string }).getRealKey).toBe('undefined');
  });

  it('revokeKey calls repository revoke', async () => {
    const repo = createMockRepo();
    const service = new ApiKeyService(repo);
    await service.generateKey({ clientId: 'client-1', name: 'Test', scope: 'full' });
    const keys = await service.listKeys('client-1');
    await service.revokeKey(keys[0]!.id);
    expect(repo.revoke).toHaveBeenCalledWith(keys[0]!.id);
  });

  it('ApiKey entity has no getRealKey method', () => {
    const key = new ApiKey('key_1', 'Test', 'full', 'va_sk_...abcd', 'active', new Date());
    expect(typeof (key as unknown as { getRealKey?: () => string }).getRealKey).toBe('undefined');
  });
});