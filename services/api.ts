import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { RatesResponse, HistoryResponse, Corridor, ScanReceiptResponse } from '../types';
import { supabase } from '../lib/supabase';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

// React Native FormData file shape — not covered by standard TS types
interface RNFile {
  uri: string;
  name: string;
  type: string;
}

export const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 12000,
});

// Attach Supabase JWT to every request if a session exists
client.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Centralized error logging: distinguishes server errors from network failures
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.warn('[API] Server error:', error.response.status, error.config?.url);
    } else {
      console.warn('[API] Network error:', error.message, error.config?.url);
    }
    return Promise.reject(error);
  }
);

export const api = {
  getRates: async (
    from: string,
    to: string,
    amount: number
  ): Promise<RatesResponse> => {
    const res = await client.get<RatesResponse>('/rates', {
      params: { from, to, amount },
    });
    return res.data;
  },

  getHistory: async (
    from: string,
    to: string,
    days: number
  ): Promise<HistoryResponse> => {
    const res = await client.get<HistoryResponse>('/rates/history', {
      params: { from, to, days },
    });
    return res.data;
  },

  getCorridors: async (): Promise<Corridor[]> => {
    const res = await client.get<Corridor[]>('/corridors');
    return res.data;
  },

  scanReceipt: async (imageUri: string): Promise<ScanReceiptResponse> => {
    // Validate the URI is a local file (never a remote URL or data: URI)
    if (!imageUri.startsWith('file://') && !imageUri.startsWith('content://')) {
      throw new Error('[API] scanReceipt: imageUri must be a local file:// or content:// URI');
    }

    // Enforce size limit before upload to prevent sending huge files
    const info = await FileSystem.getInfoAsync(imageUri);
    if (info.exists && info.size !== undefined && info.size > MAX_IMAGE_BYTES) {
      throw new Error(`[API] scanReceipt: image exceeds ${MAX_IMAGE_BYTES / 1024 / 1024} MB limit`);
    }

    const form = new FormData();
    const file: RNFile = { uri: imageUri, name: 'receipt.jpg', type: 'image/jpeg' };
    // React Native's FormData.append accepts { uri, name, type } but TS types only cover web Blob.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (form as any).append('image', file);

    const res = await client.post<ScanReceiptResponse>('/expenses/scan', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
