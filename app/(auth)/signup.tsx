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
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { theme } from '../../constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: Linking.createURL('auth/callback'),
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }

    // If Supabase returned a session immediately, email confirmation is disabled —
    // onAuthStateChange in _layout.tsx will redirect to tabs automatically.
    // If no session, the user needs to confirm their email first.
    if (!data.session) {
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Please verify your email to continue.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
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

          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.subheading}>Your journey in Korea starts here</Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={theme.colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

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
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="At least 6 characters"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="Repeat your password"
                  placeholderTextColor={theme.colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By joining Bridge you agree to our Terms of Service and Privacy Policy. Your data stays yours — always.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign in</Text>
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  backBtn: {
    marginBottom: theme.spacing.md,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
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
  termsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
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
