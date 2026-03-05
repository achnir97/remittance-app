import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { CalendarRangePicker } from './CalendarRangePicker';
import { PeriodPreset } from '../../store/useAppStore';

interface Props {
  value: PeriodPreset;
  customRange: { from: string; to: string } | null;
  onChange: (preset: PeriodPreset, custom?: { from: string; to: string }) => void;
}

const PRESETS: { key: PeriodPreset; labelKey: string }[] = [
  { key: 'today', labelKey: 'period.today' },
  { key: '7d',   labelKey: 'period.days7' },
  { key: '14d',  labelKey: 'period.days14' },
  { key: '1m',   labelKey: 'period.month1' },
  { key: '2m',   labelKey: 'period.month2' },
];

export function PeriodSelector({ value, customRange, onChange }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleCustomApply = (from: string, to: string) => {
    setShowCalendar(false);
    onChange('custom', { from, to });
  };

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.segmentGroup}>
          {PRESETS.map((preset) => {
            const isActive = value === preset.key;
            return (
              <TouchableOpacity
                key={preset.key}
                onPress={() => onChange(preset.key)}
                style={[styles.segment, isActive && styles.segmentActive]}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.label, isActive && styles.labelActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {i18n.t(preset.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => setShowCalendar(true)}
            style={[styles.segment, styles.segmentCustom, value === 'custom' && styles.segmentActive]}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.label, value === 'custom' && styles.labelActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {value === 'custom' && customRange
                ? `${customRange.from.slice(5)} → ${customRange.to.slice(5)}`
                : `${i18n.t('period.custom')} ▾`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CalendarRangePicker
        visible={showCalendar}
        initialFrom={customRange?.from}
        initialTo={customRange?.to}
        onApply={handleCustomApply}
        onCancel={() => setShowCalendar(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  segmentGroup: {
    flexDirection: 'row',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg2,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.xs,
  },
  segmentCustom: {
    flex: 1.2,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
    ...(Platform.OS === 'ios' && {
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
    }),
    ...(Platform.OS === 'android' && { elevation: 4 }),
  },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
});
