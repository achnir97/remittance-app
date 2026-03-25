import { getDb } from './connection';
import type { SavingsGoalRow } from './types';

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
