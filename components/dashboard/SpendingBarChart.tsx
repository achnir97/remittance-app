import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Rect,
  Text as SvgText,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
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
  const maxIdx = data.findIndex((d) => d.value === maxVal);
  const barW = Math.max(8, Math.min(32, (CHART_W - 16) / data.length - 4));
  const showLabels = data.length <= 14;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{i18n.t(titleKey)}</Text>
      <Svg width={CHART_W} height={CHART_H + LABEL_H}>
        <Defs>
          {/* Normal bar gradient */}
          <LinearGradient id="spendBarGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="1" />
            <Stop offset="1" stopColor="#0C1E3C" stopOpacity="0.4" />
          </LinearGradient>
          {/* Highlight bar gradient */}
          <LinearGradient id="spendBarGradHigh" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#60AAFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#1B4080" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Axis baseline */}
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
          const isMax = i === maxIdx;
          const gradId = isMax ? 'spendBarGradHigh' : 'spendBarGrad';

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={5}
                fill={`url(#${gradId})`}
              />
              {/* Value label above tallest bar */}
              {isMax && data.length <= 20 && (
                <SvgText
                  x={x + barW / 2}
                  y={y - 5}
                  fontSize={9}
                  fill={theme.colors.primaryLight}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {d.value >= 1_000_000
                    ? `₩${(d.value / 1_000_000).toFixed(1)}M`
                    : d.value >= 10_000
                    ? `₩${Math.round(d.value / 1_000)}K`
                    : `₩${d.value.toLocaleString()}`}
                </SvgText>
              )}
              {/* Date label */}
              {showLabels && (
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
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.xl,
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
