import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore, UserType } from '../../store/useAppStore';

const W = Dimensions.get('window').width;
const CARD_W = (W - 48 - 12) / 2;

// ─── Feature registry ─────────────────────────────────────────────────────────

type FeatureId =
  | 'compare' | 'history' | 'scan' | 'dashboard' | 'legal' | 'hotlines'
  | 'healthcare' | 'housing' | 'transport' | 'food'
  | 'language' | 'community' | 'visa' | 'jobrights';

type Feature = {
  id: FeatureId;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  color: string;
  bg: string;
  route?: string;
  soon?: boolean;
};

const FEATURES: Record<FeatureId, Feature> = {
  compare:    { id: 'compare',    icon: 'cash-outline',            label: 'Compare Rates',        desc: 'Best live rates across banks & apps',           color: theme.colors.primary,    bg: '#1B2F4A', route: '/(tabs)/index' },
  history:    { id: 'history',    icon: 'trending-up-outline',     label: 'Rate History',         desc: 'Track how rates moved over time',               color: '#60C3FF',               bg: '#0E2233', route: '/(tabs)/history' },
  scan:       { id: 'scan',       icon: 'camera-outline',          label: 'Scan Receipt',         desc: 'AI reads your receipt in seconds',              color: theme.colors.secondary,  bg: '#2E2210', route: '/(tabs)/scan' },
  dashboard:  { id: 'dashboard',  icon: 'pie-chart-outline',       label: 'Analytics',            desc: 'Spending, savings & income dashboard',          color: theme.colors.success,    bg: '#0D2E27', route: '/(tabs)/dashboard' },
  legal:      { id: 'legal',      icon: 'document-text-outline',   label: 'Legal Advisor',        desc: 'AI answers on contracts & rights',              color: theme.colors.accent,     bg: '#1E1535', route: '/(tabs)/legal' },
  hotlines:   { id: 'hotlines',   icon: 'call-outline',            label: 'Emergency Hotlines',   desc: 'Migrant worker support numbers',                color: '#FF6B8A',               bg: '#2E1020', route: '/(tabs)/legal' },
  healthcare: { id: 'healthcare', icon: 'medical-outline',         label: 'Healthcare Guide',     desc: 'Hospitals, insurance & terminology',            color: '#34D399',               bg: '#0B2820', soon: true },
  housing:    { id: 'housing',    icon: 'home-outline',            label: 'Housing Help',         desc: 'Jeonse, monthly rent explained',                color: '#60C3FF',               bg: '#0E2233', soon: true },
  transport:  { id: 'transport',  icon: 'bus-outline',             label: 'Transport',            desc: 'Subway, T-money & intercity travel',            color: theme.colors.secondary,  bg: '#2E2210', soon: true },
  food:       { id: 'food',       icon: 'restaurant-outline',      label: 'Food & Groceries',     desc: 'Halal, vegetarian & Asian markets',             color: '#F97316',               bg: '#2A1A08', soon: true },
  language:   { id: 'language',   icon: 'language-outline',        label: 'Language Tools',       desc: 'Korean phrases & translation help',             color: '#C084FC',               bg: '#1C1130', soon: true },
  community:  { id: 'community',  icon: 'people-outline',          label: 'Community',            desc: 'Connect with your nationality group',           color: '#38BDF8',               bg: '#0C1E2E', soon: true },
  visa:       { id: 'visa',       icon: 'card-outline',            label: 'Visa & ARC',           desc: 'ARC renewal, visa types explained',             color: theme.colors.success,    bg: '#0D2E27', soon: true },
  jobrights:  { id: 'jobrights',  icon: 'briefcase-outline',       label: 'Job Rights',           desc: 'Overtime, dismissal & contract rules',          color: theme.colors.secondary,  bg: '#2E2210', soon: true },
};

// ─── Per-user-type configuration ─────────────────────────────────────────────

type InsightConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
  bg: string;
};

