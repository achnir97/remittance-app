import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { ClauseAnalysis } from '../../types';
import { i18n } from '../../locales/i18n';

interface Props {
  clause: ClauseAnalysis;
}

const LEVEL_CONFIG = {
  ok: {
    icon: '✅',
    color: '#00C896',
    bg: 'rgba(0, 200, 150, 0.12)',
    label: () => i18n.t('legal.document.concernLevels.ok'),
  },
  warning: {
    icon: '⚠️',
    color: theme.colors.amber,
    bg: 'rgba(245, 166, 35, 0.12)',
    label: () => i18n.t('legal.document.concernLevels.warning'),
  },
  violation: {
    icon: '❌',
    color: theme.colors.red,
    bg: 'rgba(255, 77, 109, 0.12)',
    label: () => i18n.t('legal.document.concernLevels.violation'),
  },
};

export function ClauseCard({ clause }: Props) {
  const [expanded, setExpanded] = useState(clause.concern_level !== 'ok');
  const config = LEVEL_CONFIG[clause.concern_level] ?? LEVEL_CONFIG.ok;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: config.color }]}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={styles.badgeIcon}>{config.icon}</Text>
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label()}</Text>
        </View>
      </View>
      <Text style={styles.clauseText} numberOfLines={expanded ? undefined : 2}>
        {clause.clause}
      </Text>
      {expanded && (
        <Text style={styles.explanation}>{clause.explanation}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 11,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  clauseText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  explanation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
});
