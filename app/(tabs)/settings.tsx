import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, UserType } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CorridorPicker } from '../../components/CorridorPicker';
import { theme } from '../../constants/theme';
import { Corridor, Language } from '../../types';
import { PROVIDER_LINKS } from '../../constants/providerLinks';
import { PROVIDERS } from '../../constants/providers';
import { i18n } from '../../locales/i18n';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

const USER_TYPE_META: Record<UserType, { emoji: string; label: string; color: string }> = {
  worker:   { emoji: '👷', label: 'Migrant Worker',        color: '#00C896' },
  student:  { emoji: '🎓', label: 'International Student', color: '#60C3FF' },
  tourist:  { emoji: '✈️', label: 'Tourist',               color: '#F5A623' },
  resident: { emoji: '🏡', label: 'Long-term Resident',    color: '#9B72FF' },
};

// All 9 languages shown in their own native script — critical for non-English readers
const LANGUAGES: { code: Language; nativeLabel: string }[] = [
  { code: 'en',  nativeLabel: 'English' },
  { code: 'ko',  nativeLabel: '한국어' },
  { code: 'ne',  nativeLabel: 'नेपाली' },
  { code: 'vi',  nativeLabel: 'Tiếng Việt' },
  { code: 'bn',  nativeLabel: 'বাংলা' },
  { code: 'fil', nativeLabel: 'Filipino' },
  { code: 'zh',  nativeLabel: '中文' },
  { code: 'km',  nativeLabel: 'ភាសាខ្មែរ' },
  { code: 'th',  nativeLabel: 'ภาษาไทย' },
];

export default function SettingsScreen() {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const corridor = useAppStore((s) => s.corridor);
  const setCorridor = useAppStore((s) => s.setCorridor);
  const userType = useAppStore((s) => s.userType);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const handleLanguage = useCallback(
    (lang: Language) => {
      setLanguage(lang);
    },
    [setLanguage]
  );

  const handleCorridor = useCallback(
    (c: Corridor) => setCorridor(c),
    [setCorridor]
  );

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  }, []);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('settings.title')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language section */}
        <Text style={styles.sectionHeader}>{i18n.t('settings.language.title')}</Text>
        <Text style={styles.sectionSubtitle}>{i18n.t('settings.language.subtitle')}</Text>
        <View style={styles.card}>
          {LANGUAGES.map((lang, index) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleLanguage(lang.code)}
              style={[
                styles.langRow,
                index < LANGUAGES.length - 1 && styles.langRowBorder,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.langLabel}>{lang.nativeLabel}</Text>
              {language === lang.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Default corridor section */}
        <Text style={styles.sectionHeader}>{i18n.t('settings.defaultCorridor.title')}</Text>
        <Text style={styles.sectionSubtitle}>{i18n.t('settings.defaultCorridor.subtitle')}</Text>
        <View style={[styles.card, styles.corridorCard]}>
          <CorridorPicker selected={corridor} onSelect={handleCorridor} />
        </View>

        {/* Notifications section */}
        <Text style={styles.sectionHeader}>{i18n.t('settings.notifications.title')}</Text>
        <View style={styles.card}>
          <NotificationRow
            label={i18n.t('settings.notifications.rateAlert')}
            comingSoonLabel={i18n.t('settings.notifications.comingSoon')}
          />
          <View style={styles.divider} />
          <NotificationRow
            label={i18n.t('settings.notifications.dailySummary')}
            comingSoonLabel={i18n.t('settings.notifications.comingSoon')}
          />
        </View>

        {/* My Profile section */}
        <Text style={styles.sectionHeader}>My Profile</Text>
        <Text style={styles.sectionSubtitle}>Personalizes what Bridge shows you</Text>
        <View style={styles.card}>
          {userType ? (() => {
            const meta = USER_TYPE_META[userType];
            return (
              <TouchableOpacity
                style={styles.profileRow}
                onPress={() => router.navigate('/(onboarding)/user-type' as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.profileIconBox, { backgroundColor: meta.color + '18' }]}>
                  <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileLabel}>{meta.label}</Text>
                  <Text style={styles.profileSub}>Tap to change your profile type</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            );
          })() : (
            <TouchableOpacity
              style={styles.profileRow}
              onPress={() => router.navigate('/(onboarding)/user-type' as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.profileIconBox, { backgroundColor: theme.colors.bg3 }]}>
                <Ionicons name="person-outline" size={22} color={theme.colors.textMuted} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Set your profile</Text>
                <Text style={styles.profileSub}>Personalize Bridge for your needs</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Account section */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <View style={styles.accountRow}>
            <Ionicons name="person-circle-outline" size={20} color={theme.colors.textMuted} />
            <Text style={styles.accountEmail} numberOfLines={1}>{user?.email ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* About section */}
        <Text style={styles.sectionHeader}>{i18n.t('settings.about.title')}</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>{i18n.t('settings.about.version', { version: appVersion })}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.providerLinksSection}>
            <View style={styles.providerLinks}>
              {(Object.keys(PROVIDER_LINKS) as (keyof typeof PROVIDER_LINKS)[]).map((name) => {
                const meta = PROVIDERS[name];
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => Linking.openURL(PROVIDER_LINKS[name].web)}
                    style={[styles.providerLinkBtn, { backgroundColor: theme.colors.bg2, borderWidth: 1, borderColor: theme.colors.border }]}
                  >
                    <Text style={[styles.providerLinkText, { color: meta.color }]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.disclaimerSection}>
            <Text style={styles.disclaimer}>{i18n.t('settings.about.disclaimer')}</Text>
            <Text style={[styles.disclaimer, { marginTop: 4 }]}>
              {i18n.t('settings.about.notAffiliated')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationRow({
  label,
  comingSoonLabel,
}: {
  label: string;
  comingSoonLabel: string;
}) {
  return (
    <View style={styles.notifRow}>
      <View style={styles.notifLabelRow}>
        <Text style={styles.notifLabelDisabled}>{label}</Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>{comingSoonLabel}</Text>
        </View>
      </View>
      <Switch
        value={false}
        disabled={true}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.bg3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  profileIconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  profileSub: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sectionHeader: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: theme.spacing.md,
    marginBottom: 2,
    marginLeft: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  corridorCard: {
    paddingVertical: theme.spacing.xs,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  langRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  langLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.green,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    gap: theme.spacing.sm,
  },
  notifLabelRow: {
    flex: 1,
    gap: 4,
  },
  notifLabelDisabled: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  comingSoonText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  aboutRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  aboutLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  providerLinksSection: {
    padding: theme.spacing.md,
  },
  providerLinks: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  providerLinkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
  },
  providerLinkText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  disclaimerSection: {
    padding: theme.spacing.md,
  },
  disclaimer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  accountEmail: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  signOutText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.error,
    fontWeight: '500',
  },
});
