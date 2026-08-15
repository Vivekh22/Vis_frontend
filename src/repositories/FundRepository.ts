/**
 * FundRepository.ts — repositories/
 *
 * Real implementation of the FundRepository interface from FundService.
 * Calls the fund API endpoints and maps DTOs to domain entities/value objects.
 *
 * Assumed endpoint shape (de facto API contract):
 *   GET  /api/funds/:clientId/balance
 *     Response: { amountMinorUnits: number, currency: string }
 *   POST /api/funds/:clientId/transactions
 *     Body: FundTransactionDto
 *     Response: FundTransactionDto
 *   GET  /api/funds/:clientId/transactions?type=
 *     Response: FundTransactionDto[]
 *   PUT  /api/funds/:clientId/threshold
 *     Body: { amountMinorUnits: number, currency: string }
 *   PUT  /api/funds/:clientId/auto-recharge
 *     Body: AutoRechargeConfigDto
 *
 *   FundTransactionDto: {
 *     id: string, clientId: string, type: FundTransactionType,
 *     amount: { amountMinorUnits: number, currency: string },
 *     createdAt: string (ISO), description: string | null
 *   }
 *
 * Note: The mock's addTransaction() also updated the balance in memory.
 * In the real API, the backend handles balance updates atomically — the
 * repository just POSTs the transaction and returns the result.
 */
import { FundTransaction } from '../core/entities/FundTransaction';
import type { FundTransactionType } from '../core/entities/FundTransaction';
import { Money } from '../core/value-objects/Money';
import type { FundTransactionFilter, AutoRechargeConfig, FundRepository as IFundRepository } from '../services/FundService';
import { ApiClient } from './ApiClient';

interface MoneyDto {
  amountMinorUnits: number;
  currency: string;
}

interface FundTransactionDto {
  id: string;
  clientId: string;
  type: FundTransactionType;
  amount: MoneyDto;
  createdAt: string;
  description: string | null;
}

interface AutoRechargeConfigDto {
  enabled: boolean;
  threshold: MoneyDto;
  amount: MoneyDto;
}

function mapMoneyToDto(money: Money): MoneyDto {
  return { amountMinorUnits: money.getAmountMinorUnits(), currency: money.getCurrency() };
}

function mapDtoToMoney(dto: MoneyDto): Money {
  return new Money(dto.amountMinorUnits, dto.currency);
}

export function mapDtoToFundTransaction(dto: FundTransactionDto): FundTransaction {
  return new FundTransaction(
    dto.id,
    dto.clientId,
    dto.type,
    mapDtoToMoney(dto.amount),
    new Date(dto.createdAt),
    dto.description,
  );
}

export function mapFundTransactionToDto(tx: FundTransaction): FundTransactionDto {
  return {
    id: tx.id,
    clientId: tx.clientId,
    type: tx.type,
    amount: mapMoneyToDto(tx.getAmount()),
    createdAt: tx.createdAt.toISOString(),
    description: tx.description,
  };
}

export class FundRepository implements IFundRepository {
  constructor(private readonly api: ApiClient) {}

  async getBalance(clientId: string): Promise<Money> {
    const dto = await this.api.get<MoneyDto>(
      `/api/funds/${encodeURIComponent(clientId)}/balance`,
    );
    return mapDtoToMoney(dto);
  }

  async addTransaction(transaction: FundTransaction): Promise<FundTransaction> {
    const dto = await this.api.post<FundTransactionDto>(
      `/api/funds/${encodeURIComponent(transaction.clientId)}/transactions`,
      mapFundTransactionToDto(transaction),
    );
    return mapDtoToFundTransaction(dto);
  }

  async getTransactions(clientId: string, filter?: FundTransactionFilter): Promise<FundTransaction[]> {
    const params = new URLSearchParams();
    if (filter?.type) params.set('type', filter.type);
    if (filter?.startDate) params.set('startDate', filter.startDate.toISOString());
    if (filter?.endDate) params.set('endDate', filter.endDate.toISOString());
    const query = params.toString();
    const path = query
      ? `/api/funds/${encodeURIComponent(clientId)}/transactions?${query}`
      : `/api/funds/${encodeURIComponent(clientId)}/transactions`;
    const dtos = await this.api.get<FundTransactionDto[]>(path);
    return dtos.map(mapDtoToFundTransaction);
  }

  async setLowBalanceThreshold(clientId: string, amount: Money): Promise<void> {
    await this.api.put<void>(
      `/api/funds/${encodeURIComponent(clientId)}/threshold`,
      mapMoneyToDto(amount),
    );
  }

  async setAutoRecharge(clientId: string, config: AutoRechargeConfig): Promise<void> {
    const dto: AutoRechargeConfigDto = {
      enabled: config.enabled,
      threshold: mapMoneyToDto(config.threshold),
      amount: mapMoneyToDto(config.amount),
    };
    await this.api.put<void>(
      `/api/funds/${encodeURIComponent(clientId)}/auto-recharge`,
      dto,
    );
  }
}