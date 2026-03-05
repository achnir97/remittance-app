import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../constants/theme';
import { platformTheme } from '../constants/platformTheme';
import { i18n } from '../locales/i18n';

interface Props {
  tip?: string;
  loading?: boolean;
}

export const InsightBanner = React.memo(function InsightBanner({ tip, loading }: Props) {
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.icon}>💡</Text>
        <View style={styles.skeletonText} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💡</Text>
      <Text style={styles.text}>{tip ?? i18n.t('insight.placeholder')}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bg2,
    borderRadius: Platform.select({ ios: theme.radius.md, android: theme.radius.sm })!,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: Platform.select({ ios: theme.spacing.sm, android: theme.spacing.xs })!,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...platformTheme.cardShadow,
  },
  loadingContainer: {
    minHeight: 44,
  },
  icon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  skeletonText: {
    flex: 1,
    height: 12,
    backgroundColor: theme.colors.bg3,
    borderRadius: 6,
  },
});
