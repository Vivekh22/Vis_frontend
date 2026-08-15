/**
 * MockFundRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of FundRepository for FundService.
 * Stores balances, transactions, thresholds, and auto-recharge configs
 * in memory. Temporary — real repository implementations in Part 6.
 */
import { Money } from '../../core/value-objects/Money';
import type { FundTransaction } from '../../core/entities/FundTransaction';
import type { FundTransactionFilter, AutoRechargeConfig, FundRepository } from '../../services/FundService';

export class MockFundRepository implements FundRepository {
  private readonly balances: Map<string, Money> = new Map();
  private readonly transactions: FundTransaction[] = [];
  private readonly thresholds: Map<string, Money> = new Map();
  private readonly autoRechargeConfigs: Map<string, AutoRechargeConfig> = new Map();

  setBalance(clientId: string, amount: Money): void {
    this.balances.set(clientId, amount);
  }

  async getBalance(clientId: string): Promise<Money> {
    return this.balances.get(clientId) ?? new Money(0, 'USD');
  }

  async addTransaction(transaction: FundTransaction): Promise<FundTransaction> {
    this.transactions.push(transaction);
    // Bank transfers are 'pending' — do NOT credit the balance until cleared.
    // Card/PayPal are 'completed' and credited immediately.
    if (transaction.status === 'pending') {
      return transaction;
    }
    const current = await this.getBalance(transaction.clientId);
    const isCredit =
      transaction.type === 'deposit' ||
      transaction.type === 'credit' ||
      transaction.type === 'refund';
    const newBalance = isCredit
      ? current.add(transaction.getAmount())
      : current.subtract(transaction.getAmount());
    this.balances.set(transaction.clientId, newBalance);
    return transaction;
  }

  async getTransactions(clientId: string, filter?: FundTransactionFilter): Promise<FundTransaction[]> {
    let results = this.transactions.filter((t) => t.clientId === clientId);
    if (filter?.type) {
      results = results.filter((t) => t.type === filter.type);
    }
    return results;
  }

  async setLowBalanceThreshold(clientId: string, amount: Money): Promise<void> {
    this.thresholds.set(clientId, amount);
  }

  async setAutoRecharge(clientId: string, config: AutoRechargeConfig): Promise<void> {
    this.autoRechargeConfigs.set(clientId, config);
  }

  getLowBalanceThreshold(clientId: string): Money | undefined {
    return this.thresholds.get(clientId);
  }

  getAutoRechargeConfig(clientId: string): AutoRechargeConfig | undefined {
    return this.autoRechargeConfigs.get(clientId);
  }
}