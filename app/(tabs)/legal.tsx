import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { useAppStore } from '../../store/useAppStore';
import { DomainPicker } from '../../components/legal/DomainPicker';
import { LegalDomain } from '../../types';
import * as Haptics from 'expo-haptics';

const QUICK_QUESTIONS_KEY = 'legal.quickQuestions';

export default function LegalScreen() {
  const language = useAppStore((s) => s.language);
  void language; // Re-render when language changes so i18n strings update
  const [domain, setDomain] = useState<LegalDomain>('general');
  const [inputText, setInputText] = useState('');

  const quickQuestions: string[] = i18n.t(QUICK_QUESTIONS_KEY, { returnObjects: true }) as string[];
  const questions = Array.isArray(quickQuestions) ? quickQuestions : [];

  const handleSend = (question: string) => {
    const q = question.trim();
    if (!q) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/legal/chat', params: { domain, initialQuestion: q } });
    setInputText('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#9B72FF" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{i18n.t('legal.title')}</Text>
              <Text style={styles.subtitle}>{i18n.t('legal.subtitle')}</Text>
            </View>
          </View>

          {/* Domain picker */}
          <View style={styles.section}>
            <DomainPicker selected={domain} onSelect={setDomain} />
          </View>

          {/* Quick questions */}
          {questions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{i18n.t('legal.quickQuestionsLabel')}</Text>
              {questions.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickBtn}
                  onPress={() => handleSend(q)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickText}>{q}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#9B72FF" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Document analysis */}
          <TouchableOpacity
            style={styles.docCard}
            onPress={() => router.push('/legal/document')}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={24} color="#9B72FF" />
            <View style={styles.docText}>
              <Text style={styles.docTitle}>{i18n.t('legal.analyzeDocument')}</Text>
              <Text style={styles.docSubtitle}>{i18n.t('legal.documentSubtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9B72FF" />
          </TouchableOpacity>

          {/* Emergency contacts */}
          <TouchableOpacity
            style={styles.emergencyCard}
            onPress={() => router.push('/legal/hotlines')}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={20} color={theme.colors.red} />
            <View style={styles.docText}>
              <Text style={styles.emergencyTitle}>{i18n.t('legal.emergencyContacts')}</Text>
              <Text style={styles.emergencyNums}>1366 · 112 · 1350</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.red} />
          </TouchableOpacity>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Text input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={i18n.t('legal.inputPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={() => handleSend(inputText)}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend(inputText)}
            disabled={!inputText.trim()}
          >
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  content: { paddingBottom: theme.spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(155, 114, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginTop: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.md,
    marginBottom: 6,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  quickText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(155, 114, 255, 0.1)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(155, 114, 255, 0.35)',
  },
  docText: { flex: 1 },
  docTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#9B72FF',
  },
  docSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.35)',
  },
  emergencyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.error,
  },
  emergencyNums: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.red,
    marginTop: 2,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(155, 114, 255, 0.4)',
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.select({ ios: 10, android: 8 })!,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.bg2,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#9B72FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
