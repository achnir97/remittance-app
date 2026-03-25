import type { OCRResult } from '../../types';

// expo-sqlite is mocked globally in jest.setup.js
// We re-require it fresh after jest.resetModules() in beforeEach

function makeMockDb() {
  return {
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    // First call returns version 2 so runMigrations() is a no-op (no extra runAsync calls).
    // Subsequent calls return null (the default for data queries).
    getFirstAsync: jest.fn()
      .mockResolvedValueOnce({ version: 2 })
      .mockResolvedValue(null),
    withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => { await fn(); }),
  };
}

let mockDb: ReturnType<typeof makeMockDb>;

beforeEach(() => {
  // Reset module registry so each test gets a fresh db singleton
  jest.resetModules();
  mockDb = makeMockDb();
  // Re-require expo-sqlite after reset to get the fresh mock instance
  const SQLite = require('expo-sqlite');
  SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
});

describe('db service', () => {
  describe('getDb', () => {
    it('opens the database', async () => {
      const { getDb } = require('../../services/db');
      await getDb();
      const SQLite = require('expo-sqlite');
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('spending.db');
    });

    it('returns the same instance on subsequent calls (singleton)', async () => {
      const { getDb } = require('../../services/db');
      const db1 = await getDb();
      const db2 = await getDb();
      expect(db1).toBe(db2);
      const SQLite = require('expo-sqlite');
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('insertTransactionFromOCR', () => {
    const baseOCR: OCRResult = {
      type: 'store',
      date: '2026-03-01',
      merchant: 'CU Convenience',
      amount_krw: 15000,
      category: 'Food & Groceries',
    };

    it('inserts a confirmed transaction', async () => {
      const { insertTransactionFromOCR } = require('../../services/db');
      await insertTransactionFromOCR(baseOCR, null, true);

      expect(mockDb.withTransactionAsync).toHaveBeenCalled();
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        'store', '2026-03-01', 'CU Convenience', 15000, 'Food & Groceries',
        expect.any(String), null, 'confirmed', expect.any(String)
      );
    });

    it('inserts a pending transaction', async () => {
      const { insertTransactionFromOCR } = require('../../services/db');
      await insertTransactionFromOCR(baseOCR, '/path/img.jpg', false);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        'store', '2026-03-01', 'CU Convenience', 15000, 'Food & Groceries',
        expect.any(String), '/path/img.jpg', 'pending', expect.any(String)
      );
    });

    it('throws when OCR result is not_a_receipt', async () => {
      const { insertTransactionFromOCR } = require('../../services/db');
      const badOCR: OCRResult = { ...baseOCR, error: 'not_a_receipt' };
      await expect(insertTransactionFromOCR(badOCR, null, true)).rejects.toThrow('not_a_receipt');
    });

    it('inserts remittance row for remittance type', async () => {
      const { insertTransactionFromOCR } = require('../../services/db');
      const remOCR: OCRResult = {
        type: 'remittance',
        date: '2026-03-01',
        merchant: 'SentBe',
        amount_krw: 500000,
        category: 'Remittance',
        remittance: {
          provider: 'SentBe',
          sent_krw: 490000,
          fee_krw: 10000,
          recipient_gets: 19500,
          recipient_currency: 'PHP',
          exchange_rate: 0.039,
        },
      };
      await insertTransactionFromOCR(remOCR, null, true);
      // runAsync called twice: once for tx, once for remittance
      expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO remittances'),
        expect.any(Number), 'SentBe', 490000, 10000, 19500, 'PHP', 0.039
      );
    });
  });

  describe('deleteTransaction', () => {
    it('deletes by id', async () => {
      const { deleteTransaction } = require('../../services/db');
      await deleteTransaction(42);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM transactions WHERE id = ?', 42
      );
    });
  });

  describe('updateTransactionCategory', () => {
    it('updates category for a given id', async () => {
      const { updateTransactionCategory } = require('../../services/db');
      await updateTransactionCategory(5, 'Transport');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE transactions SET category = ? WHERE id = ?', 'Transport', 5
      );
    });
  });

  describe('updateTransactionStatus', () => {
    it('updates status only', async () => {
      const { updateTransactionStatus } = require('../../services/db');
      await updateTransactionStatus(3, 'confirmed');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE transactions SET status = ? WHERE id = ?', 'confirmed', 3
      );
    });

    it('updates status + OCR fields together', async () => {
      const { updateTransactionStatus } = require('../../services/db');
      await updateTransactionStatus(3, 'confirmed', {
        type: 'store', merchant: 'GS25', amount_krw: 8000, category: 'Food & Groceries',
      });
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE transactions SET status=?'),
        'confirmed', 'store', 'GS25', 8000, 'Food & Groceries', 3
      );
    });
  });

  describe('getRecentTransactions', () => {
    it('queries confirmed transactions ordered by date', async () => {
      const { getRecentTransactions } = require('../../services/db');
      await getRecentTransactions(10);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'confirmed'"), 10
      );
    });

    it('defaults limit to 20', async () => {
      const { getRecentTransactions } = require('../../services/db');
      await getRecentTransactions();
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'), 20
      );
    });
  });

  describe('getPendingScans', () => {
    it('queries for pending status', async () => {
      const { getPendingScans } = require('../../services/db');
      await getPendingScans();
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'pending'")
      );
    });
  });

  describe('getSpendingByCategory', () => {
    it('queries with from/to date range', async () => {
      const { getSpendingByCategory } = require('../../services/db');
      await getSpendingByCategory('2026-01-01', '2026-01-31');
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY category'), '2026-01-01', '2026-01-31'
      );
    });
  });

  describe('insertIncome', () => {
    it('inserts income record', async () => {
      const { insertIncome } = require('../../services/db');
      await insertIncome('2026-03-01', 2500000, 'Employer');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO income (date, amount_krw, source, created_at) VALUES (?, ?, ?, ?)',
        '2026-03-01', 2500000, 'Employer', expect.any(String)
      );
    });

    it('uses null when source is omitted', async () => {
      const { insertIncome } = require('../../services/db');
      await insertIncome('2026-03-01', 2500000);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String), '2026-03-01', 2500000, null, expect.any(String)
      );
    });
  });

  describe('getSavingsGoal', () => {
    it('returns null when no goal exists', async () => {
      const { getSavingsGoal } = require('../../services/db');
      const result = await getSavingsGoal();
      expect(result).toBeNull();
    });

    it('returns goal row when one exists', async () => {
      const goalRow = { id: 1, name: 'Emergency Fund', target_krw: 1000000, period: 'monthly' };
      const { getSavingsGoal } = require('../../services/db');
      // Queue goalRow AFTER migration mock (version 2) is already set in makeMockDb.
      // When getSavingsGoal() runs: getFirstAsync call 1 = version 2 (migration no-op),
      // call 2 = goalRow (actual query).
      mockDb.getFirstAsync.mockResolvedValueOnce(goalRow);
      const result = await getSavingsGoal();
      expect(result).toEqual(goalRow);
    });
  });

  describe('upsertSavingsGoal', () => {
    it('inserts a new savings goal', async () => {
      const { upsertSavingsGoal } = require('../../services/db');
      await upsertSavingsGoal('Emergency Fund', 1000000, 'monthly');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO savings_goals (name, target_krw, period, created_at) VALUES (?, ?, ?, ?)',
        'Emergency Fund', 1000000, 'monthly', expect.any(String)
      );
    });
  });
});
