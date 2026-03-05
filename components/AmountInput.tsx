import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { theme } from '../constants/theme';
import { platformTheme } from '../constants/platformTheme';
import { i18n } from '../locales/i18n';

const PRESETS = [
  { label: '₩50만', value: 500000 },
  { label: '₩100만', value: 1000000 },
  { label: '₩200만', value: 2000000 },
  { label: '₩500만', value: 5000000 },
];

interface Props {
  amount: number;
  onChange: (amount: number) => void;
}

export const AmountInput = React.memo(function AmountInput({ amount, onChange }: Props) {
  const [customText, setCustomText] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const activePreset = PRESETS.find((p) => p.value === amount);

  const handlePreset = useCallback(
    (value: number) => {
      setIsCustom(false);
      setCustomText('');
      onChange(value);
    },
    [onChange]
  );

  const MAX_AMOUNT = 99_999_999;

  const handleCustomChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9]/g, '');
      setCustomText(cleaned);
      const num = parseInt(cleaned, 10);
      if (!isNaN(num) && num > 0) {
        onChange(Math.min(num, MAX_AMOUNT));
      }
    },
    [onChange]
  );

  const handleCustomFocus = useCallback(() => {
    setIsCustom(true);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{i18n.t('compare.youSend')}</Text>
      <View style={styles.presets}>
        {PRESETS.map((preset) => {
          const isActive = !isCustom && activePreset?.value === preset.value;
          return (
            <TouchableOpacity
              key={preset.value}
              onPress={() => handlePreset(preset.value)}
              style={[styles.presetBtn, isActive && styles.presetBtnActive]}
              activeOpacity={platformTheme.touchOpacity}
            >
              <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TextInput
        style={[styles.input, isCustom && styles.inputActive]}
        value={customText}
        onChangeText={handleCustomChange}
        onFocus={handleCustomFocus}
        placeholder={i18n.t('compare.custom')}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="numeric"
        returnKeyType="done"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.select({ ios: theme.spacing.md, android: theme.spacing.sm })!,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  presets: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: Platform.select({ ios: theme.spacing.sm, android: theme.spacing.md })!,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: Platform.select({ ios: theme.radius.md, android: theme.radius.sm })!,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: Platform.select({
      ios: theme.colors.background,
      android: theme.colors.surface,
    })!,
    alignItems: 'center',
  },
  presetBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.bg2,
  },
  presetText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  presetTextActive: {
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: Platform.select({ ios: theme.radius.md, android: theme.radius.sm })!,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.select({ ios: 10, android: 8 })!,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  inputActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
});
