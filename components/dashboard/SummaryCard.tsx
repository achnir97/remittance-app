import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SummaryStats } from '../../hooks/useSpendingStats';
import { theme } from '../../constants/theme';
import { platformTheme } from '../../constants/platformTheme';
import { i18n } from '../../locales/i18n';
import { CATEGORIES } from '../../constants/categories';
import { SpendingCategory } from '../../types';

interface Props {
  stats: SummaryStats;
  compact?: boolean;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `₩${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `₩${Math.round(n / 1_000)}K`;
  return `₩${n.toLocaleString()}`;
}

export function SummaryCard({ stats, compact = false }: Props) {
  const topCatInfo = stats.topCategory
    ? CATEGORIES[stats.topCategory as SpendingCategory] ?? CATEGORIES['Other']
    : null;

  return (
    <View style={styles.card}>
      {/* Top accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.body}>
        {/* Hero label + number */}
        <Text style={styles.kpiLabel}>{i18n.t('dashboard.totalSpent')}</Text>
        <Text style={styles.kpiHero}>{fmt(stats.totalSpent)}</Text>

        {!compact && (
          <>
            {/* Horizontal divider */}
            <View style={styles.divider} />

            {/* 3-column stats */}
            <View style={styles.statsRow}>
              {/* Sent Home */}
              <View style={styles.statCol}>
                <View style={[styles.iconBox, { backgroundColor: '#0D2E27' }]}>
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={18}
                    color={theme.colors.success}
                  />
                </View>
                <Text style={styles.statValue}>{fmt(stats.sentHome)}</Text>
                <Text style={styles.statLabel}>{i18n.t('dashboard.sentHome')}</Text>
              </View>

              <View style={styles.colDivider} />

              {/* Transfers */}
              <View style={styles.statCol}>
                <View style={[styles.iconBox, { backgroundColor: '#1B2F4A' }]}>
                  <Ionicons
                    name="receipt-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.statValue}>{stats.transactionCount}</Text>
                <Text style={styles.statLabel}>{i18n.t('dashboard.transactions')}</Text>
              </View>

              <View style={styles.colDivider} />

              {/* Top Category */}
              <View style={styles.statCol}>
                {topCatInfo ? (
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: topCatInfo.color + '20' },
                    ]}
                  >
                    <Text style={styles.catEmoji}>{topCatInfo.icon}</Text>
                  </View>
                ) : (
                  <View style={[styles.iconBox, { backgroundColor: theme.colors.bg3 }]}>
                    <Ionicons name="pie-chart-outline" size={18} color={theme.colors.textMuted} />
                  </View>
                )}
                <Text style={styles.statValue}>
                  {stats.topCategory ? `${stats.topCategoryPct}%` : '—'}
                </Text>
                <Text style={styles.statLabel} numberOfLines={1}>
                  {stats.topCategory ?? i18n.t('dashboard.spendingByCategory')}
                </Text>
              </View>
            </View>

            {/* Fees row */}
            {stats.totalFees > 0 && (
              <View style={styles.feesRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color={theme.colors.textMuted}
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.feesText}>
                  {fmt(stats.totalFees)} paid in fees
                  {stats.sentHomeCount > 0
                    ? ` · avg ${fmt(stats.avgFeePerRemittance)}/transfer`
                    : ''}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.bg2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...platformTheme.cardShadowPremium,
  },
  accentBar: {
    height: 3,
    backgroundColor: theme.colors.primary,
    width: '100%',
  },
  body: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  kpiLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '600',
  },
  kpiHero: {
    fontSize: theme.fontSize.hero,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 6,
    lineHeight: theme.fontSize.hero * 1.2,
    letterSpacing: -0.5,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  colDivider: {
    width: 1,
    height: 64,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catEmoji: {
    fontSize: 16,
  },
  statValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 3,
    textAlign: 'center',
  },
  feesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  feesText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    flex: 1,
  },
});
