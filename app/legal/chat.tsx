import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { LegalChatBubble } from '../../components/legal/LegalChatBubble';
import { VoiceRecorder } from '../../components/legal/VoiceRecorder';
import { DomainPicker } from '../../components/legal/DomainPicker';
import { useLegalChat } from '../../hooks/useLegalChat';
import { useLegalVoice } from '../../hooks/useLegalVoice';
import { LegalChatMessage, LegalDomain } from '../../types';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ domain?: string; initialQuestion?: string }>();
  const [domain, setDomain] = useState<LegalDomain>((params.domain as LegalDomain) ?? 'general');
  const [inputText, setInputText] = useState('');
  const [showDomainPicker, setShowDomainPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { messages, status, send } = useLegalChat(domain);
  const voice = useLegalVoice(domain);

  // Auto-send initial question from navigation params
  useEffect(() => {
    if (params.initialQuestion) {
      send(params.initialQuestion);
    }
  }, []); // run once on mount

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const q = inputText.trim();
    if (!q || status === 'loading') return;
    send(q);
    setInputText('');
  };

  const handleVoicePressIn = async () => {
    await voice.startRecording();
  };

  const handleVoicePressOut = async () => {
    await voice.stopAndProcess((msg, _audioB64) => {
      // Voice result is returned here; the hook already plays audio
      // Append user transcript as a visible message
    });
  };

  const domainLabel = i18n.t(`legal.domains.${domain}`);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.domainChip}
            onPress={() => setShowDomainPicker((v) => !v)}
          >
            <Text style={styles.domainLabel}>{domainLabel}</Text>
            <Ionicons name="chevron-down" size={12} color="#9B72FF" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {/* Domain picker (collapsible) */}
        {showDomainPicker && (
          <View style={styles.domainPickerRow}>
            <DomainPicker selected={domain} onSelect={(d) => { setDomain(d); setShowDomainPicker(false); }} />
          </View>
        )}

        {/* Messages */}
        {messages.length === 0 && status !== 'loading' ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#9B72FF" />
            <Text style={styles.emptyTitle}>{i18n.t('legal.title')}</Text>
            <Text style={styles.emptySubtitle}>{i18n.t('legal.subtitle')}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: LegalChatMessage }) => <LegalChatBubble message={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              status === 'loading' ? (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator color="#9B72FF" size="small" />
                  <Text style={styles.loadingText}>Thinking…</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <VoiceRecorder
            status={voice.status}
            onPressIn={handleVoicePressIn}
            onPressOut={handleVoicePressOut}
            error={voice.error}
          />
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={i18n.t('legal.inputPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
            editable={status !== 'loading'}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || status === 'loading') && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || status === 'loading'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  backBtn: { padding: 4 },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(155, 114, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  domainLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: '#9B72FF',
  },
  headerSpacer: { flex: 1 },
  domainPickerRow: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderBottomLeftRadius: 4,
    padding: theme.spacing.md,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
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
