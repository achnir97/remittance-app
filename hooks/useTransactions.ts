import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecentTransactions,
  insertTransactionFromOCR,
  deleteTransaction,
  updateTransactionCategory,
  getTransactionsInRange,
  getSpendingByCategory,
  getDailyTotals,
  getWeeklyTotals,
  getMonthlyTotals,
  getRemittancesInRange,
  getIncomeInRange,
  getSavingsGoal,
  insertIncome,
  upsertSavingsGoal,
  TransactionRow,
} from '../services/db';
import { OCRResult, SpendingCategory } from '../types';

const RECENT_KEY = ['transactions', 'recent'];
const RANGE_KEY = (from: string, to: string) => ['transactions', 'range', from, to];
const CATEGORY_KEY = (from: string, to: string) => ['spending', 'category', from, to];
const DAILY_KEY = (from: string, to: string) => ['spending', 'daily', from, to];
const WEEKLY_KEY = (from: string, to: string) => ['spending', 'weekly', from, to];
const MONTHLY_KEY = (from: string, to: string) => ['spending', 'monthly', from, to];
const REMITTANCE_KEY = (from: string, to: string) => ['spending', 'remittance', from, to];
const INCOME_KEY = (from: string, to: string) => ['income', from, to];
const SAVINGS_GOAL_KEY = ['savings', 'goal'];

// staleTime constants — prevents redundant refetches when navigating back
const STALE_2MIN = 1000 * 60 * 2;
const STALE_5MIN = 1000 * 60 * 5;
const STALE_10MIN = 1000 * 60 * 10;

export function useRecentTransactions(limit = 20) {
  return useQuery({
    queryKey: [...RECENT_KEY, limit],
    queryFn: () => getRecentTransactions(limit),
    staleTime: STALE_2MIN,
  });
}

export function useTransactionsInRange(from: string, to: string) {
  return useQuery({
    queryKey: RANGE_KEY(from, to),
    queryFn: () => getTransactionsInRange(from, to),
    enabled: !!from && !!to,
    staleTime: STALE_2MIN,
  });
}

export function useSpendingByCategory(from: string, to: string) {
  return useQuery({
    queryKey: CATEGORY_KEY(from, to),
    queryFn: () => getSpendingByCategory(from, to),
    enabled: !!from && !!to,
    staleTime: STALE_2MIN,
  });
}

export function useDailyTotals(from: string, to: string) {
  return useQuery({
    queryKey: DAILY_KEY(from, to),
    queryFn: () => getDailyTotals(from, to),
    enabled: !!from && !!to,
    staleTime: STALE_2MIN,
  });
}

export function useWeeklyTotals(from: string, to: string) {
  return useQuery({
    queryKey: WEEKLY_KEY(from, to),
    queryFn: () => getWeeklyTotals(from, to),
    enabled: !!from && !!to,
    staleTime: STALE_2MIN,
  });
}

export function useMonthlyTotals(from: string, to: string) {
  return useQuery({
    queryKey: MONTHLY_KEY(from, to),
    queryFn: () => getMonthlyTotals(from, to),
    enabled: !!from && !!to,
    staleTime: STALE_2MIN,
  });
}

export function useRemittancesInRange(from: string, to: string) {
  return useQuery({
    queryKey: REMITTANCE_KEY(from, to),
    queryFn: () => getRemittancesInRange(from, to),
    enabled: !!from && !!to,
    staleTime: STALE_5MIN,
  });
}

export function useIncomeInRange(from: string, to: string) {
  return useQuery({
    queryKey: INCOME_KEY(from, to),
    queryFn: () => getIncomeInRange(from, to),
    enabled: !!from && !!to,
    staleTime: STALE_5MIN,
  });
}

export function useSavingsGoal() {
  return useQuery({
    queryKey: SAVINGS_GOAL_KEY,
    queryFn: () => getSavingsGoal(),
    staleTime: STALE_10MIN,
  });
}

export function useSaveTransactionFromOCR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { ocr: OCRResult; imagePath: string | null; confirmed: boolean }) =>
      insertTransactionFromOCR(params.ocr, params.imagePath, params.confirmed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECENT_KEY });
      qc.invalidateQueries({ queryKey: ['transactions', 'range'] });
      qc.invalidateQueries({ queryKey: ['spending'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECENT_KEY });
      qc.invalidateQueries({ queryKey: ['transactions', 'range'] });
      qc.invalidateQueries({ queryKey: ['spending'] });
    },
  });
}

export function useUpdateTransactionCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: number; category: SpendingCategory }) =>
      updateTransactionCategory(params.id, params.category),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECENT_KEY });
      qc.invalidateQueries({ queryKey: ['spending', 'category'] });
    },
  });
}

export function useInsertIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { date: string; amount_krw: number; source?: string }) =>
      insertIncome(params.date, params.amount_krw, params.source),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['income'] });
    },
  });
}

export function useUpsertSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; target_krw: number; period: 'monthly' | 'weekly' }) =>
      upsertSavingsGoal(params.name, params.target_krw, params.period),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVINGS_GOAL_KEY });
    },
  });
}
