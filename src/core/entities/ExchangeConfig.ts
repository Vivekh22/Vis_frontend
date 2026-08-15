/**
 * ExchangeConfig.ts — core/entities/
 *
 * Per-client exchange (SSP) allow/block configuration. Each exchange
 * can be Allowed or Blocked per client, with an optional per-campaign-
 * type override.
 *
 * Exchange data comes from the Connected Exchanges/SSPs list (Part 13).
 * For now, a mock exchange list is used if that page doesn't exist yet.
 */
export type ExchangeStatus = 'allowed' | 'blocked';

export interface CampaignTypeOverride {
  campaignType: string;
  status: ExchangeStatus;
}

export class ExchangeConfig {
  constructor(
    public readonly clientId: string,
    public readonly exchangeName: string,
    private _status: ExchangeStatus,
    private _overrides: CampaignTypeOverride[] = [],
  ) {}

  public get status(): ExchangeStatus {
    return this._status;
  }

  public get overrides(): CampaignTypeOverride[] {
    return [...this._overrides];
  }

  public setStatus(status: ExchangeStatus): void {
    this._status = status;
  }

  public setOverride(campaignType: string, status: ExchangeStatus): void {
    const existing = this._overrides.find((o) => o.campaignType === campaignType);
    if (existing) {
      existing.status = status;
    } else {
      this._overrides.push({ campaignType, status });
    }
  }

  public getOverrideStatus(campaignType: string): ExchangeStatus | null {
    return this._overrides.find((o) => o.campaignType === campaignType)?.status ?? null;
  }
}