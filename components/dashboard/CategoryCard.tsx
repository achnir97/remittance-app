import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
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
}

export function CategoryCard({ category, total, transactions, onDeleteTransaction }: Props) {
  const [expanded, setExpanded] = useState(false);
  const catInfo = CATEGORIES[category] ?? CATEGORIES['Other'];

  return (
    <View style={[styles.card, { borderLeftColor: catInfo.color }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{catInfo.icon}</Text>
          <View>
            <Text style={styles.categoryName}>
              {i18n.t(`categories.${category}`, { defaultValue: category })}
            </Text>
            <Text style={styles.count}>{transactions.length} transactions</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.total}>₩{total.toLocaleString()}</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

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
    backgroundColor: theme.colors.surface,
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
  icon: {
    fontSize: 24,
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
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  total: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  chevron: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
});
