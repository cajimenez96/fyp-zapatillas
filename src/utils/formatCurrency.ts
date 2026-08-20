/**
 * Formats a number or numeric string in Argentine currency format:
 * - Thousands separated by '.'
 * - Decimals separated by ','
 * - Exactly 2 decimal digits
 *
 * Examples:
 *   100000.12312 -> "$100.000,12"
 *   80000        -> "$80.000,00"
 *   1234567.89   -> "$1.234.567,89"
 *   undefined    -> "$0,00"
 */
export function formatPrice(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '$0,00';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return '$0,00';

  return `$${num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a numeric value without the currency sign:
 * Example: 100000.12312 -> "100.000,12"
 */
export function formatAmount(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '0,00';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return '0,00';

  return num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
