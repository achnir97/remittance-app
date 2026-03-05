import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { DailyTotal, WeeklyTotal, MonthlyTotal } from '../../services/db';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

type ChartMode = 'daily' | 'weekly' | 'monthly';

interface Props {
  dailyData: DailyTotal[];
  weeklyData: WeeklyTotal[];
  monthlyData: MonthlyTotal[];
  daysDiff: number;
}

const CHART_W = Dimensions.get('window').width - 48;
const CHART_H = 160;
const BAR_MAX_H = 120;
const LABEL_H = 24;

export function SpendingBarChart({ dailyData, weeklyData, monthlyData, daysDiff }: Props) {
  const mode: ChartMode = useMemo(() => {
    if (daysDiff <= 31) return 'daily';
    if (daysDiff <= 90) return 'weekly';
    return 'monthly';
  }, [daysDiff]);

  const titleKey = useMemo(() => {
    if (mode === 'daily') return 'dashboard.dailySpending';
    if (mode === 'weekly') return 'dashboard.weeklySpending';
    return 'dashboard.monthlySpending';
  }, [mode]);

  const data = useMemo(() => {
    if (mode === 'daily') return dailyData.map((d) => ({ label: d.date.slice(5), value: d.total }));
    if (mode === 'weekly') return weeklyData.map((d) => ({ label: d.week.slice(-2), value: d.total }));
    return monthlyData.map((d) => ({ label: d.month.slice(5), value: d.total }));
  }, [mode, dailyData, weeklyData, monthlyData]);

  if (!data.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{i18n.t(titleKey)}</Text>
        <Text style={styles.empty}>{i18n.t('dashboard.noData')}</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.max(8, Math.min(32, (CHART_W - 16) / data.length - 4));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{i18n.t(titleKey)}</Text>
      <Svg width={CHART_W} height={CHART_H + LABEL_H}>
        {/* Baseline */}
        <Line
          x1={0}
          y1={CHART_H}
          x2={CHART_W}
          y2={CHART_H}
          stroke={theme.colors.border}
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const h = Math.max(4, (d.value / maxVal) * BAR_MAX_H);
          const x = (i * CHART_W) / data.length + (CHART_W / data.length - barW) / 2;
          const y = CHART_H - h;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                fill={theme.colors.green}
                opacity={0.85}
              />
              {data.length <= 14 && (
                <SvgText
                  x={x + barW / 2}
                  y={CHART_H + 16}
                  fontSize={9}
                  fill={theme.colors.textMuted}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              )}
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
