import { describe, it, expect } from 'vitest';
import { DomainError } from '../../../core/errors/DomainError';
import { ValidationError } from '../../../core/errors/ValidationError';
import { PermissionDeniedError } from '../../../core/errors/PermissionDeniedError';

describe('core/errors', () => {
  describe('DomainError', () => {
    it('extends native Error with correct prototype chain', () => {
      const err = new DomainError('something went wrong');
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('something went wrong');
      expect(err.name).toBe('DomainError');
    });

    it('instanceof works after transpilation (prototype chain restored)', () => {
      try {
        throw new DomainError('test');
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect(e instanceof DomainError).toBe(true);
      }
    });
  });

  describe('ValidationError', () => {
    it('extends DomainError with field and constraint', () => {
      const err = new ValidationError('invalid email', 'email', 'email-format');
      expect(err).toBeInstanceOf(ValidationError);
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
      expect(err.field).toBe('email');
      expect(err.constraint).toBe('email-format');
      expect(err.message).toBe('invalid email');
    });
  });

  describe('PermissionDeniedError', () => {
    it('extends DomainError with requiredLevel and actualLevel', () => {
      const err = new PermissionDeniedError('insufficient permissions', 'approve', 'view');
      expect(err).toBeInstanceOf(PermissionDeniedError);
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toBeInstanceOf(Error);
      expect(err.requiredLevel).toBe('approve');
      expect(err.actualLevel).toBe('view');
    });
  });
});