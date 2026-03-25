import type { SpendingCategory } from '../../types';

export type TransactionStatus = 'confirmed' | 'pending' | 'failed';

export type TransactionType =
  | 'remittance'
  | 'atm'
  | 'store'
  | 'restaurant'
  | 'utility'
  | 'transport'
  | 'medical'
  | 'other';

export interface TransactionRow {
  id: number;
  type: TransactionType;
  date: string;
  merchant: string | null;
  amount_krw: number;
  category: SpendingCategory;
  raw_ocr_json: string | null;
  image_path: string | null;
  status: TransactionStatus;
  notes: string | null;
  created_at: string;
}

export interface RemittanceRow {
  id: number;
  transaction_id: number;
  provider: string | null;
  sent_krw: number | null;
  fee_krw: number | null;
  recipient_gets: number | null;
  recipient_currency: string | null;
  exchange_rate: number | null;
}

export interface IncomeRow {
  id: number;
  date: string;
  amount_krw: number;
  source: string | null;
  notes: string | null;
  created_at: string;
}

export interface SavingsGoalRow {
  id: number;
  name: string;
  target_krw: number;
  period: 'monthly' | 'weekly';
  created_at: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export interface DailyTotal {
  date: string;
  total: number;
}

export interface WeeklyTotal {
  week: string;
  total: number;
}

export interface MonthlyTotal {
  month: string;
  total: number;
}
