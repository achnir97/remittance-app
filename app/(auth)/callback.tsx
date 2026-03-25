import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { theme } from '../../constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleDeepLink();
  }, []);

  async function handleDeepLink() {
    try {
      const url = await Linking.getInitialURL();
      if (!url) {
        // Opened without URL — shouldn't happen, go to login
        router.replace('/(auth)/login');
        return;
      }

      await exchangeTokens(url);
    } catch (err) {
      console.warn('[AuthCallback] Error:', err);
      setError('Something went wrong. Please try again.');
    }
  }

  async function exchangeTokens(url: string) {
    const parsed = Linking.parse(url);

    // ── PKCE flow: Supabase sends ?code=xxxx ──────────────────────
    const code = parsed.queryParams?.code;
    if (code) {
      const { error: err } = await supabase.auth.exchangeCodeForSession(String(code));
      if (err) {
        setError(err.message);
      }
      // onAuthStateChange in _layout.tsx handles the redirect on success
      return;
    }

    // ── Implicit flow: tokens in the URL hash #access_token=...&refresh_token=... ──
    const hash = url.split('#')[1];
    if (hash) {
      const params = Object.fromEntries(new URLSearchParams(hash));
      if (params.access_token && params.refresh_token) {
        const { error: err } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (err) setError(err.message);
        return;
      }
    }

    // Nothing usable in the URL
    setError('Invalid confirmation link. Please request a new one.');
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>✕</Text>
        <Text style={styles.errorTitle}>Confirmation failed</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={styles.loadingText}>Confirming your email…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  errorIcon: {
    fontSize: 40,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  errorBody: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
  },
  btnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
});
