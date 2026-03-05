import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { LegalChatMessage } from '../../types';
import { ActionSteps } from './ActionSteps';
import { HotlineCard } from './HotlineCard';
import { DisclaimerFooter } from './DisclaimerFooter';
import { EmergencyBanner } from './EmergencyBanner';
import { i18n } from '../../locales/i18n';

interface Props {
  message: LegalChatMessage;
}

export function LegalChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  // Emergency response — full-width red banner
  if (!isUser && message.emergency && message.response) {
    return (
      <EmergencyBanner note={message.response.important_note} />
    );
  }

  // User bubble
  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  // AI bubble
  const { response } = message;
  if (!response) return null;

  return (
    <View style={styles.aiRow}>
      <View style={styles.aiBubble}>
        {/* Summary */}
        <Text style={styles.summaryLabel}>{i18n.t('legal.response.summary')}</Text>
        <Text style={styles.summary}>{response.summary}</Text>

        {/* Explanation */}
        {response.explanation ? (
          <>
            <Text style={styles.sectionLabel}>{i18n.t('legal.response.explanation')}</Text>
            <Text style={styles.explanation}>{response.explanation}</Text>
          </>
        ) : null}

        {/* Action steps */}
        <ActionSteps steps={response.action_steps} />

        {/* Important note */}
        {response.important_note ? (
          <View style={styles.noteBox}>
            <Text style={styles.note}>{i18n.t('legal.response.note')}: {response.important_note}</Text>
          </View>
        ) : null}

        {/* Hotline */}
        <HotlineCard hotline={response.hotline} />

        {/* Disclaimer (collapsed) */}
        <DisclaimerFooter text={response.disclaimer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  userBubble: {
    backgroundColor: '#9B72FF',
    borderRadius: theme.radius.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  userText: {
    fontSize: theme.fontSize.md,
    color: '#fff',
    lineHeight: 22,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  aiBubble: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderBottomLeftRadius: 4,
    padding: theme.spacing.md,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: '#9B72FF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summary: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  explanation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 21,
    marginBottom: theme.spacing.sm,
  },
  noteBox: {
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  note: {
    fontSize: theme.fontSize.sm,
    color: '#F5A623',
    lineHeight: 19,
  },
});
