import React, { useState, useRef, useCallback } from 'react';
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
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { theme } from '../../constants/theme';
import { isValidEmail } from '../../utils/validators';

// Brute-force protection: lock out after 5 failed attempts for 30 seconds.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const failedAttempts = useRef(0);
  const passwordRef = useRef<TextInput>(null);

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;
  const lockoutSecsLeft = isLockedOut ? Math.ceil((lockoutUntil! - Date.now()) / 1000) : 0;

  const handleLogin = useCallback(async () => {
    if (isLockedOut) {
      Alert.alert('Too many attempts', `Please wait ${lockoutSecsLeft}s before trying again.`);
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (error) {
      failedAttempts.current += 1;
      if (failedAttempts.current >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockoutUntil(until);
        failedAttempts.current = 0;
        Alert.alert(
          'Account temporarily locked',
          `Too many failed attempts. Please wait 30 seconds before trying again.`
        );
      } else {
        Alert.alert('Login failed', error.message);
      }
    } else {
      failedAttempts.current = 0;
      setLockoutUntil(null);
      // On success, onAuthStateChange in _layout.tsx handles the redirect
    }
  }, [email, password, isLockedOut, lockoutSecsLeft]);

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
          {/* Branding */}
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Ionicons name="git-network-outline" size={26} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.appName}>Bridge</Text>
              <Text style={styles.appTagline}>Life in Korea, simplified</Text>
            </View>
          </View>

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to continue your journey</Text>

          {/* Lockout warning */}
          {isLockedOut && (
            <View style={styles.lockoutBanner}>
              <Ionicons name="lock-closed-outline" size={14} color={theme.colors.error} />
              <Text style={styles.lockoutText}>
                Too many attempts. Wait {lockoutSecsLeft}s to try again.
              </Text>
            </View>
          )}

          {/* Form */}
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
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                accessibilityLabel="Email address"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, styles.inputFlex]}
                  placeholder="Your password"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotRow} accessibilityLabel="Forgot password">
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              style={[styles.primaryBtn, (loading || isLockedOut) && styles.primaryBtnDisabled]}
              onPress={handleLogin}
              disabled={loading || isLockedOut}
              activeOpacity={0.85}
              accessibilityLabel="Sign in"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity accessibilityLabel="Go to sign up">
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  appName: {
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 0.3,
    marginTop: 1,
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
  },
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.error + '18',
    borderWidth: 1,
    borderColor: theme.colors.error + '44',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    marginBottom: theme.spacing.md,
  },
  lockoutText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    flex: 1,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputFlex: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  eyeBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing.xs,
  },
  forgotText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
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
});
