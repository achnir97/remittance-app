import { getDb } from './connection';
import type { IncomeRow } from './types';

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

export async function getIncomeInRange(from: string, to: string): Promise<IncomeRow[]> {
  const db = await getDb();
  return db.getAllAsync<IncomeRow>(
    'SELECT * FROM income WHERE date >= ? AND date <= ? ORDER BY date DESC',
    from,
    to
  );
}
