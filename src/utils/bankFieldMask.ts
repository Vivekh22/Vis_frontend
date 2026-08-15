/**
 * bankFieldMask.ts — utils/
 *
 * Utility for partially obscuring banking field values (account numbers,
 * routing numbers) after entry. Shows only the last 4 digits by default,
 * with a reveal toggle that temporarily shows the full value.
 *
 * This implements the Part 7 deferred recommendation: "partially obscure
 * account/routing numbers after entry, e.g. showing only last 4 digits
 * with a reveal toggle."
 */

/**
 * Masks a banking field value, showing only the last 4 characters.
 * Returns "••••••1234" for "12345678901234".
 * Returns "—" for empty/null values.
 */
export function maskBankField(value: string | undefined | null): string {
  if (!value || value.length === 0) return '—';
  if (value.length <= 4) return value;
  const last4 = value.slice(-4);
  const maskLength = Math.max(value.length - 4, 4);
  return '•'.repeat(maskLength) + last4;
}

/**
 * Formats a masked or unmasked banking field for display.
 * When revealed is true, returns the raw value.
 * When revealed is false, returns the masked version.
 */
export function formatBankField(value: string | undefined | null, revealed: boolean): string {
  if (!value || value.length === 0) return '—';
  if (revealed) return value;
  return maskBankField(value);
}