/**
 * Invoice.ts — core/entities/
 *
 * An invoice for a client's advertising spend. Uses Money for the amount.
 */
import { Money } from '../value-objects/Money';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export class Invoice {
  private _status: InvoiceStatus;

  constructor(
    public readonly id: string,
    public readonly clientId: string,
    private readonly amount: Money,
    status: InvoiceStatus = 'draft',
    public readonly issueDate: Date = new Date(),
    public readonly dueDate: Date,
    public readonly billingPeriod?: string,
  ) {
    this._status = status;
  }

  public get status(): InvoiceStatus {
    return this._status;
  }

  public getAmount(): Money {
    return this.amount;
  }

  public markSent(): void {
    if (this._status !== 'draft') {
      throw new Error(`Cannot mark sent: invoice is ${this._status}`);
    }
    this._status = 'sent';
  }

  public markPaid(): void {
    if (this._status !== 'sent' && this._status !== 'overdue') {
      throw new Error(`Cannot mark paid: invoice is ${this._status}`);
    }
    this._status = 'paid';
  }

  public markOverdue(): void {
    if (this._status !== 'sent') {
      throw new Error(`Cannot mark overdue: invoice is ${this._status}`);
    }
    this._status = 'overdue';
  }

  public void(): void {
    if (this._status === 'paid') {
      throw new Error('Cannot void a paid invoice');
    }
    this._status = 'void';
  }
}