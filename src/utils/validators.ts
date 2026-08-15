/**
 * validators.ts — utils/
 *
 * Purpose:
 *   Reusable field validation utilities. Used by registration step components
 *   and the login page. Will be reused across many future pages.
 */

/** Returns true if the trimmed value is non-empty. */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Basic email format validation.
 * Uses a pragmatic regex — not RFC 5322 complete, but catches obvious typos.
 * The backend must do final validation.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Basic phone validation: 7+ digits, optional leading +, spaces/dashes/parens ok.
 */
export function isValidPhone(value: string): boolean {
  return /^[+]?[\d\s()-]{7,}$/.test(value.trim());
}

/**
 * Password validation rule (de facto contract the backend must also enforce):
 *   - Minimum 8 characters
 *   - At least 1 uppercase letter
 *   - At least 1 lowercase letter
 *   - At least 1 digit
 */
export const PASSWORD_RULE = 'Minimum 8 characters, at least 1 uppercase, 1 lowercase, and 1 digit.';

export function isValidPassword(value: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
}