type SectionConfig = {
  sectionIcon: keyof typeof Ionicons.glyphMap;
  sectionLabel: string;
  sectionColor: string;
  featureIds: FeatureId[];
  comingSoonNote?: string;
};

type UserConfig = {
  emoji: string;
  badge: string;
  badgeColor: string;
  heroTitle: string;
  heroHighlight: string;
  heroSub: string;
  insight: InsightConfig;
  quickActionIds: FeatureId[];
  sections: SectionConfig[];
  stats: { label: string; value: string }[];
};

const CONFIG: Record<UserType, UserConfig> = {
  worker: {
    emoji: '👷',
    badge: 'Migrant Worker',
    badgeColor: theme.colors.success,
    heroTitle: 'Your rights, your money —',
    heroHighlight: 'all in one place.',
    heroSub: 'Send money home at the best rate, track every won, and know exactly what you\'re owed.',
    insight: {
      icon: 'shield-checkmark-outline',
      text: 'Under the Labor Standards Act, overtime must be paid at 150% of your hourly rate.',
      color: theme.colors.success,
      bg: '#0A2820',
    },
    quickActionIds: ['compare', 'scan', 'legal', 'dashboard', 'history'],
    stats: [
      { label: 'Banks tracked', value: '12+' },
      { label: 'Legal topics', value: '50+' },
      { label: 'Languages', value: '9' },
    ],
    sections: [
      {
        sectionIcon: 'cash-outline',
        sectionLabel: 'Money & Finance',
        sectionColor: theme.colors.primary,
        featureIds: ['compare', 'history', 'scan', 'dashboard'],
      },
      {
        sectionIcon: 'shield-checkmark-outline',
        sectionLabel: 'Rights & Legal',
        sectionColor: theme.colors.accent,
        featureIds: ['legal', 'hotlines'],
      },
      {
        sectionIcon: 'heart-outline',
        sectionLabel: 'Health & Living',
        sectionColor: '#34D399',
        featureIds: ['healthcare', 'housing', 'transport', 'food'],
        comingSoonNote: 'Coming soon — vote for what you need most in Settings',
      },
      {
        sectionIcon: 'people-outline',
        sectionLabel: 'Community & Admin',
        sectionColor: '#38BDF8',
        featureIds: ['language', 'community', 'visa', 'jobrights'],
        comingSoonNote: 'Building the future of migrant support in Korea',
      },
    ],
  },

  student: {
    emoji: '🎓',
    badge: 'International Student',
    badgeColor: '#60C3FF',
    heroTitle: 'Budget smart,',
    heroHighlight: 'know your limits.',
    heroSub: 'Track spending, understand part-time work rules, and make the most of student life in Korea.',
    insight: {
      icon: 'information-circle-outline',
      text: 'D-2 visa holders can work up to 20 hours/week during semesters and full-time during breaks.',
      color: '#60C3FF',
      bg: '#091C2C',
    },
    quickActionIds: ['scan', 'dashboard', 'legal', 'compare', 'history'],
    stats: [
      { label: 'Work limit', value: '20hr' },
      { label: 'Legal topics', value: '50+' },
      { label: 'Languages', value: '9' },
    ],
    sections: [
      {
        sectionIcon: 'wallet-outline',
        sectionLabel: 'Budget & Finance',
        sectionColor: '#60C3FF',
        featureIds: ['scan', 'dashboard', 'compare', 'history'],
      },
      {
        sectionIcon: 'shield-checkmark-outline',
        sectionLabel: 'Student Rights',
        sectionColor: theme.colors.accent,
        featureIds: ['legal', 'hotlines'],
      },
      {
        sectionIcon: 'globe-outline',
        sectionLabel: 'Language & Community',
        sectionColor: '#C084FC',
        featureIds: ['language', 'community', 'visa'],
        comingSoonNote: 'Korean tools and study resources launching soon',
      },
      {
        sectionIcon: 'heart-outline',
        sectionLabel: 'Life on Campus',
        sectionColor: '#34D399',
        featureIds: ['healthcare', 'housing', 'food'],
        comingSoonNote: 'Health, housing and food guides coming soon',
      },
    ],
  },

  tourist: {
    emoji: '✈️',
    badge: 'Tourist',
    badgeColor: theme.colors.secondary,
    heroTitle: 'Best exchange rate,',
    heroHighlight: 'safe travels.',
    heroSub: 'Get the best won exchange rate and find emergency help — worry-free exploring in Korea.',
    insight: {
      icon: 'alert-circle-outline',
      text: 'Tip: Airport exchange rates are typically 10–15% worse than bank rates. Check Bridge first.',
      color: theme.colors.secondary,
      bg: '#261A08',
    },
    quickActionIds: ['compare', 'history', 'hotlines'],
    stats: [
      { label: 'Exchange options', value: '12+' },
      { label: 'Emergency lines', value: '24/7' },
      { label: 'Languages', value: '9' },
    ],
    sections: [
      {
        sectionIcon: 'cash-outline',
        sectionLabel: 'Currency & Exchange',
        sectionColor: theme.colors.secondary,
        featureIds: ['compare', 'history'],
      },
      {
        sectionIcon: 'alert-circle-outline',
        sectionLabel: 'Emergency & Safety',
        sectionColor: '#FF6B8A',
        featureIds: ['hotlines', 'legal'],
      },
      {
        sectionIcon: 'compass-outline',
        sectionLabel: 'Explore Korea',
        sectionColor: '#38BDF8',
        featureIds: ['transport', 'food', 'language'],
        comingSoonNote: 'Transport, food guides and translation tools coming soon',
      },
    ],
  },

  resident: {
    emoji: '🏡',
    badge: 'Long-term Resident',
    badgeColor: theme.colors.accent,
    heroTitle: 'Life in Korea,',
    heroHighlight: 'fully covered.',
    heroSub: 'Complete access to every Bridge feature — money, legal, community, and all that\'s coming.',
    insight: {
      icon: 'star-outline',
      text: 'As a long-term resident you have full access to all Bridge features, plus early access to new tools.',
      color: theme.colors.accent,
      bg: '#160F26',
    },
    quickActionIds: ['compare', 'scan', 'legal', 'dashboard', 'history'],
    stats: [
      { label: 'Banks tracked', value: '12+' },
      { label: 'Legal topics', value: '50+' },
      { label: 'Languages', value: '9' },
    ],
    sections: [
      {
        sectionIcon: 'cash-outline',
        sectionLabel: 'Money & Finance',
        sectionColor: theme.colors.primary,
        featureIds: ['compare', 'history', 'scan', 'dashboard'],
      },
      {
        sectionIcon: 'shield-checkmark-outline',
        sectionLabel: 'Rights & Legal',
        sectionColor: theme.colors.accent,
        featureIds: ['legal', 'hotlines'],
      },
      {
        sectionIcon: 'heart-outline',
        sectionLabel: 'Health & Living',
        sectionColor: '#34D399',
        featureIds: ['healthcare', 'housing', 'transport', 'food'],
        comingSoonNote: 'Coming soon — you\'ll get early access as a resident',
      },
      {
        sectionIcon: 'people-outline',
        sectionLabel: 'Community & Admin',
        sectionColor: '#38BDF8',
        featureIds: ['language', 'community', 'visa', 'jobrights'],
        comingSoonNote: 'Building the future of life in Korea',
      },
    ],
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BridgeLogo() {
  return (
    <Svg width={26} height={26} viewBox="0 0 32 32">
      <Path d="M4 22 Q4 10 16 10 Q28 10 28 22" stroke={theme.colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Line x1="4" y1="22" x2="28" y2="22" stroke={theme.colors.primary} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="10" y1="22" x2="10" y2="15.5" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" />
      <Line x1="22" y1="22" x2="22" y2="15.5" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SectionHeader({
  icon, label, color,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
  return (
    <View style={sh.row}>
      <View style={[sh.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={sh.label}>{label}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconBox: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
});

function FeatureCard({ feature, onPress }: { feature: Feature; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.featureCard, feature.soon && styles.featureCardSoon]}
      onPress={feature.soon ? undefined : onPress}
      activeOpacity={feature.soon ? 1 : 0.78}
    >
      <View style={styles.featureCardTop}>
        <View style={[styles.featureIconBox, { backgroundColor: feature.bg }]}>
          <Ionicons name={feature.icon} size={22} color={feature.soon ? theme.colors.textMuted : feature.color} />
        </View>
        {feature.soon && (
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>SOON</Text>
          </View>
        )}
      </View>
      <Text style={[styles.featureLabel, feature.soon && { color: theme.colors.textMuted }]}>
        {feature.label}
      </Text>
      <Text style={styles.featureDesc} numberOfLines={2}>{feature.desc}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userType = useAppStore((s) => s.userType) ?? 'worker';

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? 'there';

  const cfg = CONFIG[userType];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <BridgeLogo />
            </View>
            <View>
              <Text style={styles.brandName}>Bridge</Text>
              <Text style={styles.brandTagline}>Life in Korea, simplified</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/settings' as never)}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── User type badge + greeting ── */}
        <View style={styles.greetingRow}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.badgeColor + '18', borderColor: cfg.badgeColor + '40' }]}>
            <Text style={styles.typeEmoji}>{cfg.emoji}</Text>
            <Text style={[styles.typeBadgeText, { color: cfg.badgeColor }]}>{cfg.badge}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.navigate('/(onboarding)/user-type' as never)}
            style={styles.changeTypeBtn}
          >
            <Text style={styles.changeTypeText}>Switch</Text>
            <Ionicons name="swap-horizontal-outline" size={12} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={styles.heroGreeting}>Hello, {firstName} 👋</Text>
          <Text style={styles.heroTitle}>{cfg.heroTitle}</Text>
          <Text style={styles.heroHighlight}>{cfg.heroHighlight}</Text>
          <Text style={styles.heroSub}>{cfg.heroSub}</Text>
        </View>

        {/* ── Insight banner ── */}
        <View style={[styles.insightBanner, { backgroundColor: cfg.insight.bg, borderColor: cfg.insight.color + '35' }]}>
          <View style={[styles.insightIconBox, { backgroundColor: cfg.insight.color + '20' }]}>
            <Ionicons name={cfg.insight.icon} size={18} color={cfg.insight.color} />
          </View>
          <Text style={[styles.insightText, { color: cfg.insight.color === theme.colors.success ? theme.colors.textSecondary : theme.colors.textSecondary }]}>
            {cfg.insight.text}
          </Text>
        </View>

        {/* ── Stats strip ── */}
        <View style={styles.statsStrip}>
          {cfg.stats.map((s, i) => (
            <View key={s.label} style={[styles.statItem, i < cfg.stats.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionHeading}>Quick Access</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          {cfg.quickActionIds.map((id) => {
            const f = FEATURES[id];
            return (
              <TouchableOpacity
                key={id}
                style={styles.quickBtn}
                onPress={() => f.route && router.navigate(f.route as never)}
                activeOpacity={0.78}
              >
                <View style={[styles.quickIcon, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={22} color={f.color} />
                </View>
                <Text style={styles.quickLabel}>{f.label.replace(' ', '\n')}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Feature sections ── */}
        {cfg.sections.map((section) => {
          const features = section.featureIds.map((id) => FEATURES[id]);
          return (
            <View key={section.sectionLabel}>
              {section.comingSoonNote ? (
                <View style={styles.soonSectionHeader}>
                  <SectionHeader
                    icon={section.sectionIcon}
                    label={section.sectionLabel}
                    color={section.sectionColor}
                  />
                  <View style={styles.comingSoonBanner}>
                    <Ionicons name="construct-outline" size={12} color={theme.colors.secondary} />
                    <Text style={styles.comingSoonText}>{section.comingSoonNote}</Text>
                  </View>
                </View>
              ) : (
                <SectionHeader
                  icon={section.sectionIcon}
                  label={section.sectionLabel}
                  color={section.sectionColor}
                />
              )}
              <View style={styles.featureGrid}>
                {features.map((f) => (
                  <FeatureCard
                    key={f.id}
                    feature={f}
                    onPress={() => f.route && router.navigate(f.route as never)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {/* ── Mission footer ── */}
        <View style={styles.missionCard}>
          <View style={styles.missionLogoRow}>
            <BridgeLogo />
            <Text style={styles.missionBrand}>Bridge</Text>
          </View>
          <Text style={styles.missionText}>
            Built for the 1.4 million foreign workers, students, and residents living in Korea. Every challenge — Bridge has the solution.
          </Text>
          <View style={styles.flags}>
            {['🇳🇵', '🇰🇭', '🇻🇳', '🇧🇩', '🇵🇭', '🇨🇳', '🇹🇭', '🇲🇲', '🇮🇩'].map((f) => (
              <Text key={f} style={styles.flag}>{f}</Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: theme.colors.bg2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  brandName: { fontSize: theme.fontSize.lg, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  brandTagline: { fontSize: 10, color: theme.colors.textMuted, letterSpacing: 0.3, marginTop: 1 },
  avatarCircle: {
    width: 36, height: 36, borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: theme.radius.full, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  typeEmoji: { fontSize: 14 },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  changeTypeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  changeTypeText: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '600' },

  hero: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  heroGreeting: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginBottom: 6 },
  heroTitle: { fontSize: 23, fontWeight: '700', color: theme.colors.textSecondary, lineHeight: 30, letterSpacing: -0.3 },
  heroHighlight: { fontSize: 23, fontWeight: '800', color: theme.colors.primary, lineHeight: 30, letterSpacing: -0.3, marginBottom: 10 },
  heroSub: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, lineHeight: 20 },

  insightBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  insightIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  insightText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
    flex: 1,
  },

  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statBorder: { borderRightWidth: 1, borderRightColor: theme.colors.border },
  statValue: { fontSize: theme.fontSize.lg, fontWeight: '800', color: theme.colors.primary },
  statLabel: { fontSize: 10, color: theme.colors.textMuted, marginTop: 2, textAlign: 'center' },

  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 10,
  },

  quickRow: { paddingHorizontal: theme.spacing.lg, gap: 12, marginBottom: theme.spacing.xl },
  quickBtn: { alignItems: 'center', gap: 6, width: 70 },
  quickIcon: {
    width: 58, height: 58, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  quickLabel: { fontSize: 10, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 14 },

  soonSectionHeader: { paddingHorizontal: theme.spacing.lg },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  featureCard: {
    width: CARD_W,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 5,
  },
  featureCardSoon: { opacity: 0.5 },
  featureCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  featureIconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  soonBadge: {
    backgroundColor: theme.colors.bg3,
    borderRadius: theme.radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  soonText: { fontSize: 8, fontWeight: '800', color: theme.colors.textMuted, letterSpacing: 0.5 },
  featureLabel: { fontSize: theme.fontSize.sm, fontWeight: '700', color: theme.colors.textPrimary },
  featureDesc: { fontSize: 11, color: theme.colors.textMuted, lineHeight: 15 },

  comingSoonBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md, paddingVertical: 7,
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: 12,
  },
  comingSoonText: { fontSize: 11, color: theme.colors.textMuted, flex: 1 },

  missionCard: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  missionLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  missionBrand: { fontSize: theme.fontSize.lg, fontWeight: '800', color: theme.colors.textPrimary },
  missionText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, lineHeight: 22 },
  flags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  flag: { fontSize: 20 },
});
