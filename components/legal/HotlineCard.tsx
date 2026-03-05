import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { LegalHotline } from '../../types';

interface Props {
  hotline: LegalHotline;
  compact?: boolean;
}

export function HotlineCard({ hotline, compact = false }: Props) {
  const handleCall = () => {
    const url = `tel:${hotline.number.replace(/[^0-9]/g, '')}`;
    Linking.canOpenURL(url).then((can) => {
      if (can) Linking.openURL(url);
      else Alert.alert('Call', `Dial ${hotline.number}`);
    });
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compact} onPress={handleCall} activeOpacity={0.75}>
        <Ionicons name="call-outline" size={14} color={theme.colors.violet} />
        <Text style={styles.compactNumber}>{hotline.number}</Text>
        <Text style={styles.compactName} numberOfLines={1}>{hotline.name}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handleCall} activeOpacity={0.75}>
      <View style={styles.iconBox}>
        <Ionicons name="call" size={18} color="#fff" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{hotline.name}</Text>
        <Text style={styles.number}>{hotline.number}</Text>
        <Text style={styles.hours}>{hotline.hours}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#E8E4FF',
    gap: theme.spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: '#9B72FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  number: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#9B72FF',
  },
  hours: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  compactNumber: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: '#9B72FF',
  },
  compactName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    flex: 1,
  },
});
