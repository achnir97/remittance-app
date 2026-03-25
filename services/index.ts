// HTTP client
export { client, api } from './api';

// Database (SQLite)
export {
  getDb,
  initDb,
  insertTransactionFromOCR,
  deleteTransaction,
  updateTransactionCategory,
  updateTransactionStatus,
  getRecentTransactions,
  getTransactionsInRange,
  getPendingScans,
  getSpendingByCategory,
  getDailyTotals,
  getWeeklyTotals,
  getMonthlyTotals,
  getRemittancesInRange,
  insertIncome,
  getIncomeInRange,
  getSavingsGoal,
  upsertSavingsGoal,
} from './db';
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
} from './db';

// OCR
export { scanReceiptWithBackend } from './ocr';

// Image processing
export { prepareImageForOCR, readImageAsBase64, deleteLocalImage } from './imageProcessor';

// Legal API
export { legalApi } from './legal';
export type { ChatRequest, ChatApiResponse, DocumentRequest, VoiceRequest, VoiceApiResponse } from './legal';
