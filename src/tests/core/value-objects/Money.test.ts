// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { Money } from '../../../core/value-objects/Money';
import { ValidationError } from '../../../core/errors/ValidationError';

describe('Money', () => {
  it('constructs with integer minor units and ISO currency', () => {
    const m = new Money(1000, 'USD');
    expect(m.getAmountMinorUnits()).toBe(1000);
    expect(m.getCurrency()).toBe('USD');
  });

  it('throws ValidationError for non-integer amount', () => {
    expect(() => new Money(10.5, 'USD')).toThrow(ValidationError);
  });

  it('throws ValidationError for invalid currency code', () => {
    expect(() => new Money(1000, 'us')).toThrow(ValidationError);
    expect(() => new Money(1000, 'usd')).toThrow(ValidationError);
    expect(() => new Money(1000, 'USDD')).toThrow(ValidationError);
  });

  it('add returns new Money with summed amounts', () => {
    const a = new Money(1000, 'USD');
    const b = new Money(500, 'USD');
    const result = a.add(b);
    expect(result.getAmountMinorUnits()).toBe(1500);
    expect(a.getAmountMinorUnits()).toBe(1000); // original unchanged (immutability)
  });

  it('add throws on currency mismatch', () => {
    const a = new Money(1000, 'USD');
    const b = new Money(500, 'EUR');
    expect(() => a.add(b)).toThrow(ValidationError);
  });

  it('subtract returns new Money with difference', () => {
    const a = new Money(1000, 'USD');
    const b = new Money(300, 'USD');
    const result = a.subtract(b);
    expect(result.getAmountMinorUnits()).toBe(700);
  });

  it('multiply rounds to nearest minor unit', () => {
    const m = new Money(1000, 'USD');
    const result = m.multiply(1.5);
    expect(result.getAmountMinorUnits()).toBe(1500);
  });

  it('multiply throws for non-finite factor', () => {
    const m = new Money(1000, 'USD');
    expect(() => m.multiply(NaN)).toThrow(ValidationError);
    expect(() => m.multiply(Infinity)).toThrow(ValidationError);
  });

  it('equals compares value and currency', () => {
    const a = new Money(1000, 'USD');
    const b = new Money(1000, 'USD');
    const c = new Money(1000, 'EUR');
    const d = new Money(2000, 'USD');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.equals(d)).toBe(false);
  });

  it('toDisplayString formats as major.minor currency', () => {
    expect(new Money(1000, 'USD').toDisplayString()).toBe('10.00 USD');
    expect(new Money(99, 'USD').toDisplayString()).toBe('0.99 USD');
    expect(new Money(1050, 'EUR').toDisplayString()).toBe('10.50 EUR');
  });
});