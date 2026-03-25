/**
 * MOCK DATA — demo / preview only.
 * TODO: Set USE_MOCK_DATA = false (or delete this file + all references) when
 *       the backend and SQLite DB are seeded with real data.
 */
export const USE_MOCK_DATA = true;

import type { TransactionRow, RemittanceRow, IncomeRow, SavingsGoalRow, DailyTotal, WeeklyTotal, MonthlyTotal } from '../services/db/types';
import type { RatesResponse, ProviderResult } from '../types';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns an ISO date string (YYYY-MM-DD) offset days back from 2026-03-25. */
function ago(offset: number): string {
  const d = new Date('2026-03-25');
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

function ts(offset: number, time = '10:00:00'): string {
  return `${ago(offset)}T${time}`;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export const MOCK_TRANSACTIONS: TransactionRow[] = [
  { id: 1,  type: 'store',      date: ago(0),  merchant: 'GS25',             amount_krw: 4500,   category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(0, '09:12:00') },
  { id: 2,  type: 'restaurant', date: ago(1),  merchant: '구내식당',           amount_krw: 8000,   category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(1, '12:30:00') },
  { id: 3,  type: 'transport',  date: ago(1),  merchant: '지하철 T-money',     amount_krw: 20000,  category: 'Transport',           image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(1, '08:00:00') },
  { id: 4,  type: 'store',      date: ago(2),  merchant: '올리브영',           amount_krw: 35000,  category: 'Other',               image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(2, '15:40:00') },
  { id: 5,  type: 'restaurant', date: ago(3),  merchant: '스타벅스',           amount_krw: 6500,   category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(3, '10:05:00') },
  { id: 6,  type: 'store',      date: ago(4),  merchant: 'CU 편의점',          amount_krw: 3200,   category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(4, '22:15:00') },
  { id: 7,  type: 'remittance', date: ago(5),  merchant: 'SentBe',            amount_krw: 300000, category: 'Remittance',          image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(5, '11:00:00') },
  { id: 8,  type: 'utility',    date: ago(7),  merchant: 'SKT 핸드폰 요금',   amount_krw: 55000,  category: 'Phone & Internet',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(7, '09:00:00') },
  { id: 9,  type: 'store',      date: ago(8),  merchant: '이마트 에브리데이',  amount_krw: 42000,  category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(8, '18:30:00') },
  { id: 10, type: 'medical',    date: ago(10), merchant: '내과 의원',          amount_krw: 15000,  category: 'Medical',             image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(10, '14:00:00') },
  { id: 11, type: 'store',      date: ago(11), merchant: 'GS25',             amount_krw: 5500,   category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(11, '20:45:00') },
  { id: 12, type: 'transport',  date: ago(12), merchant: '버스 충전',          amount_krw: 10000,  category: 'Transport',           image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(12, '07:50:00') },
  { id: 13, type: 'restaurant', date: ago(13), merchant: '김밥천국',           amount_krw: 7800,   category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(13, '13:10:00') },
  { id: 14, type: 'atm',        date: ago(15), merchant: 'KB국민은행 ATM',     amount_krw: 100000, category: 'Cash Withdrawal',     image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(15, '16:00:00') },
  { id: 15, type: 'restaurant', date: ago(17), merchant: '삼겹살집',           amount_krw: 22000,  category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(17, '19:30:00') },
  { id: 16, type: 'transport',  date: ago(18), merchant: '지하철',             amount_krw: 1250,   category: 'Transport',           image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(18, '08:10:00') },
  { id: 17, type: 'remittance', date: ago(20), merchant: 'GME',               amount_krw: 300000, category: 'Remittance',          image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(20, '10:30:00') },
  { id: 18, type: 'utility',    date: ago(22), merchant: '관리비 · 한국전력',  amount_krw: 180000, category: 'Housing & Utilities', image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(22, '09:00:00') },
  { id: 19, type: 'store',      date: ago(23), merchant: 'GS25',             amount_krw: 4200,   category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(23, '21:00:00') },
  { id: 20, type: 'store',      date: ago(24), merchant: '홈플러스',           amount_krw: 38000,  category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(24, '17:20:00') },
  { id: 21, type: 'restaurant', date: ago(26), merchant: '카페베네',           amount_krw: 5500,   category: 'Food & Groceries',    image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(26, '11:00:00') },
  { id: 22, type: 'transport',  date: ago(27), merchant: '버스',              amount_krw: 1250,   category: 'Transport',           image_path: null, raw_ocr_json: null, notes: null, status: 'confirmed', created_at: ts(27, '08:20:00') },
];

// ─── Remittances (join of transactions + remittance detail) ───────────────────

export const MOCK_REMITTANCES: (TransactionRow & RemittanceRow)[] = [
  {
    ...MOCK_TRANSACTIONS[6]!, // SentBe, ago(5)
    transaction_id: 7,
    provider: 'SentBe',
    sent_krw: 300000,
    fee_krw: 3000,
    recipient_gets: 28247,
    recipient_currency: 'NPR',
    exchange_rate: 0.0951,
  },
  {
    ...MOCK_TRANSACTIONS[16]!, // GME, ago(20)
    transaction_id: 17,
    provider: 'GME',
    sent_krw: 300000,
    fee_krw: 0,
    recipient_gets: 28830,
    recipient_currency: 'NPR',
    exchange_rate: 0.0961,
  },
];

// ─── Income ───────────────────────────────────────────────────────────────────

export const MOCK_INCOME: IncomeRow[] = [
  { id: 1, date: ago(0),  amount_krw: 2400000, source: '월급 (3월)', notes: null, created_at: ts(0) },
  { id: 2, date: ago(30), amount_krw: 2400000, source: '월급 (2월)', notes: null, created_at: ts(30) },
];

// ─── Savings goal ─────────────────────────────────────────────────────────────

export const MOCK_SAVINGS_GOAL: SavingsGoalRow = {
  id: 1,
  name: '비상금 목표',
  target_krw: 500000,
  period: 'monthly',
  created_at: ts(30),
};

// ─── Mock rate data (KRW → NPR) ───────────────────────────────────────────────

export const MOCK_RATES: RatesResponse = {
  from_currency: 'KRW',
  to_currency: 'NPR',
  send_amount: 300000,
  fetched_at: new Date().toISOString(),
  stale: false,
  cache_ttl_mins: 5,
  best_recipient: 28830,
  providers: [
    {
      provider: 'GME',
      rank: 1,
      exchange_rate: 0.0961,
      mid_market_rate: 0.0970,
      markup_percent: 0.93,
      transfer_fee_krw: 0,
      recipient_gets: 28830,
      total_debited_krw: 300000,
      reverse_rate: 10.406,
      transfer_speed: '1-2 hours',
      extra: { rate_expression: '1 KRW = 0.0961 NPR', min_send_krw: 10000, max_send_krw: 10000000 },
      collected_at: new Date().toISOString(),
      source: 'mock',
    },
    {
      provider: 'SentBe',
      rank: 2,
      exchange_rate: 0.0951,
      mid_market_rate: 0.0970,
      markup_percent: 1.96,
      transfer_fee_krw: 3000,
      recipient_gets: 28247,
      total_debited_krw: 303000,
      reverse_rate: 10.515,
      transfer_speed: '30 min – 2 hours',
      extra: { rate_expression: '1 KRW = 0.0951 NPR', min_send_krw: 20000, max_send_krw: 5000000 },
      collected_at: new Date().toISOString(),
      source: 'mock',
    },
    {
      provider: 'Hanpass',
      rank: 3,
      exchange_rate: 0.0938,
      mid_market_rate: 0.0970,
      markup_percent: 3.30,
      transfer_fee_krw: 5000,
      recipient_gets: 27668,
      total_debited_krw: 305000,
      reverse_rate: 10.660,
      transfer_speed: '1 business day',
      extra: { rate_expression: '1 KRW = 0.0938 NPR', min_send_krw: 30000, max_send_krw: 3000000 },
      collected_at: new Date().toISOString(),
      source: 'mock',
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Filter mock transactions to those within [from, to] inclusive. */
export function filterMockByDate(txs: TransactionRow[], from: string, to: string): TransactionRow[] {
  return txs.filter((t) => t.date >= from && t.date <= to);
}

/** Filter mock remittances to those within [from, to] inclusive. */
export function filterMockRemittances(
  rows: (TransactionRow & RemittanceRow)[],
  from: string,
  to: string
): (TransactionRow & RemittanceRow)[] {
  return rows.filter((r) => r.date >= from && r.date <= to);
}

/** Compute daily totals from a transaction list (matching SQL getDailyTotals). */
export function getMockDailyTotals(txs: TransactionRow[]): DailyTotal[] {
  const map: Record<string, number> = {};
  for (const t of txs) map[t.date] = (map[t.date] ?? 0) + t.amount_krw;
  return Object.entries(map)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Compute weekly totals from a transaction list (matching SQL getWeeklyTotals: YYYY-Www). */
export function getMockWeeklyTotals(txs: TransactionRow[]): WeeklyTotal[] {
  const map: Record<string, number> = {};
  for (const t of txs) {
    const d = new Date(t.date + 'T00:00:00');
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    map[key] = (map[key] ?? 0) + t.amount_krw;
  }
  return Object.entries(map)
    .map(([week, total]) => ({ week, total }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

/** Compute monthly totals from a transaction list (matching SQL getMonthlyTotals: YYYY-MM). */
export function getMockMonthlyTotals(txs: TransactionRow[]): MonthlyTotal[] {
  const map: Record<string, number> = {};
  for (const t of txs) {
    const month = t.date.slice(0, 7);
    map[month] = (map[month] ?? 0) + t.amount_krw;
  }
  return Object.entries(map)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Re-compute recipient_gets and total_debited_krw for a given send amount.
 * Fee model: recipient_gets = sendAmount * rate (fee charged separately on top).
 */
export function scaleMockProviders(providers: ProviderResult[], sendAmount: number): ProviderResult[] {
  return providers.map((p) => ({
    ...p,
    recipient_gets: Math.round(sendAmount * p.exchange_rate),
    total_debited_krw: sendAmount + p.transfer_fee_krw,
  }));
}
