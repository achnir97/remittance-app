import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { platformTheme } from '../constants/platformTheme';
import { ProviderResult } from '../types';

const TYPICAL_BANK_MARKUP = 3.5;
const TYPICAL_BANK_FEE_KRW = 15000;

interface Props {
  providers: ProviderResult[];
  sendAmount: number;
}

export const BankComparisonCard = React.memo(function BankComparisonCard({
  providers,
  sendAmount,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  }, []);

  const best = providers.length > 0 ? providers[0] : null;

  const bankRate = best
    ? best.mid_market_rate * (1 - TYPICAL_BANK_MARKUP / 100)
    : 0;
  const bankRecipient = Math.round(sendAmount * bankRate);
  const youSave = best ? Math.round(best.recipient_gets - bankRecipient) : 0;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={toggle} style={styles.header} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.bankIcon}>🏦</Text>
          <View>
            <Text style={styles.headerTitle}>vs. Korean Banks</Text>
            {!expanded && best && (
              <Text style={styles.headerSub}>
                Save ~{youSave.toLocaleString()} {best.extra.rate_expression.split('=')[1]?.trim().split(' ')[1] ?? ''}
              </Text>
            )}
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ Typical Korean bank markup: ~{TYPICAL_BANK_MARKUP}% + ₩
              {TYPICAL_BANK_FEE_KRW.toLocaleString()} fee
            </Text>
          </View>

          {best && (
            <View style={styles.comparison}>
              <ComparisonRow
                label="Bank estimate"
                value={`~${bankRecipient.toLocaleString()}`}
                valueColor={theme.colors.red}
              />
              <ComparisonRow
                label={`Best rate (${best.provider})`}
                value={best.recipient_gets.toLocaleString()}
                valueColor={theme.colors.green}
              />
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>You save approximately</Text>
                <Text style={styles.savingsValue}>+{youSave.toLocaleString()}</Text>
              </View>
            </View>
          )}

          <Text style={styles.disclaimer}>
            Bank estimate based on typical markup. Actual bank rates may vary.
          </Text>
        </View>
      )}
    </View>
  );
});

function ComparisonRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View style={styles.compRow}>
      <Text style={styles.compLabel}>{label}</Text>
      <Text style={[styles.compValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: platformTheme.cardRadius,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...platformTheme.cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.select({ ios: theme.spacing.md, android: theme.spacing.sm })!,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  bankIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.green,
    fontWeight: '500',
  },
  body: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  warningBanner: {
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    color: '#F5A623',
  },
  comparison: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  compLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  compValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#E8F7F1',
    borderRadius: theme.radius.sm,
    marginTop: 4,
  },
  savingsLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.green,
    fontWeight: '600',
  },
  savingsValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.green,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  disclaimer: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
});
