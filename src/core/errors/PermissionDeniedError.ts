/**
 * PermissionDeniedError.ts — core/errors/
 *
 * Thrown when a user attempts an action their permission level does not
 * permit. Carries both the required and actual permission levels so the
 * caller can explain the gap (e.g. "This action requires Approve level,
 * you have View level on module 'billing'").
 */
import { DomainError } from './DomainError';
import type { PermissionLevel } from '../enums/PermissionLevel';

export class PermissionDeniedError extends DomainError {
  constructor(
    message: string,
    public readonly requiredLevel: PermissionLevel,
    public readonly actualLevel: PermissionLevel,
  ) {
    super(message);
    Object.setPrototypeOf(this, PermissionDeniedError.prototype);
    this.name = 'PermissionDeniedError';
  }
}