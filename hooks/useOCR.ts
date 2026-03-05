import { useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { prepareImageForOCR, readImageAsBase64 } from '../services/imageProcessor';
import { scanReceiptWithBackend } from '../services/ocr';
import {
  insertTransactionFromOCR,
  updateTransactionStatus,
  getPendingScans,
} from '../services/db';
import { OCRResult } from '../types';

export type OCRStatus =
  | 'idle'
  | 'processing'
  | 'success'
  | 'error'
  | 'not_receipt'
  | 'queued';

export function useOCR() {
  const [status, setStatus] = useState<OCRStatus>('idle');
  const [result, setResult] = useState<OCRResult | null>(null);
  const [localPath, setLocalPath] = useState<string | null>(null);

  const scanImage = useCallback(async (uri: string) => {
    setStatus('processing');
    setResult(null);
    setLocalPath(null);

    try {
      const prepared = await prepareImageForOCR(uri);
      setLocalPath(prepared.localPath);

      const net = await NetInfo.fetch();

      if (!net.isConnected) {
        // Save with pending status for later retry
        await insertTransactionFromOCR(
          {
            type: 'other',
            date: new Date().toISOString().slice(0, 10),
            merchant: null,
            amount_krw: 0,
            category: 'Other',
          } as OCRResult,
          prepared.localPath,
          false
        );
        setStatus('queued');
        return;
      }

      const ocrResult = await _callWithRetry(prepared.base64, prepared.mediaType);

      if (ocrResult.error === 'not_a_receipt') {
        setStatus('not_receipt');
        return;
      }

      setResult(ocrResult);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setLocalPath(null);
  }, []);

  return { status, result, localPath, scanImage, reset };
}

// Exponential backoff: attempt 1 → 1s wait, attempt 2 → 2s wait, attempt 3 → throw
async function _callWithRetry(
  base64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  maxAttempts = 3
): Promise<OCRResult> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await scanReceiptWithBackend(base64, mediaType);
    } catch (e) {
      if (attempt === maxAttempts) throw e;
      await new Promise((r) =>
        setTimeout(r, Math.pow(2, attempt - 1) * 1000)
      );
    }
  }
  throw new Error('Max retries exceeded');
}

// Called from app/_layout.tsx when app comes to foreground with connectivity
export async function retryPendingScans(): Promise<void> {
  const pending = await getPendingScans();
  for (const scan of pending) {
    if (!scan.image_path) continue;
    try {
      const base64 = await readImageAsBase64(scan.image_path);
      const ocrResult = await _callWithRetry(base64, 'image/jpeg');
      if (ocrResult && !ocrResult.error) {
        await updateTransactionStatus(scan.id, 'confirmed', ocrResult);
      }
    } catch {
      // Leave as pending — try again next foreground
    }
  }
}
