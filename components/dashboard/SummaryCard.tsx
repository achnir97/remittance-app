import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SummaryStats } from '../../hooks/useSpendingStats';
import { theme } from '../../constants/theme';
import { platformTheme } from '../../constants/platformTheme';
import { i18n } from '../../locales/i18n';

interface Props {
  stats: SummaryStats;
  compact?: boolean;
}

export function SummaryCard({ stats, compact = false }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.kpiLabel}>{i18n.t('dashboard.totalSpent')}</Text>
      <Text style={styles.kpiHero}>₩{stats.totalSpent.toLocaleString()}</Text>
      {!compact && (
        <View style={styles.row}>
          <View style={styles.kpiColumn}>
            <Text style={styles.subLabel}>{i18n.t('dashboard.sentHome')}</Text>
            <Text style={[styles.subValue, { color: theme.colors.blue }]}>
              ₩{stats.sentHome.toLocaleString()}
            </Text>
          </View>
          <View style={styles.kpiColumn}>
            <Text style={styles.subLabel}>{i18n.t('dashboard.transactions')}</Text>
            <Text style={styles.subValue}>{stats.transactionCount}</Text>
          </View>
          {stats.topCategory && (
            <View style={styles.kpiColumn}>
              <Text style={styles.subLabel}>{i18n.t('dashboard.spendingByCategory')}</Text>
              <Text style={styles.subValue}>
                {stats.topCategory} · {stats.topCategoryPct}%
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.bg2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...platformTheme.cardShadowPremium,
  },
  row: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.lg,
  },
  kpiLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  kpiHero: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 6,
    lineHeight: theme.fontSize.xxl * 1.25,
    letterSpacing: 0,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  kpiColumn: {
    flex: 1,
  },
  subLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
