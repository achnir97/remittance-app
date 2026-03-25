/**
 * Format a KRW amount as a Korean Won string.
 * e.g. 150000 → "₩150,000"
 */
export function formatKRW(amount: number): string {
  return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable short date.
 * e.g. "2026-03-25" → "Mar 25"
 */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a Date object to YYYY-MM-DD string (used for DB queries).
 */
export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Compute from/to date strings from a number of days back from today.
 * e.g. daysToDateRange(7) → { from: "2026-03-18", to: "2026-03-25" }
 */
export function daysToDateRange(days: number): { from: string; to: string } {
  const now = new Date();
  const to = formatDate(now);
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { from: formatDate(start), to };
}

/**
 * Format a large number with compact suffix.
 * e.g. 1500000 → "1.5M" | 12000 → "12K"
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

/**
 * Format a percentage value.
 * e.g. 0.753 → "75%" | 75 → "75%"
 */
export function formatPercent(value: number, alreadyPercent = true): string {
  const pct = alreadyPercent ? value : Math.round(value * 100);
  return `${pct}%`;
}
