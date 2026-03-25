import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { PeriodSelector } from '../../components/dashboard/PeriodSelector';
import { SummaryCard } from '../../components/dashboard/SummaryCard';
import { DonutChart } from '../../components/dashboard/DonutChart';
import { SpendingBarChart } from '../../components/dashboard/SpendingBarChart';
import { SpendingVsIncome } from '../../components/dashboard/SpendingVsIncome';
import { RemittanceTimeline } from '../../components/dashboard/RemittanceTimeline';
import { SavingsProgress } from '../../components/dashboard/SavingsProgress';
import { CategoryCard } from '../../components/dashboard/CategoryCard';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useAppStore, PeriodPreset } from '../../store/useAppStore';
import { useSpendingStats, daysToDateRange } from '../../hooks/useSpendingStats';
import {
  useTransactionsInRange,
  useDailyTotals,
  useWeeklyTotals,
  useMonthlyTotals,
  useRemittancesInRange,
  useIncomeInRange,
  useSavingsGoal,
  useDeleteTransaction,
} from '../../hooks/useTransactions';
import { SpendingCategory } from '../../types';
import { TransactionRow } from '../../services/db';
import { CATEGORY_KEYS } from '../../constants/categories';
// TODO: Remove mock data imports when real data is live
import {
  USE_MOCK_DATA,
  MOCK_TRANSACTIONS,
  MOCK_REMITTANCES,
  MOCK_INCOME,
  MOCK_SAVINGS_GOAL,
  filterMockByDate,
  filterMockRemittances,
  getMockDailyTotals,
  getMockWeeklyTotals,
  getMockMonthlyTotals,
} from '../../constants/mockData';

// ─── Helpers ────────────────────────────────────────────────────────────────

function presetToDates(
  preset: PeriodPreset,
  custom: { from: string; to: string } | null
): { from: string; to: string } {
  if (preset === 'custom' && custom) return custom;
  const daysMap: Record<PeriodPreset, number> = {
    today: 1,
    '7d': 7,
    '14d': 14,
    '1m': 30,
    '2m': 60,
    custom: 30,
  };
  return daysToDateRange(daysMap[preset] ?? 30);
}

