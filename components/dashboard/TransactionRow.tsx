import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TransactionRow as TxRow } from '../../services/db';
import { ReceiptTypeIcon } from '../ocr/ReceiptTypeIcon';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { CATEGORIES } from '../../constants/categories';
import { SpendingCategory } from '../../types';

interface Props {
  tx: TxRow;
  onDelete?: (id: number) => void;
  onPress?: (tx: TxRow) => void;
}

export function TransactionRow({ tx, onDelete, onPress }: Props) {
  const dateStr = new Date(tx.date).toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
  });
  const amount = `₩${tx.amount_krw.toLocaleString()}`;
  const catInfo = CATEGORIES[tx.category as SpendingCategory] ?? CATEGORIES['Other'];

  const handleDelete = () => {
    Alert.alert(
      i18n.t('dashboard.deleteConfirm'),
      undefined,
      [
        { text: i18n.t('dashboard.deleteNo'), style: 'cancel' },
        {
          text: i18n.t('dashboard.deleteYes'),
          style: 'destructive',
          onPress: () => onDelete?.(tx.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress?.(tx)}
      onLongPress={handleDelete}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: catInfo.color + '18' }]}>
        <ReceiptTypeIcon type={tx.type} />
      </View>

      <View style={styles.info}>
        <Text style={styles.merchant} numberOfLines={1}>
          {tx.merchant ?? i18n.t(`receiptTypes.${tx.type}`, { defaultValue: tx.type })}
        </Text>
        <Text style={styles.meta}>
          {dateStr} · {i18n.t(`categories.${tx.category}`, { defaultValue: tx.category })}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{amount}</Text>
        {onDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  info: {
    flex: 1,
  },
  merchant: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  meta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  amount: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
});
