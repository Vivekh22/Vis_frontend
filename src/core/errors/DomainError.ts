/**
 * DomainError.ts — core/errors/
 *
 * Base class for all domain-layer errors. Extends the native Error class
 * with correct prototype chain restoration so that `instanceof` checks work
 * correctly after TypeScript transpilation.
 *
 * Prototype chain restoration:
 *   When TypeScript transpiles `class Foo extends Error`, the resulting ES5
 *   code does not properly set the prototype chain for built-in types like
 *   Error. This means `new DomainError('x') instanceof DomainError` would
 *   return false without `Object.setPrototypeOf`. This is a well-known
 *   TypeScript/JavaScript gotcha documented in the TS handbook. The fix is
 *   to call `Object.setPrototypeOf(this, DomainError.prototype)` in the
 *   constructor after `super()`.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DomainError.prototype);
    this.name = 'DomainError';
  }
}