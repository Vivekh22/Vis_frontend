/**
 * PlatformSettings.ts — core/entities/
 *
 * Platform-wide configuration owned exclusively by Super Admin.
 *
 * - defaultBaseMargin: pre-fills New Registrations' base margin input
 * - campaignSlaHours / creativeSlaHours: SLA thresholds read by
 *   ApprovalService.isOverdue() — these are CONFIGURATION, not hardcoded
 *   constants. The retrofit in Part 12 replaces the hardcoded `4` in
 *   Part 5's ApprovalService.isOverdue() with these values.
 * - defaultLowBalanceThreshold: pre-fills client fund settings
 * - supportEmail: shown in client support pages
 * - notificationTemplates: editable text behind auto-generated suggestion
 *   notifications (text-template editor, not a full rules engine)
 */
export interface NotificationTemplate {
  key: string;
  label: string;
  template: string;
}

export class PlatformSettings {
  constructor(
    private _defaultBaseMargin: number,
    private _campaignSlaHours: number,
    private _creativeSlaHours: number,
    private _defaultLowBalanceThreshold: number,
    private _supportEmail: string,
    private _notificationTemplates: NotificationTemplate[] = [],
  ) {}

  public get defaultBaseMargin(): number {
    return this._defaultBaseMargin;
  }

  public get campaignSlaHours(): number {
    return this._campaignSlaHours;
  }

  public get creativeSlaHours(): number {
    return this._creativeSlaHours;
  }

  public get defaultLowBalanceThreshold(): number {
    return this._defaultLowBalanceThreshold;
  }

  public get supportEmail(): string {
    return this._supportEmail;
  }

  public get notificationTemplates(): NotificationTemplate[] {
    return [...this._notificationTemplates];
  }

  public updateDefaultBaseMargin(value: number): void {
    this._defaultBaseMargin = value;
  }

  public updateSlaThresholds(campaignHours: number, creativeHours: number): void {
    this._campaignSlaHours = campaignHours;
    this._creativeSlaHours = creativeHours;
  }

  public updateLowBalanceThreshold(value: number): void {
    this._defaultLowBalanceThreshold = value;
  }

  public updateSupportEmail(value: string): void {
    this._supportEmail = value;
  }

  public updateNotificationTemplate(key: string, template: string): void {
    const existing = this._notificationTemplates.find((t) => t.key === key);
    if (existing) {
      existing.template = template;
    }
  }
}