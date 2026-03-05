import * as SQLite from 'expo-sqlite';
import { OCRResult, SpendingCategory } from '../types';

// ── Types ────────────────────────────────────────────────────────

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

// ── Singleton DB ────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('spending.db');
  await runMigrations(_db);
  return _db;
}

/** @deprecated Use getDb() async. Left for legacy compatibility. */
export async function initDb(): Promise<void> {
  await getDb();
}

// ── Schema SQL ──────────────────────────────────────────────────

const CREATE_V1_SQL = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version    INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    type         TEXT    NOT NULL,
    date         TEXT    NOT NULL,
    merchant     TEXT,
    amount_krw   INTEGER NOT NULL,
    category     TEXT    NOT NULL,
    raw_ocr_json TEXT,
    image_path   TEXT,
    status       TEXT    DEFAULT 'confirmed',
    notes        TEXT,
    created_at   TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS remittances (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id      INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    provider            TEXT,
    sent_krw            INTEGER,
    fee_krw             INTEGER,
    recipient_gets      REAL,
    recipient_currency  TEXT,
    exchange_rate       REAL
  );

  CREATE TABLE IF NOT EXISTS income (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT    NOT NULL,
    amount_krw  INTEGER NOT NULL,
    source      TEXT,
    notes       TEXT,
    created_at  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    target_krw INTEGER NOT NULL,
    period     TEXT    NOT NULL,
    created_at TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tx_date     ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
  CREATE INDEX IF NOT EXISTS idx_tx_status   ON transactions(status);
`;

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const versionRow = await db
    .getFirstAsync<{ version: number }>(
      'SELECT MAX(version) as version FROM schema_version'
    )
    .catch(() => null);

  const current = versionRow?.version ?? 0;

  if (current < 1) {
    await db.execAsync(CREATE_V1_SQL);
    await db.runAsync(
      'INSERT INTO schema_version VALUES (1, ?)',
      new Date().toISOString()
    );
    return;
  }

  // Migration 2: add columns/tables for apps upgrading from old schema
  if (current < 2) {
    // Add status column if not present (old schema had confirmed INTEGER)
    await db
      .execAsync(
        `ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'confirmed'`
      )
      .catch(() => {});

    // Populate status from old confirmed column (if it existed)
    await db
      .execAsync(
        `UPDATE transactions SET status = CASE WHEN confirmed = 1 THEN 'confirmed' ELSE 'pending' END WHERE status IS NULL`
      )
      .catch(() => {});

    // Add income and savings_goals tables if missing
    await db
      .execAsync(`
        CREATE TABLE IF NOT EXISTS income (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          date        TEXT    NOT NULL,
          amount_krw  INTEGER NOT NULL,
          source      TEXT,
          notes       TEXT,
          created_at  TEXT    NOT NULL
        );
        CREATE TABLE IF NOT EXISTS savings_goals (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT    NOT NULL,
          target_krw INTEGER NOT NULL,
          period     TEXT    NOT NULL,
          created_at TEXT    NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
      `)
      .catch(() => {});

    await db
      .runAsync(
        'INSERT OR REPLACE INTO schema_version VALUES (2, ?)',
        new Date().toISOString()
      )
      .catch(() => {});
  }
}

// ── Transactions ─────────────────────────────────────────────────

export async function insertTransactionFromOCR(
  ocr: OCRResult,
  imagePath: string | null,
  confirmed: boolean
): Promise<number> {
  if (ocr.error === 'not_a_receipt') throw new Error('not_a_receipt');

  const db = await getDb();
  const now = new Date().toISOString();
  const date = ocr.date ?? now.slice(0, 10);
  const status: TransactionStatus = confirmed ? 'confirmed' : 'pending';

  let txId = 0;

  await db.withTransactionAsync(async () => {
    const r = await db.runAsync(
      `INSERT INTO transactions
        (type, date, merchant, amount_krw, category, raw_ocr_json, image_path, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ocr.type,
      date,
      ocr.merchant ?? null,
      ocr.amount_krw ?? 0,
      ocr.category,
      JSON.stringify(ocr),
      imagePath,
      status,
      now
    );
    txId = r.lastInsertRowId;

    if (ocr.type === 'remittance' && ocr.remittance) {
      const rem = ocr.remittance;
      await db.runAsync(
        `INSERT INTO remittances
          (transaction_id, provider, sent_krw, fee_krw, recipient_gets, recipient_currency, exchange_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        txId,
        rem.provider ?? null,
        rem.sent_krw ?? null,
        rem.fee_krw ?? null,
        rem.recipient_gets ?? null,
        rem.recipient_currency ?? null,
        rem.exchange_rate ?? null
      );
    }
  });

  return txId;
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function updateTransactionCategory(
  id: number,
  category: SpendingCategory
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE transactions SET category = ? WHERE id = ?',
    category,
    id
  );
}

export async function updateTransactionStatus(
  id: number,
  status: TransactionStatus,
  ocr?: Partial<OCRResult>
): Promise<void> {
  const db = await getDb();
  if (ocr) {
    await db.runAsync(
      'UPDATE transactions SET status=?, type=?, merchant=?, amount_krw=?, category=? WHERE id=?',
      status,
      ocr.type ?? 'other',
      ocr.merchant ?? null,
      ocr.amount_krw ?? 0,
      ocr.category ?? 'Other',
      id
    );
  } else {
    await db.runAsync(
      'UPDATE transactions SET status = ? WHERE id = ?',
      status,
      id
    );
  }
}

export async function getRecentTransactions(
  limit = 20
): Promise<TransactionRow[]> {
  const db = await getDb();
  return db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions
     WHERE status = 'confirmed'
     ORDER BY date DESC, created_at DESC
     LIMIT ?`,
    limit
  );
}

export async function getTransactionsInRange(
  from: string,
  to: string
): Promise<TransactionRow[]> {
  const db = await getDb();
  return db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions
     WHERE date BETWEEN ? AND ? AND status = 'confirmed'
     ORDER BY date DESC, created_at DESC`,
    from,
    to
  );
}

export async function getPendingScans(): Promise<TransactionRow[]> {
  const db = await getDb();
  return db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions WHERE status = 'pending' ORDER BY created_at ASC`
  );
}

// ── Aggregates ───────────────────────────────────────────────────

export async function getSpendingByCategory(
  from: string,
  to: string
): Promise<CategoryTotal[]> {
  const db = await getDb();
  return db.getAllAsync<CategoryTotal>(
    `SELECT category, SUM(amount_krw) as total, COUNT(*) as count
     FROM transactions
     WHERE date BETWEEN ? AND ? AND status = 'confirmed'
     GROUP BY category
     ORDER BY total DESC`,
    from,
    to
  );
}

export async function getDailyTotals(
  from: string,
  to: string
): Promise<DailyTotal[]> {
  const db = await getDb();
  return db.getAllAsync<DailyTotal>(
    `SELECT date, SUM(amount_krw) as total
     FROM transactions
     WHERE date BETWEEN ? AND ? AND status = 'confirmed'
     GROUP BY date
     ORDER BY date ASC`,
    from,
    to
  );
}

export async function getWeeklyTotals(
  from: string,
  to: string
): Promise<WeeklyTotal[]> {
  const db = await getDb();
  return db.getAllAsync<WeeklyTotal>(
    `SELECT strftime('%Y-W%W', date) as week, SUM(amount_krw) as total
     FROM transactions
     WHERE date BETWEEN ? AND ? AND status = 'confirmed'
     GROUP BY week
     ORDER BY week ASC`,
    from,
    to
  );
}

export async function getMonthlyTotals(
  from: string,
  to: string
): Promise<MonthlyTotal[]> {
  const db = await getDb();
  return db.getAllAsync<MonthlyTotal>(
    `SELECT strftime('%Y-%m', date) as month, SUM(amount_krw) as total
     FROM transactions
     WHERE date BETWEEN ? AND ? AND status = 'confirmed'
     GROUP BY month
     ORDER BY month ASC`,
    from,
    to
  );
}

export async function getRemittancesInRange(
  from: string,
  to: string
): Promise<(TransactionRow & RemittanceRow)[]> {
  const db = await getDb();
  return db.getAllAsync<TransactionRow & RemittanceRow>(
    `SELECT t.*, r.provider, r.sent_krw, r.fee_krw,
            r.recipient_gets, r.recipient_currency, r.exchange_rate
     FROM transactions t
     LEFT JOIN remittances r ON r.transaction_id = t.id
     WHERE t.type = 'remittance'
       AND t.date BETWEEN ? AND ?
       AND t.status = 'confirmed'
     ORDER BY t.date DESC`,
    from,
    to
  );
}

// ── Income ───────────────────────────────────────────────────────

export async function insertIncome(
  date: string,
  amount_krw: number,
  source?: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO income (date, amount_krw, source, created_at) VALUES (?, ?, ?, ?)',
    date,
    amount_krw,
    source ?? null,
    new Date().toISOString()
  );
}

export async function getIncomeInRange(
  from: string,
  to: string
): Promise<IncomeRow[]> {
  const db = await getDb();
  return db.getAllAsync<IncomeRow>(
    'SELECT * FROM income WHERE date >= ? AND date <= ? ORDER BY date DESC',
    from,
    to
  );
}

// ── Savings Goals ─────────────────────────────────────────────────

export async function getSavingsGoal(): Promise<SavingsGoalRow | null> {
  const db = await getDb();
  return db.getFirstAsync<SavingsGoalRow>(
    'SELECT * FROM savings_goals ORDER BY created_at DESC LIMIT 1'
  );
}

export async function upsertSavingsGoal(
  name: string,
  target_krw: number,
  period: 'monthly' | 'weekly'
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO savings_goals (name, target_krw, period, created_at) VALUES (?, ?, ?, ?)',
    name,
    target_krw,
    period,
    new Date().toISOString()
  );
}
