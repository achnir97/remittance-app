import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useAppStore, UserType } from '../../store/useAppStore';

const W = Dimensions.get('window').width;
const CARD_W = (W - 48 - 12) / 2;

// ─── User type definitions ────────────────────────────────────────────────────

type TypeCard = {
  type: UserType;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  badge?: string;
  features: string[];
};

const TYPE_CARDS: TypeCard[] = [
  {
    type: 'worker',
    emoji: '👷',
    title: 'Migrant Worker',
    subtitle: 'E-9 · H-2 · E-7',
    color: theme.colors.success,
    bg: '#0A2820',
    badge: 'Most popular',
    features: ['Remittance rates', 'Legal rights', 'Expense tracking'],
  },
  {
    type: 'student',
    emoji: '🎓',
    title: 'International Student',
    subtitle: 'D-2 · D-4 visa',
    color: '#60C3FF',
    bg: '#091C2C',
    features: ['Budget tools', 'Work hour limits', 'Student rights'],
  },
  {
    type: 'tourist',
    emoji: '✈️',
    title: 'Tourist',
    subtitle: 'B-1 · B-2 · K-ETA',
    color: theme.colors.secondary,
    bg: '#261A08',
    features: ['Exchange rates', 'Emergency help', 'Travel tips'],
  },
  {
    type: 'resident',
    emoji: '🏡',
    title: 'Long-term Resident',
    subtitle: 'F-4 · F-5 · D-8',
    color: theme.colors.accent,
    bg: '#160F26',
    features: ['Full access', 'All features', 'Priority updates'],
  },
];

// Animated card component
function TypeCardItem({
  card,
  selected,
  anySelected,
  onPress,
}: {
  card: TypeCard;
  selected: boolean;
  anySelected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: selected ? 1.04 : anySelected && !selected ? 0.97 : 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      Animated.timing(opacityAnim, {
        toValue: anySelected && !selected ? 0.5 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected, anySelected]);

  return (
    <Animated.View
      style={[
        styles.card,
        selected && { borderColor: card.color, borderWidth: 2 },
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.cardInner}
        accessibilityLabel={`${card.title}${selected ? ', selected' : ''}`}
        accessibilityHint={card.subtitle}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
      >
        {/* Badge */}
        {card.badge && (
          <View style={[styles.badge, { backgroundColor: card.color + '22', borderColor: card.color + '44' }]}>
            <Text style={[styles.badgeText, { color: card.color }]}>{card.badge}</Text>
          </View>
        )}

        {/* Checkmark when selected */}
        {selected && (
          <View style={[styles.checkCircle, { backgroundColor: card.color }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}

        {/* Icon area */}
        <View style={[styles.emojiBox, { backgroundColor: card.bg }]}>
          <Text style={styles.emoji}>{card.emoji}</Text>
        </View>

        {/* Title & subtitle */}
        <Text style={[styles.cardTitle, selected && { color: card.color }]}>{card.title}</Text>
        <Text style={styles.cardSub}>{card.subtitle}</Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {card.features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={[styles.featureDot, { backgroundColor: card.color }]} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Bridge logo SVG
function BridgeLogo() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32">
      <Path d="M4 22 Q4 10 16 10 Q28 10 28 22" stroke={theme.colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Line x1="4" y1="22" x2="28" y2="22" stroke={theme.colors.primary} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="10" y1="22" x2="10" y2="15.5" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" />
      <Line x1="22" y1="22" x2="22" y2="15.5" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function UserTypeScreen() {
  const router = useRouter();
  const setUserType = useAppStore((s) => s.setUserType);
  const [selected, setSelected] = useState<UserType | null>(null);

  const ctaBtnScale = useRef(new Animated.Value(1)).current;

  const handleSelect = (type: UserType) => {
    setSelected((prev) => (prev === type ? null : type));
  };

  const handleContinue = () => {
    if (!selected) return;

    // Bounce the CTA button
    Animated.sequence([
      Animated.timing(ctaBtnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(ctaBtnScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      setUserType(selected);
      router.replace('/(tabs)/home');
    });
  };

  const selectedCard = TYPE_CARDS.find((c) => c.type === selected);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <BridgeLogo />
            <Text style={styles.brandName}>Bridge</Text>
          </View>
          <View style={styles.stepPill}>
            <Text style={styles.stepText}>Setup · 1 of 1</Text>
          </View>
        </View>

        {/* Hero text */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Who are you in Korea?</Text>
          <Text style={styles.heroSub}>
            We'll show you exactly what you need — nothing more, nothing less.{'\n'}
            You can change this anytime in Settings.
          </Text>
        </View>

        {/* Cards grid */}
        <View style={styles.grid}>
          {TYPE_CARDS.map((card) => (
            <TypeCardItem
              key={card.type}
              card={card}
              selected={selected === card.type}
              anySelected={selected !== null}
              onPress={() => handleSelect(card.type)}
            />
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaArea}>
          <Animated.View style={{ transform: [{ scale: ctaBtnScale }] }}>
            <TouchableOpacity
              style={[
                styles.ctaBtn,
                selected
                  ? { backgroundColor: selectedCard?.color ?? theme.colors.primary }
                  : styles.ctaBtnDisabled,
              ]}
              onPress={handleContinue}
              disabled={!selected}
              activeOpacity={0.88}
              accessibilityLabel={selected ? `Continue as ${selectedCard?.title}` : 'Select who you are to continue'}
              accessibilityRole="button"
              accessibilityState={{ disabled: !selected }}
            >
              <Text style={styles.ctaBtnText}>
                {selected
                  ? `Continue as ${selectedCard?.title}`
                  : 'Select who you are'}
              </Text>
              {selected && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.hint}>
            <Ionicons name="lock-closed-outline" size={11} color={theme.colors.textMuted} />
            {'  '}Your choice stays on your device only
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: theme.fontSize.lg, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: -0.3 },
  stepPill: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepText: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '600' },

  hero: { marginBottom: theme.spacing.xl },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  heroSub: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 21,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },

  card: {
    width: CARD_W,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
    }),
  },
  cardInner: { padding: theme.spacing.md, gap: 6 },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  checkCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emoji: { fontSize: 28 },

  cardTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  cardSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  featureList: { gap: 4, marginTop: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureDot: { width: 5, height: 5, borderRadius: 3 },
  featureText: { fontSize: 10, color: theme.colors.textSecondary, flex: 1 },

  ctaArea: { gap: theme.spacing.md },
  ctaBtn: {
    borderRadius: theme.radius.xl,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  ctaBtnDisabled: {
    backgroundColor: theme.colors.bg2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ctaBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});
