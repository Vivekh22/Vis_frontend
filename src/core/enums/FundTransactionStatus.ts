/**
 * FundTransactionStatus.ts — core/enums/
 *
 * Fund transaction lifecycle states. Bank transfers start as 'pending'
 * because they are not immediately credited — the bank must clear the
 * transfer before the balance is updated. Card/PayPal are 'completed'
 * immediately.
 */
export const FundTransactionStatus = {
  Pending: 'pending',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type FundTransactionStatus = (typeof FundTransactionStatus)[keyof typeof FundTransactionStatus];