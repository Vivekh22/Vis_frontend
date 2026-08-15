/**
 * SettingsRepository.ts — repositories/
 *
 * Real implementation of SettingsRepository.
 *
 * !!! DEACTIVATION REQUEST, NOT SELF-EXECUTION !!!
 * submitDeactivationRequest() POSTs to /api/settings/deactivation-request.
 * There is no deleteAccount() endpoint — the account is never deleted
 * from this repository.
 */
import type {
  UserProfile, RegionalSettings, NotificationSettings, ActiveSession,
  LoginHistoryEntry, DeactivationRequest,
  SettingsRepository as ISettingsRepository,
} from '../services/SettingsService';
import { ApiClient } from './ApiClient';

interface UserProfileDto {
  fullName: string; email: string; phone: string; avatarUrl?: string; twoFactorEnabled: boolean;
}
interface RegionalSettingsDto { timezone: string; currency: string; dateFormat: string; }
interface NotificationSettingsDto {
  emailNotifications: boolean; inAppNotifications: boolean;
  digestEnabled: boolean; perTypeToggles: Record<string, boolean>;
}
interface ActiveSessionDto {
  id: string; device: string; location: string; ipAddress: string;
  lastActiveAt: string; isCurrent: boolean; isImpersonation: boolean; actingAsRole?: string;
}
interface LoginHistoryDto {
  id: string; timestamp: string; ipAddress: string; device: string; location: string; success: boolean;
}

export class SettingsRepository implements ISettingsRepository {
  constructor(private readonly api: ApiClient) {}

  async getProfile(clientId: string): Promise<UserProfile> {
    return await this.api.get<UserProfileDto>(`/api/settings/${encodeURIComponent(clientId)}/profile`);
  }

  async updateProfile(clientId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return await this.api.put<UserProfileDto>(`/api/settings/${encodeURIComponent(clientId)}/profile`, data);
  }

  async getRegionalSettings(clientId: string): Promise<RegionalSettings> {
    return await this.api.get<RegionalSettingsDto>(`/api/settings/${encodeURIComponent(clientId)}/regional`);
  }

  async updateRegionalSettings(clientId: string, settings: RegionalSettings): Promise<RegionalSettings> {
    return await this.api.put<RegionalSettingsDto>(`/api/settings/${encodeURIComponent(clientId)}/regional`, settings);
  }

  async getNotificationSettings(clientId: string): Promise<NotificationSettings> {
    return await this.api.get<NotificationSettingsDto>(`/api/settings/${encodeURIComponent(clientId)}/notifications`);
  }

  async updateNotificationSettings(clientId: string, settings: NotificationSettings): Promise<NotificationSettings> {
    return await this.api.put<NotificationSettingsDto>(`/api/settings/${encodeURIComponent(clientId)}/notifications`, settings);
  }

  async getActiveSessions(clientId: string): Promise<ActiveSession[]> {
    const dtos = await this.api.get<ActiveSessionDto[]>(`/api/settings/${encodeURIComponent(clientId)}/sessions`);
    return dtos.map((d) => ({ ...d, lastActiveAt: new Date(d.lastActiveAt) }));
  }

  async terminateSession(sessionId: string): Promise<void> {
    await this.api.delete<void>(`/api/settings/sessions/${encodeURIComponent(sessionId)}`);
  }

  async getLoginHistory(clientId: string): Promise<LoginHistoryEntry[]> {
    const dtos = await this.api.get<LoginHistoryDto[]>(`/api/settings/${encodeURIComponent(clientId)}/login-history`);
    return dtos.map((d) => ({ ...d, timestamp: new Date(d.timestamp) }));
  }

  async submitDeactivationRequest(request: DeactivationRequest): Promise<void> {
    await this.api.post<void>('/api/settings/deactivation-request', request);
  }
}