import { OCRResult } from '../types';

/**
 * Calls the backend POST /ocr endpoint.
 * The Anthropic API key lives on the backend server — never in the app.
 */
export async function scanReceiptWithBackend(
  base64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OCRResult> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_URL in environment');
  }

  const response = await fetch(`${apiUrl}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, media_type: mediaType }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(error.detail ?? `OCR request failed: ${response.status}`);
  }

  const data = await response.json() as { result: OCRResult };
  return data.result;
}
