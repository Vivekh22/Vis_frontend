/**
 * SettingsService.ts — services/
 *
 * Orchestrates user profile, regional settings, notification preferences,
 * active sessions, login history, and account deactivation requests.
 *
 * !!! DEACTIVATE ACCOUNT — REQUEST, NOT SELF-EXECUTION !!!
 *
 * requestDeactivation() submits a DEACTIVATION REQUEST for admin/super-admin
 * review. It does NOT delete the account. There is no deleteAccount() method
 * — by design. The button in the Settings UI calls requestDeactivation(),
 * which routes to Admin/Super Admin for review. The account remains active
 * until an admin approves the request.
 *
 * !!! IMPERSONATION SESSION DISPLAY !!!
 *
 * getActiveSessions() connects to SessionStore to surface any active
 * Super Admin impersonation session, per the spec's cross-reference. An
 * impersonation session appears in the Active Sessions list with its
 * true acting identity.
 */
import { sessionStore } from '../platform/state/SessionStore';

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
}

export interface RegionalSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  digestEnabled: boolean;
  perTypeToggles: Readonly<Record<string, boolean>>;
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActiveAt: Date;
  isCurrent: boolean;
  isImpersonation: boolean;
  actingAsRole?: string;
}

export interface LoginHistoryEntry {
  id: string;
  timestamp: Date;
  ipAddress: string;
  device: string;
  location: string;
  success: boolean;
}

export interface DeactivationRequest {
  clientId: string;
  reason: string;
  requestedAt: Date;
}

export interface SettingsRepository {
  getProfile(clientId: string): Promise<UserProfile>;
  updateProfile(clientId: string, data: Partial<UserProfile>): Promise<UserProfile>;
  getRegionalSettings(clientId: string): Promise<RegionalSettings>;
  updateRegionalSettings(clientId: string, settings: RegionalSettings): Promise<RegionalSettings>;
  getNotificationSettings(clientId: string): Promise<NotificationSettings>;
  updateNotificationSettings(clientId: string, settings: NotificationSettings): Promise<NotificationSettings>;
  getActiveSessions(clientId: string): Promise<ActiveSession[]>;
  terminateSession(sessionId: string): Promise<void>;
  getLoginHistory(clientId: string): Promise<LoginHistoryEntry[]>;
  submitDeactivationRequest(request: DeactivationRequest): Promise<void>;
}

export class SettingsService {
  constructor(private readonly settingsRepo: SettingsRepository) {}

  async getProfile(clientId: string): Promise<UserProfile> {
    return await this.settingsRepo.getProfile(clientId);
  }

  async updateProfile(clientId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return await this.settingsRepo.updateProfile(clientId, data);
  }

  async getRegionalSettings(clientId: string): Promise<RegionalSettings> {
    return await this.settingsRepo.getRegionalSettings(clientId);
  }

  async updateRegionalSettings(clientId: string, settings: RegionalSettings): Promise<RegionalSettings> {
    return await this.settingsRepo.updateRegionalSettings(clientId, settings);
  }

  async getNotificationSettings(clientId: string): Promise<NotificationSettings> {
    return await this.settingsRepo.getNotificationSettings(clientId);
  }

  async updateNotificationSettings(clientId: string, settings: NotificationSettings): Promise<NotificationSettings> {
    return await this.settingsRepo.updateNotificationSettings(clientId, settings);
  }

  /**
   * Returns active sessions, including any impersonation session from
   * SessionStore. An active Super Admin impersonation session appears
   * here per the spec's cross-reference.
   */
  async getActiveSessions(clientId: string): Promise<ActiveSession[]> {
    const sessions = await this.settingsRepo.getActiveSessions(clientId);
    const sessionState = sessionStore.getState();
    if (sessionState.isImpersonating && sessionState.actingAsRole) {
      sessions.push({
        id: 'impersonation-session',
        device: 'Super Admin Console',
        location: '—',
        ipAddress: '—',
        lastActiveAt: sessionState.sessionStartedAt ?? new Date(),
        isCurrent: false,
        isImpersonation: true,
        actingAsRole: sessionState.actingAsRole,
      });
    }
    return sessions;
  }

  async terminateSession(sessionId: string): Promise<void> {
    await this.settingsRepo.terminateSession(sessionId);
  }

  async getLoginHistory(clientId: string): Promise<LoginHistoryEntry[]> {
    return await this.settingsRepo.getLoginHistory(clientId);
  }

  /**
   * Submits a DEACTIVATION REQUEST for admin/super-admin review.
   * Does NOT delete the account — the account remains active until
   * an admin approves the request.
   */
  async requestDeactivation(clientId: string, reason: string): Promise<void> {
    await this.settingsRepo.submitDeactivationRequest({
      clientId,
      reason,
      requestedAt: new Date(),
    });
  }
}