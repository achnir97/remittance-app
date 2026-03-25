import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { theme } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: Linking.createURL('auth/callback') }
    );
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setSent(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {sent ? (
            // Success state
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="mail-outline" size={40} color={theme.colors.success} />
              </View>
              <Text style={styles.heading}>Check your email</Text>
              <Text style={styles.successBody}>
                We sent a password reset link to{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
              <Text style={styles.successHint}>
                Check your spam folder if you don't see it within a minute.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Form state
            <>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={28} color={theme.colors.primary} />
              </View>

              <Text style={styles.heading}>Forgot password?</Text>
              <Text style={styles.subheading}>
                Enter your email and we'll send you a reset link.
              </Text>

              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  backBtn: {
    marginBottom: theme.spacing.lg,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  heading: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subheading: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  form: {
    gap: theme.spacing.md,
  },
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  input: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  footerLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  successBody: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  emailHighlight: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  successHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
});
