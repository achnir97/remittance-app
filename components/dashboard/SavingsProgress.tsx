import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  totalSpent: number;
  incomeKrw: number;
  goalKrw: number;
}

export function SavingsProgress({ totalSpent, incomeKrw, goalKrw }: Props) {
  const saved = Math.max(0, incomeKrw - totalSpent);
  const pct = goalKrw > 0 ? Math.min(1, saved / goalKrw) : 0;
  const pctDisplay = Math.round(pct * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{i18n.t('dashboard.savingsGoal')}</Text>
      <View style={styles.row}>
        <Text style={styles.value}>₩{saved.toLocaleString()}</Text>
        <Text style={styles.goal}>of ₩{goalKrw.toLocaleString()} goal</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pctDisplay}%` }]} />
      </View>
      <Text style={styles.pct}>{pctDisplay}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  value: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.green,
  },
  goal: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  track: {
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.green,
  },
  pct: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'right',
    fontWeight: '600',
  },
});
