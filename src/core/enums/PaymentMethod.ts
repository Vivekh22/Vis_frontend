/**
 * PaymentMethod.ts — core/enums/
 *
 * Supported payment methods for adding funds. Bank Transfer results in a
 * Pending transaction status (not immediately credited), while Card and
 * PayPal are credited immediately.
 */
export const PaymentMethod = {
  Card: 'card',
  PayPal: 'paypal',
  BankTransfer: 'bank_transfer',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];