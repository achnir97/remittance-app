import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { CategoryTotal } from '../../hooks/useSpendingStats';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { CATEGORIES } from '../../constants/categories';
import { SpendingCategory } from '../../types';

interface Props {
  data: CategoryTotal[];
}

const SIZE = 200;
const CX = 100;
const CY = 100;
const OUTER_R = 84;
const INNER_R = 54;
const GAP = 0.03;

const FALLBACK_PALETTE = [
  '#3B8BFF',
  '#00C896',
  '#F5A623',
  '#9B72FF',
  '#FF6B8A',
  '#60C3FF',
];

function slicePath(startAngle: number, endAngle: number): string {
  const s = startAngle + GAP / 2;
  const e = endAngle - GAP / 2;
  if (e - s <= 0) return '';
  const x1 = CX + OUTER_R * Math.cos(s);
  const y1 = CY + OUTER_R * Math.sin(s);
  const x2 = CX + OUTER_R * Math.cos(e);
  const y2 = CY + OUTER_R * Math.sin(e);
  const x3 = CX + INNER_R * Math.cos(e);
  const y3 = CY + INNER_R * Math.sin(e);
  const x4 = CX + INNER_R * Math.cos(s);
  const y4 = CY + INNER_R * Math.sin(s);
  const large = e - s > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${INNER_R} ${INNER_R} 0 ${large} 0 ${x4} ${y4} Z`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `₩${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `₩${Math.round(n / 1_000)}K`;
  return `₩${n.toLocaleString()}`;
}

export function DonutChart({ data }: Props) {
  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{i18n.t('dashboard.noData')}</Text>
      </View>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  // Build slices
  const slices: Array<{
    path: string;
    color: string;
    category: string;
    total: number;
    pct: number;
  }> = [];

  let cursor = -Math.PI / 2;
  data.forEach((d, i) => {
    const fraction = total > 0 ? d.total / total : 0;
    let sweep = fraction * 2 * Math.PI;
    // Single-slice edge case: cap sweep
    if (data.length === 1) sweep = Math.min(sweep, 2 * Math.PI - 0.001);
    const start = cursor;
    const end = cursor + sweep;
    const color =
      CATEGORIES[d.category as SpendingCategory]?.color ??
      FALLBACK_PALETTE[i % FALLBACK_PALETTE.length];
    slices.push({
      path: slicePath(start, end),
      color,
      category: d.category,
      total: d.total,
      pct: total > 0 ? Math.round(fraction * 100) : 0,
    });
    cursor = end;
  });

  return (
    <View style={styles.container}>
      {/* SVG Donut */}
      <View style={styles.chartWrap}>
        <Svg width={SIZE} height={SIZE}>
          {slices.map((s, i) =>
            s.path ? (
              <Path key={i} d={s.path} fill={s.color} />
            ) : null
          )}
          {/* Center label */}
          <SvgText
            x={CX}
            y={CY - 8}
            fontSize={9}
            fill={theme.colors.textMuted}
            textAnchor="middle"
            letterSpacing={1.2}
          >
            TOTAL
          </SvgText>
          <SvgText
            x={CX}
            y={CY + 10}
            fontSize={18}
            fontWeight="700"
            fill={theme.colors.textPrimary}
            textAnchor="middle"
          >
            {fmt(total)}
          </SvgText>
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {slices.map((s, i) => {
          const catInfo = CATEGORIES[s.category as SpendingCategory];
          return (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendEmoji}>{catInfo?.icon ?? '📦'}</Text>
              <Text style={styles.legendName} numberOfLines={1}>
                {s.category}
              </Text>
              <Text style={styles.legendPct}>{s.pct}%</Text>
              <Text style={styles.legendAmount}>{fmt(s.total)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartWrap: {
    marginBottom: theme.spacing.md,
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
  legend: {
    width: '100%',
    gap: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '60',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    flexShrink: 0,
  },
  legendEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  legendName: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  legendPct: {
    width: 36,
    textAlign: 'right',
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  legendAmount: {
    width: 80,
    textAlign: 'right',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
