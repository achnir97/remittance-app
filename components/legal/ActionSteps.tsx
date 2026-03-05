import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  steps: string[];
}

export function ActionSteps({ steps }: Props) {
  if (!steps || steps.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{i18n.t('legal.response.actionSteps')}</Text>
      {steps.map((step, i) => (
        <View key={i} style={styles.step}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.sm,
  },
  heading: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: '#9B72FF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(155, 114, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: '#9B72FF',
  },
  stepText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
});