function formatDateShort(iso: string): string {
  // "2026-03-01" → "Mar 1"
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `₩${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `₩${Math.round(n / 1_000)}K`;
  return `₩${n.toLocaleString()}`;
}

// ─── Inline SectionHeader component (not exported) ───────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.accent} />
      <Text style={sectionStyles.label}>{label}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    gap: 8,
  },
  accent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: theme.colors.textMuted,
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  // Subscribe to language so i18n strings re-render when locale switches.
  // useAppStore selector is referentially stable — no re-render cost beyond language changes.
  useAppStore((s) => s.language);
  const selectedPeriod = useAppStore((s) => s.selectedPeriod);
  const customDateRange = useAppStore((s) => s.customDateRange);
  const setSelectedPeriod = useAppStore((s) => s.setSelectedPeriod);
  const setCustomDateRange = useAppStore((s) => s.setCustomDateRange);

  const { from, to } = useMemo(
    () => presetToDates(selectedPeriod, customDateRange),
    [selectedPeriod, customDateRange]
  );

  const daysDiff = useMemo(() => {
    return (
      Math.round(
        (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000
      ) + 1
    );
  }, [from, to]);

  const { data: realTx = [], isLoading: txLoading } = useTransactionsInRange(from, to);
  const { data: realRemittances = [] } = useRemittancesInRange(from, to);
  const { data: realIncome = [] } = useIncomeInRange(from, to);
  const { data: realSavingsGoal } = useSavingsGoal();

  // TODO: Remove mock data — replace with real DB data when live
  const isMock = USE_MOCK_DATA && realTx.length === 0;
  const transactions = isMock ? filterMockByDate(MOCK_TRANSACTIONS, from, to) : realTx;
  const remittances = isMock ? filterMockRemittances(MOCK_REMITTANCES, from, to) : realRemittances;
  const incomeData = isMock ? MOCK_INCOME.filter((r) => r.date >= from && r.date <= to) : realIncome;
  const savingsGoal = isMock ? MOCK_SAVINGS_GOAL : realSavingsGoal;

  const { data: realDaily = [] } = useDailyTotals(from, to);
  const { data: realWeekly = [] } = useWeeklyTotals(from, to);
  const { data: realMonthly = [] } = useMonthlyTotals(from, to);
  // TODO: Remove mock aggregates
  const dailyData = isMock ? getMockDailyTotals(transactions) : realDaily;
  const weeklyData = isMock ? getMockWeeklyTotals(transactions) : realWeekly;
  const monthlyData = isMock ? getMockMonthlyTotals(transactions) : realMonthly;
  const deleteMutation = useDeleteTransaction();

  const stats = useSpendingStats(transactions, from, to);

  const totalIncome = useMemo(
    () => incomeData.reduce((s, r) => s + r.amount_krw, 0),
    [incomeData]
  );

  // Group transactions by category
  const byCategory = useMemo(() => {
    const map: Record<string, TransactionRow[]> = {};
    for (const tx of transactions) {
      const cat = tx.category;
      if (!map[cat]) map[cat] = [];
      map[cat].push(tx);
    }
    return map;
  }, [transactions]);

  const categoryList = useMemo(
    () =>
      CATEGORY_KEYS.filter((cat) => (byCategory[cat]?.length ?? 0) > 0).map(
        (cat) => ({
          category: cat as SpendingCategory,
          total: byCategory[cat]?.reduce((s, t) => s + t.amount_krw, 0) ?? 0,
          transactions: byCategory[cat] ?? [],
        })
      ),
    [byCategory]
  );

  const handlePeriodChange = useCallback(
    (preset: PeriodPreset, custom?: { from: string; to: string }) => {
      setSelectedPeriod(preset);
      if (preset === 'custom' && custom) setCustomDateRange(custom);
    },
    [setSelectedPeriod, setCustomDateRange]
  );

  const handleDelete = useCallback(
    (id: number) => { deleteMutation.mutate(id); },
    [deleteMutation]
  );

  const hasData = transactions.length > 0;

  const { netFlow, netPositive, showNetFlow } = useMemo(() => {
    const flow = totalIncome - stats.totalSpent;
    return { netFlow: flow, netPositive: flow >= 0, showNetFlow: totalIncome > 0 };
  }, [totalIncome, stats.totalSpent]);

  const periodSubtitle = useMemo(
    () =>
      selectedPeriod === 'today'
        ? 'Today'
        : `${formatDateShort(from)} – ${formatDateShort(to)}`,
    [selectedPeriod, from, to]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Sticky PeriodSelector strip */}
      <PeriodSelector
        value={selectedPeriod}
        customRange={customDateRange}
        onChange={handlePeriodChange}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Demo badge — TODO: Remove with mock data */}
        {isMock && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoText}>🧪 Showing demo data · Scan receipts to see your real spending</Text>
          </View>
        )}

        {/* ── Hero Header (inside ScrollView) ── */}
        <View style={styles.heroHeader}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>{i18n.t('dashboard.title')}</Text>
            <Text style={styles.heroSubtitle}>{periodSubtitle}</Text>
          </View>
          <View style={styles.heroIconBtn}>
            <Ionicons
              name="bar-chart-outline"
              size={20}
              color={theme.colors.primaryLight}
            />
          </View>
        </View>

        {/* ── Content (skeleton while loading) ── */}
        {txLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <SummaryCard stats={stats} compact={!hasData} />

            {/* ── Net Flow chip ── */}
            {showNetFlow && (
              <View style={styles.netFlowRow}>
                <Ionicons
                  name={netPositive ? 'trending-up-outline' : 'trending-down-outline'}
                  size={15}
                  color={netPositive ? theme.colors.success : theme.colors.error}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.netFlowLabel,
                    { color: netPositive ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  NET FLOW
                </Text>
                <Text
                  style={[
                    styles.netFlowValue,
                    { color: netPositive ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {netPositive ? '+' : ''}
                  {fmt(netFlow)}
                </Text>
                <Text style={styles.netFlowSub}>
                  {netPositive ? 'surplus' : 'deficit'} this period
                </Text>
              </View>
            )}

            {!hasData ? (
              <EmptyState />
            ) : (
              <>
                {/* ── Spending by Category ── */}
                <SectionHeader label={i18n.t('dashboard.spendingByCategory')} />
                <View style={styles.card}>
                  <DonutChart
                    data={categoryList.map((c) => ({
                      category: c.category,
                      total: c.total,
                    }))}
                  />
                </View>

                {/* ── Bar Chart ── */}
                <SpendingBarChart
                  dailyData={dailyData}
                  weeklyData={weeklyData}
                  monthlyData={monthlyData}
                  daysDiff={daysDiff}
                />

                {/* ── Income vs Spending ── */}
                <SpendingVsIncome
                  monthlySpending={monthlyData}
                  income={incomeData}
                />

                {/* ── Remittance Timeline ── */}
                {remittances.length > 0 && (
                  <RemittanceTimeline remittances={remittances} />
                )}

                {/* ── Savings Progress ── */}
                {savingsGoal && totalIncome > 0 && (
                  <SavingsProgress
                    totalSpent={stats.totalSpent}
                    incomeKrw={totalIncome}
                    goalKrw={savingsGoal.target_krw}
                  />
                )}

                {/* ── Category Breakdown ── */}
                <SectionHeader label={i18n.t('dashboard.transactions')} />
                {categoryList.map((item) => (
                  <CategoryCard
                    key={item.category}
                    category={item.category}
                    total={item.total}
                    transactions={item.transactions}
                    onDeleteTransaction={handleDelete}
                    grandTotal={stats.totalSpent}
                  />
                ))}
              </>
            )}
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
  scroll: { flex: 1 },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },

  // Hero header
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginLeft: theme.spacing.md,
  },

  // Net flow chip
  netFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    gap: 4,
    alignSelf: 'flex-start',
  },
  netFlowLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  netFlowValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  netFlowSub: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },

  // Demo banner
  demoBanner: {
    backgroundColor: 'rgba(155, 114, 255, 0.08)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(155, 114, 255, 0.25)',
  },
  demoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Donut card wrapper
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
});
