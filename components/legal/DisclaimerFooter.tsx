import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  text: string;
}

export function DisclaimerFooter({ text }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={styles.toggle}>
        <Text style={styles.toggleText}>
          {expanded ? i18n.t('legal.response.hideDisclaimer') : i18n.t('legal.response.showDisclaimer')}
        </Text>
      </TouchableOpacity>
      {expanded && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.xs,
  },
  toggle: {
    alignSelf: 'flex-start',
  },
  toggleText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
  text: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    lineHeight: 16,
    marginTop: theme.spacing.xs,
  },
});
