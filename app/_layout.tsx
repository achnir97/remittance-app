import '../global.css';
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../store/useAppStore';
import { i18n, normalizeLocale } from '../locales/i18n';
import NetInfo from '@react-native-community/netinfo';
import { retryPendingScans } from '../hooks/useOCR';
import { getPendingScans } from '../services/db';
import { ErrorBoundary } from '../components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'online',
    },
  },
});

export default function RootLayout() {
  const language = useAppStore((s) => s.language);
  const setPendingCount = useAppStore((s) => s.setPendingCount);

  useEffect(() => {
    i18n.locale = normalizeLocale(language);
  }, [language]);

  // Refresh pending count on mount
  useEffect(() => {
    getPendingScans()
      .then((rows) => setPendingCount(rows.length))
      .catch((err) => console.warn('[Layout] Failed to load pending scans:', err));
  }, []);

  // Retry pending scans when app comes to foreground with connectivity
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          await retryPendingScans();
          // Refresh pending count after retry
          const remaining = await getPendingScans().catch((err) => {
            console.warn('[Layout] Failed to refresh pending scans after retry:', err);
            return [];
          });
          setPendingCount(remaining.length);
          // Invalidate queries so lists refresh
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['spending'] });
        }
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
