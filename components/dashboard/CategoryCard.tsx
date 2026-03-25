import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransactionRow } from '../../services/db';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { CATEGORIES } from '../../constants/categories';
import { SpendingCategory } from '../../types';
import { TransactionRow as TransactionRowComponent } from './TransactionRow';

interface Props {
  category: SpendingCategory;
  total: number;
  transactions: TransactionRow[];
  onDeleteTransaction?: (id: number) => void;
  grandTotal?: number;
}

export function CategoryCard({
  category,
  total,
  transactions,
  onDeleteTransaction,
  grandTotal,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const catInfo = CATEGORIES[category] ?? CATEGORIES['Other'];
  const showProgress = grandTotal != null && grandTotal > 0;
  const progressPct = showProgress ? Math.min(1, total / grandTotal!) : 0;

  return (
    <View style={[styles.card, { borderLeftColor: catInfo.color }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {/* Icon box */}
          <View
            style={[
              styles.iconBox,
              { backgroundColor: catInfo.color + '18' },
            ]}
          >
            <Text style={styles.iconEmoji}>{catInfo.icon}</Text>
          </View>
          <View style={styles.nameWrap}>
            <Text style={styles.categoryName}>
              {i18n.t(`categories.${category}`, { defaultValue: category })}
            </Text>
            <Text style={styles.count}>
              {transactions.length}{' '}
              {transactions.length === 1 ? 'transaction' : 'transactions'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.total}>
            {total >= 1_000_000
              ? `₩${(total / 1_000_000).toFixed(1)}M`
              : total >= 10_000
              ? `₩${Math.round(total / 1_000)}K`
              : `₩${total.toLocaleString()}`}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {/* Mini progress bar */}
      {showProgress && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progressPct * 100)}%`,
                backgroundColor: catInfo.color,
              },
            ]}
          />
        </View>
      )}

      {/* Expanded transaction list */}
      {expanded && (
        <View style={styles.list}>
          {transactions.map((tx) => (
            <TransactionRowComponent
              key={tx.id}
              tx={tx}
              onDelete={onDeleteTransaction}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 18,
  },
  nameWrap: {
    flex: 1,
  },
  categoryName: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  count: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  total: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  progressTrack: {
    height: 3,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
    marginBottom: 6,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
});
