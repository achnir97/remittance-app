import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { legalApi } from '../services/legal';
import { LegalResponse } from '../types';
import { useAppStore } from '../store/useAppStore';

type DocumentStatus = 'idle' | 'processing' | 'done' | 'error';

export function useLegalDocument() {
  const language = useAppStore((s) => s.language);
  const [status, setStatus] = useState<DocumentStatus>('idle');
  const [result, setResult] = useState<LegalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (imageUri: string, question: string) => {
    setStatus('processing');
    setError(null);
    setResult(null);

    try {
      // Convert local image URI to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Detect media type from URI
      const ext = imageUri.split('.').pop()?.toLowerCase();
      const mediaType =
        ext === 'png' ? 'image/png' :
        ext === 'webp' ? 'image/webp' :
        'image/jpeg';

      const data = await legalApi.analyzeDocument({
        image: base64,
        media_type: mediaType,
        question: question || 'What does this document say? Are there any clauses I should be concerned about?',
        language,
      });

      setResult(data.response);
      setStatus('done');
    } catch (err) {
      console.warn('[useLegalDocument] Analysis failed:', err);
      setError('Could not analyze the document. Please try again.');
      setStatus('error');
    }
  }, [language]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, analyze, reset };
}
