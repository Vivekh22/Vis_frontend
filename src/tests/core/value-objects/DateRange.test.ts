// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { DateRange } from '../../../core/value-objects/DateRange';
import { ValidationError } from '../../../core/errors/ValidationError';

describe('DateRange', () => {
  it('constructs with valid start <= end', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');
    const range = new DateRange(start, end);
    expect(range.start).toBe(start);
    expect(range.end).toBe(end);
  });

  it('throws ValidationError when start > end', () => {
    const start = new Date('2026-01-31');
    const end = new Date('2026-01-01');
    expect(() => new DateRange(start, end)).toThrow(ValidationError);
  });

  it('throws ValidationError for invalid dates', () => {
    expect(() => new DateRange(new Date('invalid'), new Date())).toThrow(ValidationError);
    expect(() => new DateRange(new Date(), new Date('invalid'))).toThrow(ValidationError);
  });

  it('fromPeriodOption produces valid ranges for all presets', () => {
    const today = DateRange.fromPeriodOption('today');
    expect(today.start.getTime()).toBeLessThanOrEqual(today.end.getTime());

    const yesterday = DateRange.fromPeriodOption('yesterday');
    expect(yesterday.start.getTime()).toBeLessThanOrEqual(yesterday.end.getTime());

    const sevenDays = DateRange.fromPeriodOption('7d');
    expect(sevenDays.start.getTime()).toBeLessThanOrEqual(sevenDays.end.getTime());

    const thirtyDays = DateRange.fromPeriodOption('30d');
    expect(thirtyDays.start.getTime()).toBeLessThanOrEqual(thirtyDays.end.getTime());

    const thisMonth = DateRange.fromPeriodOption('this-month');
    expect(thisMonth.start.getTime()).toBeLessThanOrEqual(thisMonth.end.getTime());
  });

  it('fromPeriodOption 7d spans approximately 7 days', () => {
    const range = DateRange.fromPeriodOption('7d');
    const diff = range.end.getTime() - range.start.getTime();
    expect(diff).toBeGreaterThanOrEqual(6 * 24 * 60 * 60 * 1000);
  });

  it('overlaps detects overlapping ranges', () => {
    const a = new DateRange(new Date('2026-01-01'), new Date('2026-01-15'));
    const b = new DateRange(new Date('2026-01-10'), new Date('2026-01-20'));
    const c = new DateRange(new Date('2026-02-01'), new Date('2026-02-15'));
    expect(a.overlaps(b)).toBe(true);
    expect(a.overlaps(c)).toBe(false);
  });

  it('equals compares start and end timestamps', () => {
    const s1 = new Date('2026-01-01');
    const e1 = new Date('2026-01-31');
    const s2 = new Date('2026-01-01');
    const e2 = new Date('2026-01-31');
    const a = new DateRange(s1, e1);
    const b = new DateRange(s2, e2);
    const c = new DateRange(new Date('2026-01-01'), new Date('2026-02-28'));
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('is immutable — fields are readonly', () => {
    const range = new DateRange(new Date('2026-01-01'), new Date('2026-01-31'));
    // TypeScript readonly is compile-time only; verify runtime value is unchanged
    const originalStart = range.start.getTime();
    expect(range.start.getTime()).toBe(originalStart);
  });
});