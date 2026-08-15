/**
 * Percentage.ts — core/value-objects/
 *
 * Immutable value object representing a percentage (0-100 by default).
 *
 * This frontend never computes margin itself — it only ever displays
 * platform-approved figures. However, Percentage is used by Money-adjacent
 * margin/take-rate display logic, and having it as a validated value object
 * ensures that invalid values (negative, >100) are caught at construction
 * time rather than rendering nonsensical UI.
 *
 * Bounds are configurable via the constructor's optional `min` and `max`
 * parameters, defaulting to 0 and 100.
 */
import { ValidationError } from '../errors/ValidationError';

export class Percentage {
  constructor(
    private readonly value: number,
    private readonly min: number = 0,
    private readonly max: number = 100,
  ) {
    if (isNaN(value)) {
      throw new ValidationError('Percentage value is NaN', 'value', 'finite-number');
    }
    if (value < min || value > max) {
      throw new ValidationError(
        `Percentage ${value} is out of bounds [${min}, ${max}]`,
        'value',
        `between-${min}-and-${max}`,
      );
    }
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: Percentage): boolean {
    return this.value === other.value && this.min === other.min && this.max === other.max;
  }

  public toDisplayString(): string {
    return `${this.value}%`;
  }
}