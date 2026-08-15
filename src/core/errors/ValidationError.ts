/**
 * ValidationError.ts — core/errors/
 *
 * Thrown when a domain value object or entity receives invalid input during
 * construction or a state transition. Carries structured information about
 * WHICH field failed and WHAT constraint was violated, so callers can
 * present field-level error messages rather than a generic string.
 */
import { DomainError } from './DomainError';

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly constraint: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.name = 'ValidationError';
  }
}