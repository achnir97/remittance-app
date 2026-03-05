import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { TransactionRow } from '../../services/db';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  remittances: TransactionRow[];
}

const CHART_W = Dimensions.get('window').width - 48;
const CHART_H = 140;
const BAR_MAX_H = 100;

export function RemittanceTimeline({ remittances }: Props) {
  const data = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const r of remittances) {
      const month = r.date.slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + r.amount_krw;
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ label: month.slice(5), total }));
  }, [remittances]);

  if (!data.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{i18n.t('dashboard.remittanceHistory')}</Text>
        <Text style={styles.empty}>{i18n.t('dashboard.noData')}</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const barW = Math.max(12, Math.min(40, (CHART_W - 16) / data.length - 6));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{i18n.t('dashboard.remittanceHistory')}</Text>
      <Svg width={CHART_W} height={CHART_H + 20}>
        <Line
          x1={0}
          y1={CHART_H}
          x2={CHART_W}
          y2={CHART_H}
          stroke={theme.colors.border}
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const h = Math.max(4, (d.total / maxVal) * BAR_MAX_H);
          const x = (i * CHART_W) / data.length + (CHART_W / data.length - barW) / 2;
          const y = CHART_H - h;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={barW} height={h} rx={4} fill="#1B6FEB" opacity={0.9} />
              <SvgText x={x + barW / 2} y={CHART_H + 16} fontSize={9} fill={theme.colors.textMuted} textAnchor="middle">
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  empty: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
});
