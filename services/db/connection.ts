import * as SQLite from 'expo-sqlite';

// ── Singleton DB ──────────────────────────────────────────────────

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

// ── Schema SQL ────────────────────────────────────────────────────

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
    .getFirstAsync<{ version: number }>('SELECT MAX(version) as version FROM schema_version')
    .catch(() => null);

  const current = versionRow?.version ?? 0;

  if (current < 1) {
    await db.execAsync(CREATE_V1_SQL);
    await db.runAsync('INSERT INTO schema_version VALUES (1, ?)', new Date().toISOString());
    return;
  }

  if (current < 2) {
    await db
      .execAsync(`ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'confirmed'`)
      .catch((err) => console.warn('[DB] Migration v2 add status column (likely exists):', err));

    await db
      .execAsync(
        `UPDATE transactions SET status = CASE WHEN confirmed = 1 THEN 'confirmed' ELSE 'pending' END WHERE status IS NULL`
      )
      .catch((err) => console.warn('[DB] Migration v2 populate status:', err));

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
      .catch((err) => console.warn('[DB] Migration v2 create tables (likely exist):', err));

    await db
      .runAsync('INSERT OR REPLACE INTO schema_version VALUES (2, ?)', new Date().toISOString())
      .catch((err) => console.warn('[DB] Migration v2 version insert failed:', err));
  }
}
