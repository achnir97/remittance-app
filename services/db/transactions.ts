import type { OCRResult, SpendingCategory } from '../../types';
import { sanitizeText } from '../../utils/validators';
import { getDb } from './connection';
import type {
  CategoryTotal,
  DailyTotal,
  MonthlyTotal,
  RemittanceRow,
  TransactionRow,
  TransactionStatus,
  WeeklyTotal,
} from './types';

// ── Mutations ─────────────────────────────────────────────────────

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
      ocr.merchant ? sanitizeText(ocr.merchant) : null,
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
  await db.runAsync('UPDATE transactions SET category = ? WHERE id = ?', category, id);
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
    await db.runAsync('UPDATE transactions SET status = ? WHERE id = ?', status, id);
  }
}

// ── Queries ───────────────────────────────────────────────────────

export async function getRecentTransactions(limit = 20): Promise<TransactionRow[]> {
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

// ── Aggregate Queries ─────────────────────────────────────────────

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

export async function getDailyTotals(from: string, to: string): Promise<DailyTotal[]> {
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

export async function getWeeklyTotals(from: string, to: string): Promise<WeeklyTotal[]> {
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

export async function getMonthlyTotals(from: string, to: string): Promise<MonthlyTotal[]> {
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
