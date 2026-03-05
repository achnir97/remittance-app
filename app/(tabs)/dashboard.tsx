import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function DashboardScreen() {
  const language = useAppStore((s) => s.language);
  void language; // Re-render when language changes so i18n strings update
  const selectedPeriod = useAppStore((s) => s.selectedPeriod);
  const customDateRange = useAppStore((s) => s.customDateRange);
  const setSelectedPeriod = useAppStore((s) => s.setSelectedPeriod);
  const setCustomDateRange = useAppStore((s) => s.setCustomDateRange);

  const { from, to } = useMemo(
    () => presetToDates(selectedPeriod, customDateRange),
    [selectedPeriod, customDateRange]
  );

  const daysDiff = useMemo(() => {
    return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1;
  }, [from, to]);

  const { data: transactions = [] } = useTransactionsInRange(from, to);
  const { data: dailyData = [] } = useDailyTotals(from, to);
  const { data: weeklyData = [] } = useWeeklyTotals(from, to);
  const { data: monthlyData = [] } = useMonthlyTotals(from, to);
  const { data: remittances = [] } = useRemittancesInRange(from, to);
  const { data: incomeData = [] } = useIncomeInRange(from, to);
  const { data: savingsGoal } = useSavingsGoal();
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
      CATEGORY_KEYS.filter((cat) => (byCategory[cat]?.length ?? 0) > 0).map((cat) => ({
        category: cat as SpendingCategory,
        total: byCategory[cat]?.reduce((s, t) => s + t.amount_krw, 0) ?? 0,
        transactions: byCategory[cat] ?? [],
      })),
    [byCategory]
  );

  const handlePeriodChange = (preset: PeriodPreset, custom?: { from: string; to: string }) => {
    setSelectedPeriod(preset);
    if (preset === 'custom' && custom) setCustomDateRange(custom);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const hasData = transactions.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{i18n.t('dashboard.title')}</Text>
          <Text style={styles.subtitle}>
            {i18n.t('dashboard.subtitle')}
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period selector and hero summary */}
        <PeriodSelector
          value={selectedPeriod}
          customRange={customDateRange}
          onChange={handlePeriodChange}
        />
        <SummaryCard stats={stats} compact={!hasData} />

        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* Donut chart */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {i18n.t('dashboard.spendingByCategory')}
              </Text>
            </View>
            <View style={styles.card}>
              <DonutChart
                data={categoryList.map((c) => ({
                  category: c.category,
                  total: c.total,
                }))}
              />
            </View>

            {/* Bar chart — auto-granularity */}
            <SpendingBarChart
              dailyData={dailyData}
              weeklyData={weeklyData}
              monthlyData={monthlyData}
              daysDiff={daysDiff}
            />

            {/* Income vs Spending line chart */}
            <SpendingVsIncome
              monthlySpending={monthlyData}
              income={incomeData}
            />

            {/* Remittance timeline */}
            {remittances.length > 0 && (
              <RemittanceTimeline remittances={remittances} />
            )}

            {/* Savings progress */}
            {savingsGoal && totalIncome > 0 && (
              <SavingsProgress
                totalSpent={stats.totalSpent}
                incomeKrw={totalIncome}
                goalKrw={savingsGoal.target_krw}
              />
            )}

            {/* Category cards */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {i18n.t('dashboard.transactions')}
              </Text>
            </View>

            {categoryList.map((item) => (
              <CategoryCard
                key={item.category}
                category={item.category}
                total={item.total}
                transactions={item.transactions}
                onDeleteTransaction={handleDelete}
              />
            ))}
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
});
