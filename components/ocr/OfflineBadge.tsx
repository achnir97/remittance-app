import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  count: number;
}

export function OfflineBadge({ count }: Props) {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {i18n.t('scan.pendingBadge', { count })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.amber,
    borderRadius: theme.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
});
