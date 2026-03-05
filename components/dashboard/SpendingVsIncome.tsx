import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { MonthlyTotal, IncomeRow } from '../../services/db';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  monthlySpending: MonthlyTotal[];
  income: IncomeRow[];
}

const CHART_W = Dimensions.get('window').width - 48;
const CHART_H = 140;
const PAD = 16;

export function SpendingVsIncome({ monthlySpending, income }: Props) {
  const { months, spendingPts, incomePts } = useMemo(() => {
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
      const x = allMonths.length <= 1
        ? CHART_W / 2
        : PAD + (i * (CHART_W - PAD * 2)) / (allMonths.length - 1);
      const y = CHART_H - PAD - ((val / maxVal) * (CHART_H - PAD * 2));
      return [x, y];
    };

    const sp = allMonths.map((m, i) => toPoint(spendMap[m] ?? 0, i));
    const ip = allMonths.map((m, i) => toPoint(incomeMap[m] ?? 0, i));

    return { months: allMonths, spendingPts: sp, incomePts: ip };
  }, [monthlySpending, income]);

  if (!months.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{i18n.t('dashboard.incomeVsSpend')}</Text>
        <Text style={styles.hint}>{i18n.t('dashboard.addIncome')}</Text>
      </View>
    );
  }

  const toPolyline = (pts: [number, number][]): string =>
    pts.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{i18n.t('dashboard.incomeVsSpend')}</Text>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.colors.green }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: theme.colors.red }]} />
          <Text style={styles.legendText}>Spending</Text>
        </View>
      </View>
      <Svg width={CHART_W} height={CHART_H}>
        <Line x1={0} y1={CHART_H - PAD} x2={CHART_W} y2={CHART_H - PAD} stroke={theme.colors.border} strokeWidth={1} />

        {incomePts.length > 1 && (
          <Polyline points={toPolyline(incomePts)} fill="none" stroke={theme.colors.green} strokeWidth={2} />
        )}
        {spendingPts.length > 1 && (
          <Polyline points={toPolyline(spendingPts)} fill="none" stroke={theme.colors.red} strokeWidth={2} />
        )}

        {incomePts.map(([x, y], i) => (
          <Circle key={`i${i}`} cx={x} cy={y} r={4} fill={theme.colors.green} />
        ))}
        {spendingPts.map(([x, y], i) => (
          <Circle key={`s${i}`} cx={x} cy={y} r={4} fill={theme.colors.red} />
        ))}

        {months.map((m, i) => {
          const x = spendingPts[i]?.[0] ?? 0;
          return (
            <SvgText key={m} x={x} y={CHART_H - 2} fontSize={8} fill={theme.colors.textMuted} textAnchor="middle">
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
