/**
 * MockSettingsRepository.ts — repositories/mocks/
 *
 * In-memory mock for SettingsService.
 *
 * !!! DEACTIVATION REQUEST, NOT SELF-EXECUTION !!!
 * submitDeactivationRequest() stores a request — it does NOT delete the
 * account. There is no deleteAccount() method in this mock.
 */
import type {
  UserProfile,
  RegionalSettings,
  NotificationSettings,
  ActiveSession,
  LoginHistoryEntry,
  DeactivationRequest,
  SettingsRepository,
} from '../../services/SettingsService';

export class MockSettingsRepository implements SettingsRepository {
  private readonly profiles: Map<string, UserProfile> = new Map();
  private readonly regionalSettings: Map<string, RegionalSettings> = new Map();
  private readonly notificationSettings: Map<string, NotificationSettings> = new Map();
  private readonly sessions: Map<string, ActiveSession[]> = new Map();
  private readonly loginHistory: Map<string, LoginHistoryEntry[]> = new Map();
  private readonly deactivationRequests: DeactivationRequest[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    this.profiles.set('client-1', {
      fullName: 'Client User',
      email: 'client@visprisca.ads',
      phone: '+1-555-0100',
      twoFactorEnabled: false,
    });
    this.regionalSettings.set('client-1', {
      timezone: 'Asia/Calcutta',
      currency: 'USD',
      dateFormat: 'DD/MM/YYYY',
    });
    this.notificationSettings.set('client-1', {
      emailNotifications: true,
      inAppNotifications: true,
      digestEnabled: false,
      perTypeToggles: { security: true, campaign: true, billing: true, team: true, integrations: true, support: true, platform: true },
    });
    this.sessions.set('client-1', [
      { id: 'sess_001', device: 'Chrome on Windows', location: 'Mumbai, IN', ipAddress: '203.0.113.1', lastActiveAt: new Date(), isCurrent: true, isImpersonation: false },
      { id: 'sess_002', device: 'Safari on iPhone', location: 'Mumbai, IN', ipAddress: '203.0.113.2', lastActiveAt: new Date(Date.now() - 86400000), isCurrent: false, isImpersonation: false },
    ]);
    this.loginHistory.set('client-1', [
      { id: 'lh_001', timestamp: new Date(), ipAddress: '203.0.113.1', device: 'Chrome on Windows', location: 'Mumbai, IN', success: true },
      { id: 'lh_002', timestamp: new Date(Date.now() - 86400000), ipAddress: '203.0.113.3', device: 'Unknown', location: 'Unknown', success: false },
    ]);
  }

  async getProfile(clientId: string): Promise<UserProfile> {
    return this.profiles.get(clientId) ?? { fullName: '', email: '', phone: '', twoFactorEnabled: false };
  }

  async updateProfile(clientId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile(clientId);
    const updated = { ...current, ...data };
    this.profiles.set(clientId, updated);
    return updated;
  }

  async getRegionalSettings(clientId: string): Promise<RegionalSettings> {
    return this.regionalSettings.get(clientId) ?? { timezone: 'UTC', currency: 'USD', dateFormat: 'DD/MM/YYYY' };
  }

  async updateRegionalSettings(clientId: string, settings: RegionalSettings): Promise<RegionalSettings> {
    this.regionalSettings.set(clientId, settings);
    return settings;
  }

  async getNotificationSettings(clientId: string): Promise<NotificationSettings> {
    return this.notificationSettings.get(clientId) ?? { emailNotifications: true, inAppNotifications: true, digestEnabled: false, perTypeToggles: {} };
  }

  async updateNotificationSettings(clientId: string, settings: NotificationSettings): Promise<NotificationSettings> {
    this.notificationSettings.set(clientId, settings);
    return settings;
  }

  async getActiveSessions(clientId: string): Promise<ActiveSession[]> {
    return this.sessions.get(clientId) ?? [];
  }

  async terminateSession(sessionId: string): Promise<void> {
    for (const [clientId, sessions] of this.sessions) {
      this.sessions.set(clientId, sessions.filter((s) => s.id !== sessionId));
    }
  }

  async getLoginHistory(clientId: string): Promise<LoginHistoryEntry[]> {
    return this.loginHistory.get(clientId) ?? [];
  }

  async submitDeactivationRequest(request: DeactivationRequest): Promise<void> {
    this.deactivationRequests.push(request);
  }

  getDeactivationRequests(): DeactivationRequest[] {
    return [...this.deactivationRequests];
  }
}