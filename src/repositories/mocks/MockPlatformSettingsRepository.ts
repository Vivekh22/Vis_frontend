/**
 * MockPlatformSettingsRepository.ts — repositories/mocks/
 *
 * In-memory mock for PlatformSettingsService. Seeds default platform
 * configuration including the SLA thresholds that ApprovalService.
 * isOverdue() reads.
 *
 * SLA values: campaign=4h, creative=4h (matching Part 5's hardcoded
 * value, but now configurable rather than constant).
 */
import { PlatformSettings } from '../../core/entities/PlatformSettings';

export class MockPlatformSettingsRepository {
  private settings: PlatformSettings;

  constructor() {
    this.settings = new PlatformSettings(
      15, // defaultBaseMargin: 15%
      4,  // campaignSlaHours
      4,  // creativeSlaHours
      500, // defaultLowBalanceThreshold: $5.00
      'support@visprisca.ads',
      [
        { key: 'low_balance', label: 'Low Balance Alert', template: 'Your account balance is below the threshold. Please add funds to avoid campaign interruptions.' },
        { key: 'campaign_approved', label: 'Campaign Approved', template: 'Your campaign "{{campaign_name}}" has been approved and is now live.' },
        { key: 'campaign_rejected', label: 'Campaign Rejected', template: 'Your campaign "{{campaign_name}}" requires changes. Please review the feedback and resubmit.' },
        { key: 'invoice_ready', label: 'Invoice Ready', template: 'Your invoice for {{period}} is now available for download.' },
      ],
    );
  }

  async getSettings(): Promise<PlatformSettings> {
    return this.settings;
  }

  async saveSettings(settings: PlatformSettings): Promise<void> {
    this.settings = settings;
  }
}