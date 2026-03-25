// Re-export everything so existing imports from 'services/db' continue to work
export type {
  TransactionStatus,
  TransactionType,
  TransactionRow,
  RemittanceRow,
  IncomeRow,
  SavingsGoalRow,
  CategoryTotal,
  DailyTotal,
  WeeklyTotal,
  MonthlyTotal,
} from './types';

export { getDb, initDb } from './connection';

export {
  insertTransactionFromOCR,
  deleteTransaction,
  updateTransactionCategory,
  updateTransactionStatus,
  getRecentTransactions,
  getTransactionsInRange,
  getTransactionsPage,
  getPendingScans,
  getSpendingByCategory,
  getDailyTotals,
  getWeeklyTotals,
  getMonthlyTotals,
  getRemittancesInRange,
} from './transactions';

export { insertIncome, getIncomeInRange } from './income';

export { getSavingsGoal, upsertSavingsGoal } from './savings';
