import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHistory } from '../../hooks/useHistory';
import { useAppStore } from '../../store/useAppStore';
import { CorridorPicker } from '../../components/CorridorPicker';
import { theme } from '../../constants/theme';
import { Corridor } from '../../types';
import { i18n } from '../../locales/i18n';
import { PROVIDERS } from '../../constants/providers';
import { ProviderName } from '../../types';

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - theme.spacing.md * 2;
const CHART_HEIGHT = 220;

interface DataPoint {
  x: number;
  y: number;
  provider: string;
  timestamp: string;
}

function SimpleLineChart({
  data,
  providers: providerNames,
}: {
  data: DataPoint[];
  providers: string[];
}) {
  if (data.length === 0) return null;

  const allY = data.map((d) => d.y).filter((y) => y > 0);
  if (allY.length === 0) return null;

  const minY = Math.min(...allY) * 0.998;
  const maxY = Math.max(...allY) * 1.002;
  const allX = data.map((d) => d.x);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);

  const toSvgX = (x: number) =>
    maxX === minX ? CHART_WIDTH / 2 : ((x - minX) / (maxX - minX)) * CHART_WIDTH;
  const toSvgY = (y: number) =>
    maxY === minY ? CHART_HEIGHT / 2 : CHART_HEIGHT - ((y - minY) / (maxY - minY)) * CHART_HEIGHT;

  return (
    <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
      {providerNames.map((name) => {
        const providerData = data.filter((d) => d.provider === name);
        if (providerData.length < 2) return null;
        const meta = PROVIDERS[name as ProviderName];
        const color = meta?.color ?? '#888';

        const points = providerData
          .sort((a, b) => a.x - b.x)
          .map((d) => `${toSvgX(d.x)},${toSvgY(d.y)}`)
          .join(' ');

        return (
          <View
            key={name}
            style={[StyleSheet.absoluteFill]}
            pointerEvents="none"
          >
            {providerData.slice(1).map((d, i) => {
              const prev = providerData[i];
              const x1 = toSvgX(prev.x);
              const y1 = toSvgY(prev.y);
              const x2 = toSvgX(d.x);
              const y2 = toSvgY(d.y);
              const dx = x2 - x1;
              const dy = y2 - y1;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);

              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x1,
                    top: y1 - 1,
                    width: length,
                    height: 2,
                    backgroundColor: color,
                    transformOrigin: '0 50%',
                    transform: [{ rotate: `${angle}deg` }],
                  }}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export default function HistoryScreen() {
  const [days, setDays] = useState(7);
  const corridor = useAppStore((s) => s.corridor);
  const setCorridor = useAppStore((s) => s.setCorridor);
  const language = useAppStore((s) => s.language);
  void language;

  const { data, isLoading, isError, refetch } = useHistory(days);

  const handleCorridorChange = useCallback(
    (c: Corridor) => setCorridor(c),
    [setCorridor]
  );

  const chartData: DataPoint[] =
    data?.data?.map((b) => ({
      x: new Date(b.timestamp).getTime(),
      y: b.exchange_rate,
      provider: b.provider,
      timestamp: b.timestamp,
    })) ?? [];

  const presentProviders = [...new Set(chartData.map((d) => d.provider))];

  const lastUpdated = data?.data?.length
    ? new Date(data.data[data.data.length - 1].timestamp).toLocaleString()
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('history.title')}</Text>
      </View>

      <View style={styles.corridorSection}>
        <CorridorPicker selected={corridor} onSelect={handleCorridorChange} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period tabs */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.days}
              onPress={() => setDays(p.days)}
              style={[
                styles.periodBtn,
                days === p.days && styles.periodBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  days === p.days && styles.periodTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartCard}>
          {isLoading && (
            <View style={styles.chartPlaceholder}>
              <Text style={styles.loadingText}>{i18n.t('loading.history')}</Text>
            </View>
          )}

          {isError && (
            <View style={styles.chartPlaceholder}>
              <Text style={styles.errorText}>{i18n.t('errors.fetchFailed')}</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={styles.retryText}>{i18n.t('errors.tryAgain')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && !isError && chartData.length === 0 && (
            <View style={styles.chartPlaceholder}>
              <Text style={styles.loadingText}>{i18n.t('history.noData') as string}</Text>
            </View>
          )}

          {!isLoading && !isError && chartData.length > 0 && (
            <SimpleLineChart data={chartData} providers={presentProviders} />
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {presentProviders.map((name) => {
            const meta = PROVIDERS[name as ProviderName];
            return (
              <View key={name} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: meta?.color ?? '#888' },
                  ]}
                />
                <Text style={styles.legendLabel}>{name}</Text>
              </View>
            );
          })}
        </View>

        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            {i18n.t('history.lastUpdated')}: {lastUpdated}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  corridorSection: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  periodRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  periodBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  periodBtnActive: {
    backgroundColor: theme.colors.green,
    borderColor: theme.colors.green,
  },
  periodText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  periodTextActive: {
    color: '#fff',
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: CHART_HEIGHT + theme.spacing.md * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.red,
  },
  retryBtn: {
    backgroundColor: theme.colors.green,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
