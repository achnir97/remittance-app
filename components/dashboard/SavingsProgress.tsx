import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  totalSpent: number;
  incomeKrw: number;
  goalKrw: number;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `₩${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `₩${Math.round(n / 1_000)}K`;
  return `₩${n.toLocaleString()}`;
}

export function SavingsProgress({ totalSpent, incomeKrw, goalKrw }: Props) {
  const saved = Math.max(0, incomeKrw - totalSpent);
  const pct = goalKrw > 0 ? Math.min(1, saved / goalKrw) : 0;
  const pctDisplay = Math.round(pct * 100);
  const remaining = Math.max(0, goalKrw - saved);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const animWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>{i18n.t('dashboard.savingsGoal')}</Text>
          {remaining > 0 && (
            <Text style={styles.subtitle}>{fmt(remaining)} to go</Text>
          )}
        </View>
        <Text style={styles.pctBig}>{pctDisplay}%</Text>
      </View>

      {/* Progress track with milestone markers */}
      <View style={styles.trackWrap}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: animWidth }]} />
        </View>
        {/* Milestone markers at 25%, 50%, 75% */}
        {[0.25, 0.5, 0.75].map((m) => (
          <View
            key={m}
            style={[
              styles.milestone,
              { left: `${m * 100}%` as unknown as number },
            ]}
          />
        ))}
      </View>

      {/* 3 KPI chips */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiChip}>
          <Text style={[styles.kpiValue, { color: theme.colors.success }]}>
            {fmt(saved)}
          </Text>
          <Text style={styles.kpiLabel}>Saved</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiChip}>
          <Text style={[styles.kpiValue, { color: theme.colors.textMuted }]}>
            {fmt(remaining)}
          </Text>
          <Text style={styles.kpiLabel}>Remaining</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiChip}>
          <Text style={[styles.kpiValue, { color: theme.colors.textSecondary }]}>
            {fmt(goalKrw)}
          </Text>
          <Text style={styles.kpiLabel}>Goal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 3,
  },
  pctBig: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.success,
  },
  trackWrap: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  track: {
    height: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.success,
  },
  milestone: {
    position: 'absolute',
    top: -2,
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiChip: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border,
  },
  kpiValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
});
