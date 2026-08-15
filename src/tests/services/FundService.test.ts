/**
 * FundService.test.ts — tests for services/FundService.
 *
 * Tests the ORCHESTRATION logic: getBalance, addFund (creates transaction,
 * updates balance), getTransactionHistory, setLowBalanceThreshold,
 * setAutoRecharge. Verifies Money is used throughout — never raw numbers.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { FundService } from '../../services/FundService';
import type { FundRepository, FundTransactionFilter, AutoRechargeConfig } from '../../services/FundService';
import { FundTransaction } from '../../core/entities/FundTransaction';
import { Money } from '../../core/value-objects/Money';
import { PaymentMethod } from '../../core/enums/PaymentMethod';

class MockFundRepo implements FundRepository {
  private balances: Map<string, Money> = new Map();
  private transactions: FundTransaction[] = [];
  private thresholds: Map<string, Money> = new Map();
  private autoRecharge: Map<string, AutoRechargeConfig> = new Map();

  setBalance(clientId: string, amount: Money): void {
    this.balances.set(clientId, amount);
  }

  async getBalance(clientId: string): Promise<Money> {
    return this.balances.get(clientId) ?? new Money(0, 'USD');
  }

  async addTransaction(transaction: FundTransaction): Promise<FundTransaction> {
    this.transactions.push(transaction);
    // Bank transfers are 'pending' — do NOT credit until cleared.
    if (transaction.status === 'pending') {
      return transaction;
    }
    const current = await this.getBalance(transaction.clientId);
    const isCredit = transaction.type === 'deposit' || transaction.type === 'credit' || transaction.type === 'refund';
    const newBalance = isCredit
      ? current.add(transaction.getAmount())
      : current.subtract(transaction.getAmount());
    this.balances.set(transaction.clientId, newBalance);
    return transaction;
  }

  async getTransactions(clientId: string, filter?: FundTransactionFilter): Promise<FundTransaction[]> {
    let results = this.transactions.filter((t) => t.clientId === clientId);
    if (filter?.type) results = results.filter((t) => t.type === filter.type);
    return results;
  }

  async setLowBalanceThreshold(clientId: string, amount: Money): Promise<void> {
    this.thresholds.set(clientId, amount);
  }

  async setAutoRecharge(clientId: string, config: AutoRechargeConfig): Promise<void> {
    this.autoRecharge.set(clientId, config);
  }

  getThreshold(clientId: string): Money | undefined {
    return this.thresholds.get(clientId);
  }

  getAutoRecharge(clientId: string): AutoRechargeConfig | undefined {
    return this.autoRecharge.get(clientId);
  }
}

describe('FundService', () => {
  let repo: MockFundRepo;

  beforeEach(() => {
    repo = new MockFundRepo();
    repo.setBalance('client-a', new Money(50000, 'USD')); // $500.00
  });

  it('getBalance returns Money (never raw number)', async () => {
    const svc = new FundService(repo);
    const balance = await svc.getBalance('client-a');
    expect(balance).toBeInstanceOf(Money);
    expect(balance.getAmountMinorUnits()).toBe(50000);
    expect(balance.getCurrency()).toBe('USD');
  });

  it('addFund creates a deposit transaction and updates balance', async () => {
    const svc = new FundService(repo);
    const transaction = await svc.addFund('client-a', new Money(10000, 'USD'), PaymentMethod.Card);
    expect(transaction.type).toBe('deposit');
    expect(transaction.clientId).toBe('client-a');
    expect(transaction.getAmount().getAmountMinorUnits()).toBe(10000);
    expect(transaction.status).toBe('completed');
    // Balance updated: 50000 + 10000 = 60000
    const balance = await svc.getBalance('client-a');
    expect(balance.getAmountMinorUnits()).toBe(60000);
  });

  it('getTransactionHistory returns transactions for a client', async () => {
    const svc = new FundService(repo);
    await svc.addFund('client-a', new Money(10000, 'USD'), PaymentMethod.Card);
    await svc.addFund('client-a', new Money(5000, 'USD'), PaymentMethod.PayPal);
    const history = await svc.getTransactionHistory('client-a');
    expect(history).toHaveLength(2);
    expect(history.every((t) => t.clientId === 'client-a')).toBe(true);
  });

  it('getTransactionHistory filters by type', async () => {
    const svc = new FundService(repo);
    await svc.addFund('client-a', new Money(10000, 'USD'), PaymentMethod.Card);
    const history = await svc.getTransactionHistory('client-a', { type: 'deposit' });
    expect(history).toHaveLength(1);
  });

  it('addFund with Bank Transfer creates pending transaction — NOT immediately credited', async () => {
    const svc = new FundService(repo);
    const transaction = await svc.addFund('client-a', new Money(10000, 'USD'), PaymentMethod.BankTransfer);
    expect(transaction.status).toBe('pending');
    expect(transaction.paymentMethod).toBe(PaymentMethod.BankTransfer);
    // Balance NOT updated — still 50000
    const balance = await svc.getBalance('client-a');
    expect(balance.getAmountMinorUnits()).toBe(50000);
  });

  it('addFund with Card includes fee breakdown (gross/fee/net)', async () => {
    const svc = new FundService(repo);
    const transaction = await svc.addFund('client-a', new Money(10000, 'USD'), PaymentMethod.Card);
    expect(transaction.grossAmount.getAmountMinorUnits()).toBe(10000);
    expect(transaction.feeAmount.getAmountMinorUnits()).toBe(290); // 2.9%
    expect(transaction.netAmount.getAmountMinorUnits()).toBe(9710);
  });

  it('setLowBalanceThreshold stores Money threshold', async () => {
    const svc = new FundService(repo);
    await svc.setLowBalanceThreshold('client-a', new Money(5000, 'USD'));
    expect(repo.getThreshold('client-a')?.getAmountMinorUnits()).toBe(5000);
  });

  it('setAutoRecharge stores config with Money amounts', async () => {
    const svc = new FundService(repo);
    const config: AutoRechargeConfig = {
      enabled: true,
      threshold: new Money(5000, 'USD'),
      amount: new Money(20000, 'USD'),
    };
    await svc.setAutoRecharge('client-a', config);
    const stored = repo.getAutoRecharge('client-a');
    expect(stored?.enabled).toBe(true);
    expect(stored?.threshold.getAmountMinorUnits()).toBe(5000);
    expect(stored?.amount.getAmountMinorUnits()).toBe(20000);
  });
});