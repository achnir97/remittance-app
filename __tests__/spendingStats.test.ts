import { useSpendingStats } from '../hooks/useSpendingStats';
import { renderHook } from '@testing-library/react-hooks';
import { TransactionRow } from '../services/db';

const TX: TransactionRow[] = [
  {
    id: 1, type: 'remittance', date: '2026-03-04', amount_krw: 1002500,
    category: 'Remittance', status: 'confirmed', merchant: 'Hanpass',
    raw_ocr_json: JSON.stringify({ remittance: { fee_krw: 2500 } }),
    image_path: null, notes: null, created_at: '',
  },
  {
    id: 2, type: 'store', date: '2026-03-03', amount_krw: 8500,
    category: 'Food & Groceries', status: 'confirmed', merchant: 'GS25',
    raw_ocr_json: null, image_path: null, notes: null, created_at: '',
  },
  {
    id: 3, type: 'atm', date: '2026-03-01', amount_krw: 300000,
    category: 'Cash Withdrawal', status: 'confirmed', merchant: null,
    raw_ocr_json: null, image_path: null, notes: null, created_at: '',
  },
  {
    id: 4, type: 'store', date: '2026-02-15', amount_krw: 15000,
    category: 'Transport', status: 'confirmed', merchant: null,
    raw_ocr_json: null, image_path: null, notes: null, created_at: '',
  },
  {
    id: 5, type: 'store', date: '2026-03-05', amount_krw: 50000,
    category: 'Other', status: 'pending', merchant: null,
    raw_ocr_json: null, image_path: null, notes: null, created_at: '',
  },
];

test('sums only transactions within date range', () => {
  const { result } = renderHook(() =>
    useSpendingStats(TX, '2026-03-01', '2026-03-31')
  );
  // 1002500 + 8500 + 300000 = 1311000 (excludes Feb + pending)
  expect(result.current.totalSpent).toBe(1311000);
});

test('excludes pending transactions', () => {
  const { result } = renderHook(() =>
    useSpendingStats(TX, '2026-03-01', '2026-03-31')
  );
  expect(result.current.transactionCount).toBe(3);
});

test('returns 0 not error for empty range', () => {
  const { result } = renderHook(() =>
    useSpendingStats([], '2026-03-01', '2026-03-31')
  );
  expect(result.current.totalSpent).toBe(0);
  expect(result.current.transactionCount).toBe(0);
});

test('calculates sentHome correctly', () => {
  const { result } = renderHook(() =>
    useSpendingStats(TX, '2026-03-01', '2026-03-31')
  );
  expect(result.current.sentHome).toBe(1002500);
  expect(result.current.sentHomeCount).toBe(1);
});

test('handles single day range', () => {
  const { result } = renderHook(() =>
    useSpendingStats(TX, '2026-03-04', '2026-03-04')
  );
  expect(result.current.totalSpent).toBe(1002500);
});

test('groups by category correctly', () => {
  const { result } = renderHook(() =>
    useSpendingStats(TX, '2026-03-01', '2026-03-31')
  );
  expect(result.current.byCategory['Remittance']).toBe(1002500);
  expect(result.current.byCategory['Food & Groceries']).toBe(8500);
});

test('topCategory is highest spend category', () => {
  const { result } = renderHook(() =>
    useSpendingStats(TX, '2026-03-01', '2026-03-31')
  );
  expect(result.current.topCategory).toBe('Remittance');
});
