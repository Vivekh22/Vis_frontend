/**
 * formatters.ts — utils/
 *
 * Shared display formatters used across charts and UI. Centralizes compact
 * number/currency formatting so axis labels render consistently everywhere
 * (revenue/spend charts show "$1.5K" style ticks, count charts show "1.5K").
 */
export type AxisValueFormat = 'number' | 'currency';

function trimDecimal(s: string): string {
  return s.replace(/\.0$/, '');
}

/**
 * Formats a number compactly for axis ticks, e.g. 1500 -> "1.5K", 1200000 -> "1.2M".
 */
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trimDecimal((value / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `${trimDecimal((value / 1_000).toFixed(1))}K`;
  return `${value}`;
}

/**
 * Formats a number as a compact currency tick, e.g. 1500 -> "$1.5K".
 */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${trimDecimal((value / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `$${trimDecimal((value / 1_000).toFixed(1))}K`;
  return `$${value}`;
}

/**
 * Dispatches to the correct axis formatter based on the chart's value format.
 */
export function formatAxisValue(value: number, format: AxisValueFormat = 'number'): string {
  return format === 'currency' ? formatCompactCurrency(value) : formatCompactNumber(value);
}