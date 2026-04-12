/**
 * Parse a value as an integer for responsive calculations.
 * Handles undefined, numbers, and numeric strings.
 *
 * @param x - The value to parse
 * @returns The parsed integer, or NaN if the value cannot be parsed
 */
export function getInt(x: unknown): number {
  if (typeof x === 'undefined') return NaN;
  if (typeof x === 'number') return Number.isFinite(x) ? x : NaN;
  if (typeof x === 'string' && /^[0-9]+$/.test(x)) return parseInt(x, 10);
  return NaN;
}