import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { MonthlyTotal, IncomeRow } from '../../services/db';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  monthlySpending: MonthlyTotal[];
  income: IncomeRow[];
}

const CHART_W = Dimensions.get('window').width - 48;
const CHART_H = 150;
const PAD = 20;

function fmt(n: number): string {
  if (n >= 1_000_000) return `₩${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `₩${Math.round(n / 1_000)}K`;
  return `₩${n.toLocaleString()}`;
}

export function SpendingVsIncome({ monthlySpending, income }: Props) {
  const { months, spendingPts, incomePts, totalIncome, totalSpending } = useMemo(() => {
    const allMonths = [
      ...new Set([
        ...monthlySpending.map((d) => d.month),
        ...income.map((r) => r.date.slice(0, 7)),
      ]),
    ].sort();

    const spendMap: Record<string, number> = {};
    for (const d of monthlySpending) spendMap[d.month] = d.total;

    const incomeMap: Record<string, number> = {};
    for (const r of income) {
      const m = r.date.slice(0, 7);
      incomeMap[m] = (incomeMap[m] ?? 0) + r.amount_krw;
    }

    const allVals = [...Object.values(spendMap), ...Object.values(incomeMap)];
    const maxVal = Math.max(...allVals, 1);

    const toPoint = (val: number, i: number): [number, number] => {
      const x =
        allMonths.length <= 1
          ? CHART_W / 2
          : PAD + (i * (CHART_W - PAD * 2)) / (allMonths.length - 1);
      const y = CHART_H - PAD - (val / maxVal) * (CHART_H - PAD * 2);
      return [x, y];
    };

    const sp = allMonths.map((m, i) => toPoint(spendMap[m] ?? 0, i));
    const ip = allMonths.map((m, i) => toPoint(incomeMap[m] ?? 0, i));

    const tIncome = Object.values(incomeMap).reduce((s, v) => s + v, 0);
    const tSpend = Object.values(spendMap).reduce((s, v) => s + v, 0);

    return {
      months: allMonths,
      spendingPts: sp,
      incomePts: ip,
      totalIncome: tIncome,
      totalSpending: tSpend,
    };
  }, [monthlySpending, income]);

  if (!months.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{i18n.t('dashboard.incomeVsSpend')}</Text>
        <Text style={styles.hint}>{i18n.t('dashboard.addIncome')}</Text>
      </View>
    );
  }

  const baseY = CHART_H - PAD;

  // Build area path for a series
  const areaPath = (pts: [number, number][]): string => {
    if (pts.length < 2) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    const line = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
    return `${line} L ${last[0]} ${baseY} L ${first[0]} ${baseY} Z`;
  };

  // Build line path for a series
  const linePath = (pts: [number, number][]): string => {
    if (pts.length < 2) return '';
    return pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  };

  const showNetBalance = totalIncome > 0 && totalSpending > 0;
  const netBalance = totalIncome - totalSpending;
  const netPositive = netBalance >= 0;

  return (
    <View style={styles.card}>
      {/* Title + net balance chip */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{i18n.t('dashboard.incomeVsSpend')}</Text>
        {showNetBalance && (
          <View
            style={[
              styles.netChip,
              { backgroundColor: netPositive ? '#0D2E27' : '#2E0D16' },
            ]}
          >
            <Text
              style={[
                styles.netChipText,
                { color: netPositive ? theme.colors.success : theme.colors.error },
              ]}
            >
              {netPositive ? '+' : ''}
              {fmt(netBalance)}
            </Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.colors.error }]} />
          <Text style={styles.legendText}>Spending</Text>
        </View>
      </View>

      <Svg width={CHART_W} height={CHART_H}>
        {/* Baseline */}
        <Line
          x1={0}
          y1={baseY}
          x2={CHART_W}
          y2={baseY}
          stroke={theme.colors.border}
          strokeWidth={1}
        />

        {/* Income area fill */}
        {incomePts.length > 1 && (
          <Path
            d={areaPath(incomePts)}
            fill="rgba(0,200,150,0.12)"
            stroke="none"
          />
        )}

        {/* Spending area fill */}
        {spendingPts.length > 1 && (
          <Path
            d={areaPath(spendingPts)}
            fill="rgba(255,77,109,0.12)"
            stroke="none"
          />
        )}

        {/* Income line */}
        {incomePts.length > 1 && (
          <Path
            d={linePath(incomePts)}
            fill="none"
            stroke={theme.colors.success}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Spending line */}
        {spendingPts.length > 1 && (
          <Path
            d={linePath(spendingPts)}
            fill="none"
            stroke={theme.colors.error}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Income dots */}
        {incomePts.map(([x, y], i) => (
          <Circle key={`i${i}`} cx={x} cy={y} r={4.5} fill={theme.colors.success} />
        ))}

        {/* Spending dots */}
        {spendingPts.map(([x, y], i) => (
          <Circle key={`s${i}`} cx={x} cy={y} r={4.5} fill={theme.colors.error} />
        ))}

        {/* Month labels */}
        {months.map((m, i) => {
          const x = spendingPts[i]?.[0] ?? 0;
          return (
            <SvgText
              key={m}
              x={x}
              y={CHART_H - 3}
              fontSize={9}
              fill={theme.colors.textMuted}
              textAnchor="middle"
            >
              {m.slice(5)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  netChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  netChipText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  hint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
});
