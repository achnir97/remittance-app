import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProviderResult } from '../types';
import { theme } from '../constants/theme';
import { i18n } from '../locales/i18n';

interface Props {
  providers: ProviderResult[];
}

export const RateSummaryStrip = React.memo(function RateSummaryStrip({ providers }: Props) {
  if (!providers || providers.length === 0) return null;

  const byRecipient = providers.filter(
    (p) =>
      p &&
      typeof p.recipient_gets === 'number' &&
      !Number.isNaN(p.recipient_gets)
  );
  if (byRecipient.length === 0) return null;

  const sorted = [...byRecipient].sort((a, b) => b.recipient_gets - a.recipient_gets);
  const bestRate = sorted[0];

  const byFee = providers.filter(
    (p) =>
      p &&
      typeof p.transfer_fee_krw === 'number' &&
      !Number.isNaN(p.transfer_fee_krw)
  );
  const lowestFeeSource = byFee.length > 0 ? byFee : byRecipient;
  const lowestFee = [...lowestFeeSource].sort(
    (a, b) => a.transfer_fee_krw - b.transfer_fee_krw
  )[0];

  const fastestCandidates = providers.filter(
    (p) => p && typeof p.transfer_speed === 'string' && p.transfer_speed.includes('minute')
  );
  let fastest: ProviderResult | undefined;
  if (fastestCandidates.length > 0) {
    fastest = fastestCandidates.reduce((a, b) => {
      const aMin = parseInt(a.transfer_speed.match(/\d+/)?.[0] ?? '999', 10);
      const bMin = parseInt(b.transfer_speed.match(/\d+/)?.[0] ?? '999', 10);
      return aMin < bMin ? a : b;
    });
  } else {
    fastest = byRecipient[0];
  }

  return (
    <View style={styles.container}>
      <SummaryItem
        icon="⭐"
        label={i18n.t('summary.mostReceived')}
        value={bestRate?.provider ?? '-'}
        color={theme.colors.green}
      />
      <View style={styles.divider} />
      <SummaryItem
        icon="💸"
        label={i18n.t('summary.lowestFee')}
        value={
          lowestFee
            ? `₩${lowestFee.transfer_fee_krw.toLocaleString()}`
            : '₩0'
        }
        subLabel={lowestFee?.provider}
        color={theme.colors.blue}
      />
      <View style={styles.divider} />
      <SummaryItem
        icon="⚡"
        label={i18n.t('summary.fastestSpeed')}
        value={fastest?.provider ?? '-'}
        subLabel={fastest?.transfer_speed}
        color={theme.colors.amber}
      />
    </View>
  );
});

interface SummaryItemProps {
  icon: string;
  label: string;
  value: string;
  subLabel?: string;
  color: string;
}

function SummaryItem({ icon, label, value, subLabel, color }: SummaryItemProps) {
  return (
    <View style={styles.item}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subLabel ? <Text style={styles.subLabel}>{subLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  value: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  subLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
});
