/**
 * ApiError.ts — core/errors/
 *
 * Represents a network or server failure — distinct from DomainError and
 * ValidationError which represent domain-logic violations. ApiError is thrown
 * when the API returns a non-2xx response or a network error occurs.
 *
 * Carries statusCode and body so callers can make decisions based on the
 * HTTP status (e.g. 404 → not found, 409 → conflict) and inspect the
 * response body for error details.
 */
import { DomainError } from './DomainError';

export class ApiError extends DomainError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = 'ApiError';
  }

  public get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  public get isNotFound(): boolean {
    return this.statusCode === 404;
  }
}