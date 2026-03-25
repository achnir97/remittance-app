// Data query hooks
export { useRates } from './useRates';
export { useHistory } from './useHistory';
export {
  useRecentTransactions,
  useTransactionsInRange,
  useSpendingByCategory,
  useDailyTotals,
  useWeeklyTotals,
  useMonthlyTotals,
  useRemittancesInRange,
  useIncomeInRange,
  useSavingsGoal,
  useSaveTransactionFromOCR,
  useDeleteTransaction,
  useUpdateTransactionCategory,
  useInsertIncome,
  useUpsertSavingsGoal,
} from './useTransactions';
export { useSpendingStats } from './useSpendingStats';
export type { CategoryTotal, SummaryStats } from './useSpendingStats';

// Feature hooks
export { useOCR, retryPendingScans } from './useOCR';
export type { OCRStatus } from './useOCR';

// Legal hooks
export { useLegalChat } from './useLegalChat';
export { useLegalDocument } from './useLegalDocument';
export { useLegalVoice } from './useLegalVoice';
export type { VoiceStatus } from './useLegalVoice';
export { useHotlines } from './useHotlines';
