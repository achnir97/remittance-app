import { renderHook, act } from '@testing-library/react-hooks';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('../../services/imageProcessor', () => ({
  prepareImageForOCR: jest.fn(),
  readImageAsBase64: jest.fn(),
}));

jest.mock('../../services/ocr', () => ({
  scanReceiptWithBackend: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  insertTransactionFromOCR: jest.fn(),
  updateTransactionStatus: jest.fn(),
  getPendingScans: jest.fn(),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import NetInfo from '@react-native-community/netinfo';
import { prepareImageForOCR, readImageAsBase64 } from '../../services/imageProcessor';
import { scanReceiptWithBackend } from '../../services/ocr';
import {
  insertTransactionFromOCR,
  updateTransactionStatus,
  getPendingScans,
} from '../../services/db';
import { useOCR, retryPendingScans } from '../../hooks/useOCR';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockNetInfo = NetInfo.fetch as jest.Mock;
const mockPrepare = prepareImageForOCR as jest.Mock;
const mockScanBackend = scanReceiptWithBackend as jest.Mock;
const mockInsert = insertTransactionFromOCR as jest.Mock;
const mockUpdateStatus = updateTransactionStatus as jest.Mock;
const mockGetPending = getPendingScans as jest.Mock;
const mockReadBase64 = readImageAsBase64 as jest.Mock;

const PREPARED = {
  localPath: '/tmp/receipt.jpg',
  base64: 'base64string',
  mediaType: 'image/jpeg' as const,
};

const OCR_RESULT = {
  type: 'food',
  date: '2024-01-15',
  merchant: 'GS25',
  amount_krw: 3500,
  category: 'Food',
};

// ── useOCR hook tests ─────────────────────────────────────────────────────────

describe('useOCR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockPrepare.mockResolvedValue(PREPARED);
    mockInsert.mockResolvedValue(undefined);
    mockUpdateStatus.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useOCR());
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.localPath).toBeNull();
  });

  it('transitions to processing then success on successful online scan', async () => {
    mockNetInfo.mockResolvedValue({ isConnected: true });
    mockScanBackend.mockResolvedValue(OCR_RESULT);

    const { result } = renderHook(() => useOCR());

    await act(async () => {
      await result.current.scanImage('file:///test.jpg');
    });

    expect(result.current.status).toBe('success');
    expect(result.current.result).toEqual(OCR_RESULT);
    expect(result.current.localPath).toBe(PREPARED.localPath);
  });

  it('sets status to queued when offline', async () => {
    mockNetInfo.mockResolvedValue({ isConnected: false });

    const { result } = renderHook(() => useOCR());

    await act(async () => {
      await result.current.scanImage('file:///test.jpg');
    });

    expect(result.current.status).toBe('queued');
    expect(mockInsert).toHaveBeenCalledTimes(1);
    // Result should not be set when queued
    expect(result.current.result).toBeNull();
  });

  it('sets status to not_receipt when backend returns error: not_a_receipt', async () => {
    mockNetInfo.mockResolvedValue({ isConnected: true });
    mockScanBackend.mockResolvedValue({ error: 'not_a_receipt' });

    const { result } = renderHook(() => useOCR());

    await act(async () => {
      await result.current.scanImage('file:///test.jpg');
    });

    expect(result.current.status).toBe('not_receipt');
    expect(result.current.result).toBeNull();
  });

  it('sets status to error when scan throws', async () => {
    mockNetInfo.mockResolvedValue({ isConnected: true });
    mockScanBackend.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useOCR());

    await act(async () => {
      // Fast-forward through retry delays
      const scanPromise = result.current.scanImage('file:///test.jpg');
      jest.runAllTimers();
      await scanPromise;
    });

    expect(result.current.status).toBe('error');
  });

  it('retries up to maxAttempts before failing', async () => {
    mockNetInfo.mockResolvedValue({ isConnected: true });
    // Fail twice, succeed on 3rd attempt
    mockScanBackend
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce(OCR_RESULT);

    const { result } = renderHook(() => useOCR());

    await act(async () => {
      const scanPromise = result.current.scanImage('file:///test.jpg');
      jest.runAllTimers();
      await scanPromise;
    });

    expect(mockScanBackend).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe('success');
  });

  it('reset() returns hook to idle state', async () => {
    mockNetInfo.mockResolvedValue({ isConnected: true });
    mockScanBackend.mockResolvedValue(OCR_RESULT);

    const { result } = renderHook(() => useOCR());

    await act(async () => {
      await result.current.scanImage('file:///test.jpg');
    });

    expect(result.current.status).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.localPath).toBeNull();
  });
});

// ── retryPendingScans tests ───────────────────────────────────────────────────

describe('retryPendingScans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does nothing when no pending scans', async () => {
    mockGetPending.mockResolvedValue([]);

    await retryPendingScans();

    expect(mockReadBase64).not.toHaveBeenCalled();
    expect(mockScanBackend).not.toHaveBeenCalled();
  });

  it('skips entries without image_path', async () => {
    mockGetPending.mockResolvedValue([{ id: '1', image_path: null }]);

    await retryPendingScans();

    expect(mockReadBase64).not.toHaveBeenCalled();
  });

  it('updates transaction status when retry succeeds', async () => {
    mockGetPending.mockResolvedValue([{ id: '42', image_path: '/tmp/receipt.jpg' }]);
    mockReadBase64.mockResolvedValue('base64data');
    mockScanBackend.mockResolvedValue(OCR_RESULT);
    mockUpdateStatus.mockResolvedValue(undefined);

    await act(async () => {
      const p = retryPendingScans();
      jest.runAllTimers();
      await p;
    });

    expect(mockUpdateStatus).toHaveBeenCalledWith('42', 'confirmed', OCR_RESULT);
  });

  it('leaves transaction as pending when retry fails', async () => {
    mockGetPending.mockResolvedValue([{ id: '7', image_path: '/tmp/receipt.jpg' }]);
    mockReadBase64.mockResolvedValue('base64data');
    mockScanBackend.mockRejectedValue(new Error('offline'));

    await act(async () => {
      const p = retryPendingScans();
      jest.runAllTimers();
      await p;
    });

    // updateStatus should NOT be called — leave as pending
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('does not update status when OCR returns error field', async () => {
    mockGetPending.mockResolvedValue([{ id: '9', image_path: '/tmp/receipt.jpg' }]);
    mockReadBase64.mockResolvedValue('base64data');
    mockScanBackend.mockResolvedValue({ error: 'not_a_receipt' });

    await act(async () => {
      const p = retryPendingScans();
      jest.runAllTimers();
      await p;
    });

    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('processes multiple pending scans independently', async () => {
    mockGetPending.mockResolvedValue([
      { id: '1', image_path: '/tmp/r1.jpg' },
      { id: '2', image_path: '/tmp/r2.jpg' },
    ]);
    mockReadBase64.mockResolvedValue('base64data');
    mockScanBackend.mockResolvedValue(OCR_RESULT);
    mockUpdateStatus.mockResolvedValue(undefined);

    await act(async () => {
      const p = retryPendingScans();
      jest.runAllTimers();
      await p;
    });

    expect(mockUpdateStatus).toHaveBeenCalledTimes(2);
    expect(mockUpdateStatus).toHaveBeenCalledWith('1', 'confirmed', OCR_RESULT);
    expect(mockUpdateStatus).toHaveBeenCalledWith('2', 'confirmed', OCR_RESULT);
  });
});
