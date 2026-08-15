/**
 * FundTransaction.ts — core/entities/
 *
 * A financial transaction (deposit, withdrawal, credit, debit, refund) on
 * a client account. Uses Money (integer minor units) for all amounts.
 *
 * Extended for Part 9: status, paymentMethod, and gross/fee/net breakdown.
 * Bank Transfer transactions start as 'pending' — they are not immediately
 * credited because the bank must clear the transfer. Card and PayPal are
 * 'completed' immediately.
 */
import { Money } from '../value-objects/Money';
import type { FundTransactionStatus } from '../enums/FundTransactionStatus';
import type { PaymentMethod } from '../enums/PaymentMethod';

export type FundTransactionType = 'deposit' | 'withdrawal' | 'credit' | 'debit' | 'refund';

export class FundTransaction {
  private readonly amount: Money;
  private _status: FundTransactionStatus;
  private readonly _grossAmount: Money;
  private readonly _feeAmount: Money;
  private readonly _netAmount: Money;

  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly type: FundTransactionType,
    amount: Money,
    public readonly createdAt: Date = new Date(),
    public readonly description: string | null = null,
    status: FundTransactionStatus = 'completed',
    public readonly paymentMethod: PaymentMethod | null = null,
    grossAmount?: Money,
    feeAmount?: Money,
    netAmount?: Money,
  ) {
    this.amount = amount;
    this._status = status;
    this._grossAmount = grossAmount ?? amount;
    this._feeAmount = feeAmount ?? new Money(0, amount.getCurrency());
    this._netAmount = netAmount ?? amount;
  }

  public getAmount(): Money {
    return this.amount;
  }

  public get status(): FundTransactionStatus {
    return this._status;
  }

  public get grossAmount(): Money {
    return this._grossAmount;
  }

  public get feeAmount(): Money {
    return this._feeAmount;
  }

  public get netAmount(): Money {
    return this._netAmount;
  }

  public markCompleted(): void {
    this._status = 'completed';
  }

  public markFailed(): void {
    this._status = 'failed';
  }
}