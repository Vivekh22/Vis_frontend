/**
 * FundService.ts — services/
 *
 * Purpose:
 *   Orchestrates fund balance, transactions, and the Add Fund flow.
 *   Uses Money (integer minor units) throughout for all amounts — never
 *   raw numbers. This is exactly the kind of service where Money's
 *   integer-minor-units discipline matters most.
 */
import { FundTransaction } from '../core/entities/FundTransaction';
import type { FundTransactionType } from '../core/entities/FundTransaction';
import type { FundTransactionStatus } from '../core/enums/FundTransactionStatus';
import type { PaymentMethod } from '../core/enums/PaymentMethod';
import { Money } from '../core/value-objects/Money';

export interface FundTransactionFilter {
  type?: FundTransactionType;
  startDate?: Date;
  endDate?: Date;
}

export interface AutoRechargeConfig {
  enabled: boolean;
  threshold: Money;
  amount: Money;
}

export interface FundRepository {
  getBalance(clientId: string): Promise<Money>;
  addTransaction(transaction: FundTransaction): Promise<FundTransaction>;
  getTransactions(clientId: string, filter?: FundTransactionFilter): Promise<FundTransaction[]>;
  setLowBalanceThreshold(clientId: string, amount: Money): Promise<void>;
  setAutoRecharge(clientId: string, config: AutoRechargeConfig): Promise<void>;
}

/**
 * Fee rates per payment method (percentage of gross amount in basis points).
 * Bank transfers have a lower rate but are not immediately credited.
 */
const FEE_RATES: Record<PaymentMethod, number> = {
  card: 290,        // 2.9%
  paypal: 330,      // 3.3%
  bank_transfer: 0, // 0% — but pending until cleared
};

export class FundService {
  constructor(private readonly fundRepo: FundRepository) {}

  async getBalance(clientId: string): Promise<Money> {
    return await this.fundRepo.getBalance(clientId);
  }

  /**
   * Adds funds via the specified payment method.
   *
   * Bank Transfer: status = 'pending', NOT immediately credited. The
   * transaction is created with pending status and the balance is NOT
   * updated until the bank clears the transfer (markCompleted).
   *
   * Card / PayPal: status = 'completed', immediately credited. The
   * gross amount is the user's input, fee is deducted, and the net
   * amount is credited to the balance.
   */
  async addFund(clientId: string, amount: Money, paymentMethod: PaymentMethod): Promise<FundTransaction> {
    const feeBps = FEE_RATES[paymentMethod] ?? 0;
    const feeAmount = amount.multiply(feeBps / 10000);
    const netAmount = amount.subtract(feeAmount);
    const isBankTransfer = paymentMethod === 'bank_transfer';
    const status: FundTransactionStatus = isBankTransfer ? 'pending' : 'completed';

    const transaction = new FundTransaction(
      this.generateId('ft'),
      clientId,
      'deposit',
      amount,
      new Date(),
      `Funds added via ${paymentMethod}`,
      status,
      paymentMethod,
      amount,      // gross
      feeAmount,   // fee
      netAmount,   // net
    );
    return await this.fundRepo.addTransaction(transaction);
  }

  async getTransactionHistory(clientId: string, filter?: FundTransactionFilter): Promise<FundTransaction[]> {
    return await this.fundRepo.getTransactions(clientId, filter);
  }

  async setLowBalanceThreshold(clientId: string, amount: Money): Promise<void> {
    await this.fundRepo.setLowBalanceThreshold(clientId, amount);
  }

  async setAutoRecharge(clientId: string, config: AutoRechargeConfig): Promise<void> {
    await this.fundRepo.setAutoRecharge(clientId, config);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}