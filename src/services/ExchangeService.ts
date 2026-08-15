/**
 * ExchangeService.ts — services/
 *
 * Per-client exchange (SSP) allow/block management. Each exchange
 * can be Allowed or Blocked per client, with an optional per-campaign-
 * type override.
 *
 * !!! NEVER DELEGABLE !!!
 * Exchange management is a Super Admin-only control. No PermissionGrant
 * can delegate exchange management to Admins. The Role & Permission
 * Builder's grid has this row permanently greyed out.
 */
import { ExchangeConfig, type ExchangeStatus } from '../core/entities/ExchangeConfig';

export interface ExchangeRepository {
  getClientExchanges(clientId: string): Promise<ExchangeConfig[]>;
  setExchangeStatus(clientId: string, exchangeName: string, status: ExchangeStatus): Promise<void>;
  setExchangeOverride(clientId: string, exchangeName: string, campaignType: string, status: ExchangeStatus): Promise<void>;
  bulkSetStatus(clientId: string, status: ExchangeStatus): Promise<void>;
  getAvailableExchanges(): Promise<string[]>;
}

export class ExchangeService {
  constructor(private readonly exchangeRepo: ExchangeRepository) {}

  async getClientExchanges(clientId: string): Promise<ExchangeConfig[]> {
    return this.exchangeRepo.getClientExchanges(clientId);
  }

  async getAvailableExchanges(): Promise<string[]> {
    return this.exchangeRepo.getAvailableExchanges();
  }

  async setExchangeStatus(clientId: string, exchangeName: string, status: ExchangeStatus): Promise<void> {
    await this.exchangeRepo.setExchangeStatus(clientId, exchangeName, status);
  }

  async setExchangeOverride(clientId: string, exchangeName: string, campaignType: string, status: ExchangeStatus): Promise<void> {
    await this.exchangeRepo.setExchangeOverride(clientId, exchangeName, campaignType, status);
  }

  async bulkAllowAll(clientId: string): Promise<void> {
    await this.exchangeRepo.bulkSetStatus(clientId, 'allowed');
  }

  async bulkBlockAll(clientId: string): Promise<void> {
    await this.exchangeRepo.bulkSetStatus(clientId, 'blocked');
  }
}