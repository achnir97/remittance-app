import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { i18n } from '../locales/i18n';

interface Props {
  fetchedAt: string;
}

export const StaleWarning = React.memo(function StaleWarning({ fetchedAt }: Props) {
  const timeStr = new Date(fetchedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {i18n.t('errors.staleData', { time: timeStr })}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
  },
  text: {
    fontSize: theme.fontSize.sm,
    color: '#F5A623',
    textAlign: 'center',
  },
});
