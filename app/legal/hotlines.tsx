import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Linking,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { useHotlines } from '../../hooks/useHotlines';
import { HotlineEntry } from '../../types';

const SECTION_ICONS: Record<string, string> = {
  emergency: '🚨',
  labor: '⚖️',
  immigration: '🛂',
  legal_aid: '⚖️',
  housing: '🏠',
};

function HotlineRow({ entry }: { entry: HotlineEntry }) {
  const handleCall = () => {
    const url = `tel:${entry.number.replace(/[^0-9]/g, '')}`;
    Linking.canOpenURL(url).then((can) => {
      if (can) Linking.openURL(url);
      else Alert.alert('Call', `Dial ${entry.number}`);
    });
  };

  return (
    <TouchableOpacity style={styles.row} onPress={handleCall} activeOpacity={0.75}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowNumber}>{entry.number}</Text>
        <Text style={styles.rowName}>{entry.name}</Text>
        <Text style={styles.rowHours}>{entry.hours}</Text>
      </View>
      <View style={styles.callBadge}>
        <Ionicons name="call" size={14} color="#fff" />
        <Text style={styles.callText}>{i18n.t('legal.hotlines.tapToCall')}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HotlinesScreen() {
  const { data, isLoading } = useHotlines();

  const sections = data ? [
    { key: 'emergency', title: i18n.t('legal.hotlines.emergency'), entries: data.emergency },
    { key: 'labor', title: i18n.t('legal.hotlines.labor'), entries: data.labor },
    { key: 'immigration', title: i18n.t('legal.hotlines.immigration'), entries: data.immigration },
    { key: 'legal_aid', title: i18n.t('legal.hotlines.legalAid'), entries: data.legal_aid },
    { key: 'housing', title: i18n.t('legal.hotlines.housing'), entries: data.housing },
  ] : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('legal.hotlines.title')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#9B72FF" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {sections.map(({ key, title, entries }) => (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {SECTION_ICONS[key]} {title}
              </Text>
              <View style={styles.sectionCard}>
                {entries.map((entry, i) => (
                  <React.Fragment key={entry.number}>
                    <HotlineRow entry={entry} />
                    {i < entries.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}

          {/* Static fallback if API not loaded */}
          {!data && !isLoading && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🚨 {i18n.t('legal.hotlines.emergency')}</Text>
              <View style={styles.sectionCard}>
                {[
                  { number: '112', name: 'Police (경찰)', hours: '24/7', languages: ['ko'] },
                  { number: '119', name: 'Ambulance / Fire (소방)', hours: '24/7', languages: ['ko'] },
                  { number: '1366', name: 'Emergency / Forced Labor Line', hours: '24/7', languages: ['en', 'ko', 'zh', 'vi'] },
                ].map((e, i, arr) => (
                  <React.Fragment key={e.number}>
                    <HotlineRow entry={e} />
                    {i < arr.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  rowInfo: { flex: 1 },
  rowNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    color: '#9B72FF',
  },
  rowName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    marginTop: 2,
  },
  rowHours: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  callBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#9B72FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  callText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
});
