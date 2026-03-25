import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { platformTheme } from '../../constants/platformTheme';
import { i18n } from '../../locales/i18n';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Custom SVG bar chart illustration */}
        <Svg width={120} height={80} style={styles.svg}>
          {/* Bar 1 — short */}
          <Rect
            x={10}
            y={52}
            width={22}
            height={20}
            rx={4}
            fill={theme.colors.primary}
            opacity={0.35}
          />
          {/* Bar 2 — medium */}
          <Rect
            x={42}
            y={36}
            width={22}
            height={36}
            rx={4}
            fill={theme.colors.primary}
            opacity={0.55}
          />
          {/* Bar 3 — tall */}
          <Rect
            x={74}
            y={16}
            width={22}
            height={56}
            rx={4}
            fill={theme.colors.primary}
            opacity={0.8}
          />
          {/* Trend line across tops */}
          <Line
            x1={21}
            y1={50}
            x2={53}
            y2={34}
            stroke={theme.colors.primaryLight}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Line
            x1={53}
            y1={34}
            x2={85}
            y2={14}
            stroke={theme.colors.primaryLight}
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Dots at trend points */}
          <Circle cx={21} cy={50} r={3.5} fill={theme.colors.primaryLight} />
          <Circle cx={53} cy={34} r={3.5} fill={theme.colors.primaryLight} />
          <Circle cx={85} cy={14} r={3.5} fill={theme.colors.primaryLight} />
        </Svg>

        <Text style={styles.title}>{i18n.t('dashboard.noData')}</Text>
        <Text style={styles.hint}>
          {'Scan a receipt or log a transaction\nto see your spending insights here'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...platformTheme.cardShadowPremium,
    maxWidth: 320,
  },
  svg: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  hint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
