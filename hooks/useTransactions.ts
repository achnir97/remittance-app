import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  initDb,
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

export function useRecentTransactions(limit = 20) {
  return useQuery({
    queryKey: [...RECENT_KEY, limit],
    queryFn: async () => {
      await initDb();
      return getRecentTransactions(limit);
    },
  });
}

export function useTransactionsInRange(from: string, to: string) {
  return useQuery({
    queryKey: RANGE_KEY(from, to),
    queryFn: async () => {
      await initDb();
      return getTransactionsInRange(from, to);
    },
    enabled: !!from && !!to,
  });
}

export function useSpendingByCategory(from: string, to: string) {
  return useQuery({
    queryKey: CATEGORY_KEY(from, to),
    queryFn: async () => {
      await initDb();
      return getSpendingByCategory(from, to);
    },
    enabled: !!from && !!to,
  });
}

export function useDailyTotals(from: string, to: string) {
  return useQuery({
    queryKey: DAILY_KEY(from, to),
    queryFn: async () => {
      await initDb();
      return getDailyTotals(from, to);
    },
    enabled: !!from && !!to,
  });
}

export function useWeeklyTotals(from: string, to: string) {
  return useQuery({
    queryKey: WEEKLY_KEY(from, to),
    queryFn: async () => {
      await initDb();
      return getWeeklyTotals(from, to);
    },
    enabled: !!from && !!to,
  });
}

export function useMonthlyTotals(from: string, to: string) {
  return useQuery({
    queryKey: MONTHLY_KEY(from, to),
    queryFn: async () => {
      await initDb();
      return getMonthlyTotals(from, to);
    },
    enabled: !!from && !!to,
  });
}

export function useRemittancesInRange(from: string, to: string) {
  return useQuery({
    queryKey: REMITTANCE_KEY(from, to),
    queryFn: async () => {
      await initDb();
      return getRemittancesInRange(from, to);
    },
    enabled: !!from && !!to,
  });
}

export function useIncomeInRange(from: string, to: string) {
  return useQuery({
    queryKey: INCOME_KEY(from, to),
    queryFn: async () => {
      await initDb();
      return getIncomeInRange(from, to);
    },
    enabled: !!from && !!to,
  });
}

export function useSavingsGoal() {
  return useQuery({
    queryKey: SAVINGS_GOAL_KEY,
    queryFn: async () => {
      await initDb();
      return getSavingsGoal();
    },
  });
}

export function useSaveTransactionFromOCR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      ocr: OCRResult;
      imagePath: string | null;
      confirmed: boolean;
    }) => {
      await initDb();
      return insertTransactionFromOCR(params.ocr, params.imagePath, params.confirmed);
    },
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
    mutationFn: async (id: number) => {
      await initDb();
      return deleteTransaction(id);
    },
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
    mutationFn: async (params: { id: number; category: SpendingCategory }) => {
      await initDb();
      return updateTransactionCategory(params.id, params.category);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RECENT_KEY });
      qc.invalidateQueries({ queryKey: ['spending', 'category'] });
    },
  });
}

export function useInsertIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      date: string;
      amount_krw: number;
      source?: string;
    }) => {
      await initDb();
      return insertIncome(params.date, params.amount_krw, params.source);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['income'] });
    },
  });
}

export function useUpsertSavingsGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      target_krw: number;
      period: 'monthly' | 'weekly';
    }) => {
      await initDb();
      return upsertSavingsGoal(params.name, params.target_krw, params.period);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVINGS_GOAL_KEY });
    },
  });
}
