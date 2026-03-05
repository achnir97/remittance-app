import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { CorridorPicker } from '../../components/CorridorPicker';
import { theme } from '../../constants/theme';
import { Corridor, Language } from '../../types';
import { PROVIDER_LINKS } from '../../constants/providerLinks';
import { PROVIDERS } from '../../constants/providers';
import { i18n } from '../../locales/i18n';
import Constants from 'expo-constants';

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
});
