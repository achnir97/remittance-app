import React, { useCallback } from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CORRIDORS } from '../constants/corridors';
import { theme } from '../constants/theme';
import { Corridor } from '../types';

interface Props {
  selected: Corridor;
  onSelect: (corridor: Corridor) => void;
}

interface ItemProps {
  item: Corridor;
  isSelected: boolean;
  onPress: (corridor: Corridor) => void;
}

const CorridorItem = React.memo(function CorridorItem({ item, isSelected, onPress }: ItemProps) {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.item, isSelected && styles.itemSelected]}
      activeOpacity={0.7}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
});

export const CorridorPicker = React.memo(function CorridorPicker({ selected, onSelect }: Props) {
  const handleSelect = useCallback(
    (corridor: Corridor) => {
      if (corridor.to !== selected.to) {
        Haptics.selectionAsync();
        onSelect(corridor);
      }
    },
    [selected.to, onSelect]
  );

  const renderItem = useCallback(
    ({ item }: { item: Corridor }) => (
      <CorridorItem
        item={item}
        isSelected={item.to === selected.to}
        onPress={handleSelect}
      />
    ),
    [selected.to, handleSelect]
  );

  return (
    <FlatList
      data={CORRIDORS}
      renderItem={renderItem}
      keyExtractor={(item) => item.to}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
});

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 5,
  },
  itemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.bg2,
  },
  flag: {
    fontSize: 16,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  labelSelected: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
