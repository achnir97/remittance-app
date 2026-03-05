import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TransactionRow } from '../../services/db';
import { ReceiptTypeIcon } from './ReceiptTypeIcon';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  tx: TransactionRow;
}

export function RecentScanRow({ tx }: Props) {
  const date = new Date(tx.date).toLocaleDateString();
  const amount = `₩${tx.amount_krw.toLocaleString()}`;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <ReceiptTypeIcon type={tx.type} />
        <View style={styles.texts}>
          <Text style={styles.title}>{tx.merchant ?? i18n.t('receiptTypes.other')}</Text>
          <Text style={styles.subtitle}>
            {date} · {i18n.t(`receiptTypes.${tx.type}` as const, { defaultValue: tx.type })}
          </Text>
        </View>
      </View>
      <Text style={styles.amount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
});

