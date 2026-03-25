import '../global.css';
import React, { useEffect } from 'react';
import { AppState, View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { i18n, normalizeLocale } from '../locales/i18n';
import NetInfo from '@react-native-community/netinfo';
import { retryPendingScans } from '../hooks/useOCR';
import { getPendingScans } from '../services/db';
import { cleanupOldReceiptImages } from '../services/imageProcessor';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { supabase } from '../lib/supabase';
import { theme } from '../constants/theme';
import { initSentry, captureError, setUserContext, clearUserContext } from '../lib/sentry';

// Initialise Sentry as early as possible (before any component renders)
initSentry();

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
  const userType = useAppStore((s) => s.userType);
  const { setAuth, clearAuth, setInitialized, initialized, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    i18n.locale = normalizeLocale(language);
  }, [language]);

  // Catch unhandled promise rejections that ErrorBoundary cannot catch
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      captureError(event.reason, { source: 'unhandledRejection' });
    };
    // @ts-expect-error — RN supports this on newer Hermes but TS types lag
    global.addEventListener?.('unhandledrejection', handler);
    return () => {
      // @ts-expect-error
      global.removeEventListener?.('unhandledrejection', handler);
    };
  }, []);

  // Bootstrap Supabase session on mount, then subscribe to auth changes
  useEffect(() => {
    // Load existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuth(session.user, session);
        setUserContext(session.user.id, session.user.email ?? undefined);
      } else {
        clearAuth();
      }
      setInitialized();
    });

    // Listen to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setAuth(session.user, session);
          setUserContext(session.user.id, session.user.email ?? undefined);
        } else {
          clearAuth();
          clearUserContext();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Protected routing: redirect based on auth + onboarding state
  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!user) {
      // Not logged in — send to login unless already there
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Just logged in — check if onboarding is complete
      router.replace(userType ? '/(tabs)/home' : '/(onboarding)/user-type');
    } else if (user && !userType && !inOnboarding) {
      // Logged in but no user type selected (e.g. existing user after update)
      router.replace('/(onboarding)/user-type');
    } else if (user && userType && inOnboarding) {
      // Completed onboarding — go to home
      router.replace('/(tabs)/home');
    }
  }, [user, initialized, userType, segments]);

  // Refresh pending scan count on mount + clean up old receipt images
  useEffect(() => {
    getPendingScans()
      .then((rows) => setPendingCount(rows.length))
      .catch((err) => console.warn('[Layout] Failed to load pending scans:', err));

    cleanupOldReceiptImages(30).catch((err) =>
      console.warn('[Layout] Receipt cleanup failed:', err)
    );
  }, []);

  // Handle deep links when app is already open (e.g. email confirmation while app is in background)
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      // Validate the URL originates from our own app scheme before processing.
      // A simple string includes() check is insufficient — an attacker-controlled
      // URL like "https://evil.com/auth/callback?code=..." would pass it.
      if (!url.startsWith('bridge://') && !url.startsWith('exp://')) return;
      if (!url.includes('auth/callback')) return;

      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code;
      if (code && typeof code === 'string' && code.length > 0) {
        await supabase.auth.exchangeCodeForSession(code).catch((err) =>
          console.warn('[Layout] Deep link auth exchange failed:', err)
        );
      }
    });
    return () => sub.remove();
  }, []);

  // Retry pending scans when app comes to foreground with connectivity
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          await retryPendingScans();
          const remaining = await getPendingScans().catch((err) => {
            console.warn('[Layout] Failed to refresh pending scans after retry:', err);
            return [];
          });
          setPendingCount(remaining.length);
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['spending'] });
        }
      }
    });
    return () => sub.remove();
  }, []);

  // Show a splash while auth state is loading
  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#0C1220" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
