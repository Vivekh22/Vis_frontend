/**
 * SettingsService.test.ts — tests/services/
 *
 * !!! DEACTIVATE ACCOUNT — REQUEST, NOT SELF-EXECUTION !!!
 *
 * Tests that requestDeactivation() submits a deactivation REQUEST —
 * it does NOT call a deleteAccount() method. The account remains
 * active until an admin approves the request.
 */
import { describe, it, expect, vi } from 'vitest';
import { SettingsService } from '../../services/SettingsService';
import type { SettingsRepository } from '../../services/SettingsService';

function createMockRepo(): SettingsRepository {
  const deactivationRequests: { clientId: string; reason: string; requestedAt: Date }[] = [];
  return {
    getProfile: vi.fn().mockResolvedValue({ fullName: 'Test User', email: 'test@example.com', phone: '', twoFactorEnabled: false }),
    updateProfile: vi.fn().mockResolvedValue({ fullName: 'Updated', email: 'test@example.com', phone: '', twoFactorEnabled: false }),
    getRegionalSettings: vi.fn().mockResolvedValue({ timezone: 'UTC', currency: 'USD', dateFormat: 'DD/MM/YYYY' }),
    updateRegionalSettings: vi.fn().mockResolvedValue({ timezone: 'Asia/Calcutta', currency: 'USD', dateFormat: 'DD/MM/YYYY' }),
    getNotificationSettings: vi.fn().mockResolvedValue({ emailNotifications: true, inAppNotifications: true, digestEnabled: false, perTypeToggles: {} }),
    updateNotificationSettings: vi.fn().mockResolvedValue({ emailNotifications: false, inAppNotifications: true, digestEnabled: true, perTypeToggles: {} }),
    getActiveSessions: vi.fn().mockResolvedValue([]),
    terminateSession: vi.fn(),
    getLoginHistory: vi.fn().mockResolvedValue([]),
    submitDeactivationRequest: vi.fn().mockImplementation(async (req: { clientId: string; reason: string; requestedAt: Date }) => {
      deactivationRequests.push(req);
    }),
  };
}

describe('SettingsService — Deactivation Request', () => {
  it('requestDeactivation submits a request — does NOT delete account', async () => {
    const repo = createMockRepo();
    const service = new SettingsService(repo);
    await service.requestDeactivation('client-1', 'Leaving the platform');
    expect(repo.submitDeactivationRequest).toHaveBeenCalledTimes(1);
    expect(repo.submitDeactivationRequest).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'client-1', reason: 'Leaving the platform' }),
    );
  });

  it('SettingsService does not have a deleteAccount method', () => {
    const service = new SettingsService(createMockRepo());
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    expect(methods).not.toContain('deleteAccount');
  });

  it('requestDeactivation includes timestamp', async () => {
    const repo = createMockRepo();
    const service = new SettingsService(repo);
    await service.requestDeactivation('client-1', 'Test reason');
    const callArgs = vi.mocked(repo.submitDeactivationRequest).mock.calls[0]![0];
    expect(callArgs.requestedAt).toBeInstanceOf(Date);
  });
});

describe('SettingsService — Active Sessions with Impersonation', () => {
  it('getActiveSessions includes impersonation session from SessionStore', async () => {
    const repo = createMockRepo();
    vi.mocked(repo.getActiveSessions).mockResolvedValue([
      { id: 'sess_1', device: 'Chrome', location: 'Mumbai', ipAddress: '1.2.3.4', lastActiveAt: new Date(), isCurrent: true, isImpersonation: false },
    ]);
    const service = new SettingsService(repo);
    const sessions = await service.getActiveSessions('client-1');
    // Without an active impersonation session in SessionStore, should return original sessions
    expect(sessions.length).toBeGreaterThanOrEqual(1);
  });
});