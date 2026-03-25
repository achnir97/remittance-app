import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useRates } from '../../hooks/useRates';
import { useAppStore } from '../../store/useAppStore';
import { CorridorPicker } from '../../components/CorridorPicker';
import { AmountInput } from '../../components/AmountInput';
import { ProviderCard } from '../../components/ProviderCard';
import { RateSummaryStrip } from '../../components/RateSummaryStrip';
import { BankComparisonCard } from '../../components/BankComparisonCard';
import { InsightBanner } from '../../components/InsightBanner';
import { StaleWarning } from '../../components/StaleWarning';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { theme } from '../../constants/theme';
import { Corridor, ProviderResult } from '../../types';
import { i18n } from '../../locales/i18n';
// TODO: Remove mock data when backend is live
import { USE_MOCK_DATA, MOCK_RATES, scaleMockProviders } from '../../constants/mockData';

export default function CompareScreen() {
  const corridor = useAppStore((s) => s.corridor);
  const setCorridor = useAppStore((s) => s.setCorridor);
  const sendAmount = useAppStore((s) => s.sendAmount);
  const setSendAmount = useAppStore((s) => s.setSendAmount);
  const cachedRates = useAppStore((s) => s.cachedRates);
  const language = useAppStore((s) => s.language);
  void language;

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const { data, isLoading, isError, refetch, isRefetching } = useRates();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCorridorChange = useCallback(
    (c: Corridor) => {
      setCorridor(c);
    },
    [setCorridor]
  );

  const handleAmountChange = useCallback(
    (amount: number) => {
      setSendAmount(amount);
    },
    [setSendAmount]
  );

  const cacheKey = `${corridor.from}-${corridor.to}`;
  const offlineProviders: ProviderResult[] = cachedRates[cacheKey] ?? [];

  const liveProviders = data?.providers ?? (isOffline ? offlineProviders : []);
  // TODO: Remove mock fallback when backend is live
  const isMock = USE_MOCK_DATA && !isLoading && liveProviders.length === 0;
  const providers = isMock ? scaleMockProviders(MOCK_RATES.providers, sendAmount) : liveProviders;
  const sorted = [...providers].sort((a, b) => b.recipient_gets - a.recipient_gets);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('compare.title')}</Text>
        <View style={styles.liveDot} />
      </View>

      {/* Corridor picker */}
      <View style={styles.corridorSection}>
        <CorridorPicker selected={corridor} onSelect={handleCorridorChange} />
      </View>

      {/* Amount input */}
      <AmountInput amount={sendAmount} onChange={handleAmountChange} />

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.green}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Offline banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              📡 {i18n.t('errors.noInternet')}
            </Text>
          </View>
        )}

        {/* Demo badge — TODO: Remove with mock data */}
        {isMock && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoText}>🧪 Demo data · KRW → NPR · 300,000 KRW baseline</Text>
          </View>
        )}

        {/* Stale warning */}
        {data?.stale && data.fetched_at && (
          <StaleWarning fetchedAt={data.fetched_at} />
        )}

        {/* Insight banner */}
        <InsightBanner loading={isLoading} />

        {/* Loading state */}
        {isLoading && !isOffline && <LoadingSkeleton />}

        {/* Error state */}
        {isError && !isOffline && !isMock && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{i18n.t('errors.fetchFailed')}</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryBtn}>
              <Text style={styles.retryText}>{i18n.t('errors.tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Provider cards */}
        {sorted.map((result, index) => (
          <ProviderCard
            key={result.provider}
            result={result}
            sendAmount={sendAmount}
            index={index}
          />
        ))}

        {/* Summary strip */}
        {sorted.length > 0 && (
          <>
            <RateSummaryStrip providers={sorted} />
            <BankComparisonCard providers={sorted} sendAmount={sendAmount} />
          </>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.green,
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
  demoBanner: {
    backgroundColor: 'rgba(155, 114, 255, 0.1)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(155, 114, 255, 0.3)',
  },
  demoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    textAlign: 'center',
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  offlineText: {
    fontSize: theme.fontSize.sm,
    color: '#F5A623',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  retryBtn: {
    backgroundColor: theme.colors.green,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    marginTop: theme.spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
