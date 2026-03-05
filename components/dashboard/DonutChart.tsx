import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryPie } from 'victory-native';
import { CategoryTotal } from '../../hooks/useSpendingStats';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  data: CategoryTotal[];
}

// Bridge data visualization palette — all pass WCAG AA on ink-800 background
const COLORS = ['#3B8BFF', '#00C896', '#F5A623', '#9B72FF', '#FF6B8A', '#6B8AAA', '#00E5AC', '#FFB83F'];

export function DonutChart({ data }: Props) {
  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{i18n.t('dashboard.noData')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VictoryPie
        data={data}
        x="category"
        y="total"
        colorScale={COLORS}
        innerRadius={50}
        padAngle={1}
        labelRadius={({ radius }) => radius + 10}
        style={{
          labels: {
            fontSize: 10,
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
});

