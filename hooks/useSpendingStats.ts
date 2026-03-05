import { useMemo } from 'react';
import { TransactionRow } from '../services/db';
import { SpendingCategory } from '../types';

export interface CategoryTotal {
  category: SpendingCategory;
  total: number;
}

export interface SummaryStats {
  totalSpent: number;
  sentHome: number;
  sentHomePct: number;
  sentHomeCount: number;
  totalFees: number;
  avgFeePerRemittance: number;
  topCategory: string | null;
  topCategoryPct: number;
  transactionCount: number;
  byCategory: Record<string, number>;
}

export function useSpendingStats(
  transactions: TransactionRow[],
  from: string,
  to: string
): SummaryStats {
  return useMemo(() => {
    const inRange = transactions.filter(
      (t) => t.date >= from && t.date <= to && t.status === 'confirmed'
    );

    const totalSpent = inRange.reduce((s, t) => s + t.amount_krw, 0);

    const remittances = inRange.filter((t) => t.type === 'remittance');
    const sentHome = remittances.reduce((s, t) => s + t.amount_krw, 0);
    const sentHomeCount = remittances.length;

    // fee_krw lives in remittances table — best-effort from raw_ocr_json
    const totalFees = remittances.reduce((s, t) => {
      try {
        const ocr = JSON.parse(t.raw_ocr_json ?? '{}');
        return s + (ocr?.remittance?.fee_krw ?? 0);
      } catch {
        return s;
      }
    }, 0);

    const avgFeePerRemittance =
      sentHomeCount > 0 ? Math.round(totalFees / sentHomeCount) : 0;

    const byCategory = inRange.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount_krw;
      return acc;
    }, {});

    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const topCategory = sorted[0]?.[0] ?? null;
    const topCategoryPct =
      topCategory && totalSpent > 0
        ? Math.round((byCategory[topCategory]! / totalSpent) * 100)
        : 0;

    return {
      totalSpent,
      sentHome,
      sentHomePct:
        totalSpent > 0 ? Math.round((sentHome / totalSpent) * 100) : 0,
      sentHomeCount,
      totalFees,
      avgFeePerRemittance,
      topCategory,
      topCategoryPct,
      transactionCount: inRange.length,
      byCategory,
    };
  }, [transactions, from, to]);
}

// Helper: compute from/to date strings from a preset number of days
export function daysToDateRange(days: number): { from: string; to: string } {
  const now = new Date();
  const to = formatDate(now);
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { from: formatDate(start), to };
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
