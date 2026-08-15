/**
 * PlatformSettingsService.ts — services/
 *
 * Orchestrates platform-wide configuration. This is the service that
 * ApprovalService.isOverdue() reads SLA thresholds from (replacing the
 * hardcoded `4` from Part 5), and that New Registrations reads the
 * default base margin from.
 *
 * SLA retrofit note:
 *   Part 5's ApprovalService.isOverdue() had a hardcoded `slaThresholdHours`
 *   parameter that callers passed as `4`. Part 12 retrofits this so
 *   isOverdue() reads the SLA threshold from PlatformSettingsService
 *   based on the item type (campaign or creative), not a hardcoded
 *   constant. The method signature is preserved for backward compatibility
 *   but the caller now passes the configured value.
 */
import type { PlatformSettings } from '../core/entities/PlatformSettings';
import type { NotificationTemplate } from '../core/entities/PlatformSettings';

export interface PlatformSettingsRepository {
  getSettings(): Promise<PlatformSettings>;
  saveSettings(settings: PlatformSettings): Promise<void>;
}

export class PlatformSettingsService {
  private cachedSettings: PlatformSettings | null = null;

  constructor(private readonly settingsRepo: PlatformSettingsRepository) {}

  async getSettings(): Promise<PlatformSettings> {
    if (!this.cachedSettings) {
      this.cachedSettings = await this.settingsRepo.getSettings();
    }
    return this.cachedSettings;
  }

  async getDefaultBaseMargin(): Promise<number> {
    const settings = await this.getSettings();
    return settings.defaultBaseMargin;
  }

  /**
   * Returns the SLA threshold in hours for the given item type.
   * Campaigns and creatives have separate configurable thresholds.
   * This replaces the hardcoded `4` from Part 5.
   */
  async getSlaThreshold(itemType: 'campaign' | 'creative'): Promise<number> {
    const settings = await this.getSettings();
    return itemType === 'campaign' ? settings.campaignSlaHours : settings.creativeSlaHours;
  }

  async getDefaultLowBalanceThreshold(): Promise<number> {
    const settings = await this.getSettings();
    return settings.defaultLowBalanceThreshold;
  }

  async getSupportEmail(): Promise<string> {
    const settings = await this.getSettings();
    return settings.supportEmail;
  }

  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const settings = await this.getSettings();
    return settings.notificationTemplates;
  }

  async updateDefaultBaseMargin(value: number): Promise<void> {
    const settings = await this.getSettings();
    settings.updateDefaultBaseMargin(value);
    await this.settingsRepo.saveSettings(settings);
  }

  async updateSlaThresholds(campaignHours: number, creativeHours: number): Promise<void> {
    const settings = await this.getSettings();
    settings.updateSlaThresholds(campaignHours, creativeHours);
    await this.settingsRepo.saveSettings(settings);
  }

  async updateLowBalanceThreshold(value: number): Promise<void> {
    const settings = await this.getSettings();
    settings.updateLowBalanceThreshold(value);
    await this.settingsRepo.saveSettings(settings);
  }

  async updateSupportEmail(value: string): Promise<void> {
    const settings = await this.getSettings();
    settings.updateSupportEmail(value);
    await this.settingsRepo.saveSettings(settings);
  }

  async updateNotificationTemplate(key: string, template: string): Promise<void> {
    const settings = await this.getSettings();
    settings.updateNotificationTemplate(key, template);
    await this.settingsRepo.saveSettings(settings);
  }
}