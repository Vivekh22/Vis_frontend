/**
 * bankFieldMask.test.ts — tests/utils/
 *
 * Tests banking field masking — partially obscure account/routing numbers
 * after entry, showing only last 4 digits with a reveal toggle.
 */
import { describe, it, expect } from 'vitest';
import { maskBankField, formatBankField } from '../../utils/bankFieldMask';

describe('bankFieldMask', () => {
  it('masks all but the last 4 digits', () => {
    expect(maskBankField('12345678901234')).toBe('••••••••••1234');
  });

  it('returns the value as-is if 4 or fewer characters', () => {
    expect(maskBankField('1234')).toBe('1234');
    expect(maskBankField('123')).toBe('123');
  });

  it('returns — for empty/null values', () => {
    expect(maskBankField('')).toBe('—');
    expect(maskBankField(null)).toBe('—');
    expect(maskBankField(undefined)).toBe('—');
  });

  it('formatBankField returns raw value when revealed is true', () => {
    expect(formatBankField('12345678901234', true)).toBe('12345678901234');
  });

  it('formatBankField returns masked value when revealed is false', () => {
    expect(formatBankField('12345678901234', false)).toBe('••••••••••1234');
  });

  it('formatBankField returns — for empty values regardless of reveal', () => {
    expect(formatBankField('', true)).toBe('—');
    expect(formatBankField(null, false)).toBe('—');
  });
});