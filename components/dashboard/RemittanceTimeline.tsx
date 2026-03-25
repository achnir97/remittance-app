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
import { TransactionRow } from '../../services/db';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  remittances: TransactionRow[];
}

const CHART_W = Dimensions.get('window').width - 48;
const CHART_H = 150;
const BAR_MAX_H = 110;
const LABEL_H = 24;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtBar(n: number): string {
  if (n >= 1_000_000) return `₩${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `₩${Math.round(n / 1_000)}K`;
  return `₩${n.toLocaleString()}`;
}

function monthLabel(mmStr: string): string {
  const idx = parseInt(mmStr, 10) - 1;
  return MONTH_NAMES[idx] ?? mmStr;
}

export function RemittanceTimeline({ remittances }: Props) {
  const data = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const r of remittances) {
      const month = r.date.slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + r.amount_krw;
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        label: monthLabel(month.slice(5)),
        total,
      }));
  }, [remittances]);

  if (!data.length) {
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{i18n.t('dashboard.remittanceHistory')}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>REMITTANCES</Text>
          </View>
        </View>
        <Text style={styles.empty}>{i18n.t('dashboard.noData')}</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const barW = Math.max(12, Math.min(40, (CHART_W - 16) / data.length - 6));
  const midY = CHART_H - (0.5 * BAR_MAX_H);
  const showAmounts = data.length <= 8;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{i18n.t('dashboard.remittanceHistory')}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>REMITTANCES</Text>
        </View>
      </View>

      <Svg width={CHART_W} height={CHART_H + LABEL_H}>
        <Defs>
          <LinearGradient id="remitGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3B8BFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#0A1F3C" stopOpacity="0.5" />
          </LinearGradient>
        </Defs>

        {/* Baseline */}
        <Line
          x1={0}
          y1={CHART_H}
          x2={CHART_W}
          y2={CHART_H}
          stroke={theme.colors.border}
          strokeWidth={1}
        />

        {/* 50% grid line (dashed) */}
        <Line
          x1={0}
          y1={midY}
          x2={CHART_W}
          y2={midY}
          stroke={theme.colors.textMuted}
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.4}
        />

        {data.map((d, i) => {
          const h = Math.max(4, (d.total / maxVal) * BAR_MAX_H);
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
                fill="url(#remitGrad)"
              />
              {/* Amount label above bar */}
              {showAmounts && (
                <SvgText
                  x={x + barW / 2}
                  y={y - 5}
                  fontSize={9}
                  fill={theme.colors.primaryLight}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {fmtBar(d.total)}
                </SvgText>
              )}
              {/* Month label */}
              <SvgText
                x={x + barW / 2}
                y={CHART_H + 16}
                fontSize={9}
                fill={theme.colors.textMuted}
                textAnchor="middle"
              >
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
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  empty: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
});
