import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { LegalDomain } from '../../types';
import { i18n } from '../../locales/i18n';

const DOMAINS: { key: LegalDomain; icon: string }[] = [
  { key: 'employment', icon: '💼' },
  { key: 'visa', icon: '🛂' },
  { key: 'injury', icon: '🏥' },
  { key: 'contract', icon: '📄' },
  { key: 'realestate', icon: '🏠' },
  { key: 'general', icon: '💬' },
];

interface Props {
  selected: LegalDomain;
  onSelect: (d: LegalDomain) => void;
}

export function DomainPicker({ selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {DOMAINS.map(({ key, icon }) => {
        const active = selected === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(key)}
            activeOpacity={0.75}
          >
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {i18n.t(`legal.domains.${key}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 5,
  },
  chipActive: {
    borderColor: '#9B72FF',
    backgroundColor: 'rgba(155, 114, 255, 0.15)',
  },
  icon: {
    fontSize: 13,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  labelActive: {
    color: '#9B72FF',
  },
});
