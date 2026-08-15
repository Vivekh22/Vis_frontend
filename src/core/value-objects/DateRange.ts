/**
 * DateRange.ts — core/value-objects/
 *
 * Immutable value object representing a date range with start and end.
 *
 * This REPLACES the minimal stub from Part 2 (which was just an interface).
 * The stub provided only the type contract; this real implementation adds
 * validation (start <= end), equality, overlap detection, and a static
 * factory method that produces the Today/Yesterday/7D/30D/This Month ranges
 * that PeriodSelectorElement needs.
 *
 * Structural compatibility:
 *   The class exposes `start` and `end` as public readonly fields, making it
 *   structurally assignable to the old interface shape. This means existing
 *   code that created plain `{ start, end }` objects is still type-compatible,
 *   and existing tests that check `range.start.getTime()` work unchanged.
 */
import { ValidationError } from '../errors/ValidationError';

export type PeriodOption = 'today' | 'yesterday' | '7d' | '30d' | 'this-month' | 'custom';

export class DateRange {
  constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {
    if (isNaN(start.getTime())) {
      throw new ValidationError('Start date is invalid', 'start', 'valid-date');
    }
    if (isNaN(end.getTime())) {
      throw new ValidationError('End date is invalid', 'end', 'valid-date');
    }
    if (start.getTime() > end.getTime()) {
      throw new ValidationError(
        `Start date (${start.toISOString()}) cannot be after end date (${end.toISOString()})`,
        'start',
        'start-before-or-equal-end',
      );
    }
  }

  /**
   * Static factory producing the preset ranges that PeriodSelectorElement needs.
   * Replaces the standalone `computePresetRange` function from Part 2.
   */
  public static fromPeriodOption(option: Exclude<PeriodOption, 'custom'>): DateRange {
    const now = new Date();
    const startOfDay = (d: Date): Date => {
      const r = new Date(d);
      r.setHours(0, 0, 0, 0);
      return r;
    };
    const endOfDay = (d: Date): Date => {
      const r = new Date(d);
      r.setHours(23, 59, 59, 999);
      return r;
    };
    const addDays = (d: Date, n: number): Date => {
      const r = new Date(d);
      r.setDate(r.getDate() + n);
      return r;
    };

    switch (option) {
      case 'today':
        return new DateRange(startOfDay(now), endOfDay(now));
      case 'yesterday': {
        const y = addDays(now, -1);
        return new DateRange(startOfDay(y), endOfDay(y));
      }
      case '7d':
        return new DateRange(startOfDay(addDays(now, -6)), endOfDay(now));
      case '30d':
        return new DateRange(startOfDay(addDays(now, -29)), endOfDay(now));
      case 'this-month':
        return new DateRange(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0), endOfDay(now));
    }
  }

  /**
   * Returns true if this range overlaps with another range (inclusive).
   * Used for scheduling conflict detection and campaign date validation.
   */
  public overlaps(other: DateRange): boolean {
    return this.start.getTime() <= other.end.getTime() && other.start.getTime() <= this.end.getTime();
  }

  public equals(other: DateRange): boolean {
    return this.start.getTime() === other.start.getTime() && this.end.getTime() === other.end.getTime();
  }
}