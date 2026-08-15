/**
 * Money.ts — core/value-objects/
 *
 * Immutable value object representing a monetary amount. Stores currency as
 * INTEGER MINOR UNITS (e.g. cents), NEVER as floating-point dollars.
 *
 * Why integer minor units:
 *   Floating-point arithmetic accumulates rounding errors. 0.1 + 0.2 = 0.30000000000000004
 *   in IEEE 754. For a platform handling real billing, this is genuinely
 *   dangerous — rounding errors compound across thousands of transactions
 *   and produce real accounting discrepancies. Storing as integer minor units
 *   (e.g. 1000 cents = $10.00) eliminates all floating-point arithmetic from
 *   money operations. Display is the only place where decimal conversion
 *   occurs, and it happens in a single controlled method.
 *
 * Immutability:
 *   All fields are private readonly. Any operation that produces a new
 *   monetary value (add, subtract, multiply) returns a NEW Money instance
 *   rather than mutating this one — standard value-object discipline.
 */
import { ValidationError } from '../errors/ValidationError';

export class Money {
  constructor(
    private readonly amountMinorUnits: number,
    private readonly currency: string,
  ) {
    if (!Number.isInteger(amountMinorUnits)) {
      throw new ValidationError(
        `Money amount must be an integer (minor units), got ${amountMinorUnits}`,
        'amountMinorUnits',
        'integer',
      );
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new ValidationError(
        `Currency must be a valid ISO 4217 code (3 uppercase letters), got "${currency}"`,
        'currency',
        'ISO-4217',
      );
    }
  }

  public getAmountMinorUnits(): number {
    return this.amountMinorUnits;
  }

  public getCurrency(): string {
    return this.currency;
  }

  /**
   * Adds another Money to this one. Throws if currencies mismatch — adding
   * dollars to euros is a domain error, not a silent conversion.
   */
  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new ValidationError(
        `Cannot add ${other.currency} to ${this.currency}`,
        'currency',
        'matching-currency',
      );
    }
    return new Money(this.amountMinorUnits + other.amountMinorUnits, this.currency);
  }

  public subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new ValidationError(
        `Cannot subtract ${other.currency} from ${this.currency}`,
        'currency',
        'matching-currency',
      );
    }
    return new Money(this.amountMinorUnits - other.amountMinorUnits, this.currency);
  }

  public multiply(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw new ValidationError(
        `Factor must be a finite number, got ${factor}`,
        'factor',
        'finite-number',
      );
    }
    return new Money(Math.round(this.amountMinorUnits * factor), this.currency);
  }

  public equals(other: Money): boolean {
    return this.amountMinorUnits === other.amountMinorUnits && this.currency === other.currency;
  }

  /**
   * Formats the amount for display. This is the ONLY place where decimal
   * conversion occurs — all internal arithmetic is integer-based.
   */
  public toDisplayString(): string {
    const major = Math.floor(this.amountMinorUnits / 100);
    const minor = Math.abs(this.amountMinorUnits % 100);
    const minorStr = minor < 10 ? `0${minor}` : String(minor);
    const sign = this.amountMinorUnits < 0 && major === 0 ? '-' : '';
    return `${sign}${major}.${minorStr} ${this.currency}`;
  }
}