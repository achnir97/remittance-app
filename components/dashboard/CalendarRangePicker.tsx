import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  visible: boolean;
  initialFrom?: string;
  initialTo?: string;
  onApply: (from: string, to: string) => void;
  onCancel: () => void;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
  );
}

function buildMarkedDates(
  from: string | null,
  to: string | null
): Record<string, object> {
  if (!from) return {};
  if (!to || from === to) {
    return {
      [from]: {
        selected: true,
        startingDay: true,
        endingDay: true,
        color: theme.colors.green,
        textColor: '#fff',
      },
    };
  }

  const marks: Record<string, object> = {};
  const start = new Date(from);
  const end = new Date(to);
  let cur = new Date(start);

  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    const isStart = key === from;
    const isEnd = key === to;
    marks[key] = {
      selected: true,
      startingDay: isStart,
      endingDay: isEnd,
      color: isStart || isEnd ? theme.colors.green : theme.colors.green + '40',
      textColor: isStart || isEnd ? '#fff' : theme.colors.textPrimary,
    };
    cur.setDate(cur.getDate() + 1);
  }
  return marks;
}

export function CalendarRangePicker({
  visible,
  initialFrom,
  initialTo,
  onApply,
  onCancel,
}: Props) {
  const [from, setFrom] = useState<string | null>(initialFrom ?? null);
  const [to, setTo] = useState<string | null>(initialTo ?? null);

  const handleDayPress = (day: DateData) => {
    const d = day.dateString;
    if (!from || (from && to)) {
      // start new range
      setFrom(d);
      setTo(null);
    } else {
      // set end
      if (d < from) {
        setTo(from);
        setFrom(d);
      } else if (daysBetween(from, d) > 365) {
        // clamp to 365
        const maxDate = new Date(from);
        maxDate.setDate(maxDate.getDate() + 364);
        setTo(maxDate.toISOString().slice(0, 10));
      } else {
        setTo(d);
      }
    }
  };

  const days = from && to ? Math.round(daysBetween(from, to)) + 1 : 0;
  const canApply = !!from && !!to;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{i18n.t('period.selectRange')}</Text>

          <Calendar
            onDayPress={handleDayPress}
            markingType="period"
            markedDates={buildMarkedDates(from, to)}
            maxDate={new Date().toISOString().slice(0, 10)}
            theme={{
              selectedDayBackgroundColor: theme.colors.green,
              todayTextColor: theme.colors.green,
              arrowColor: theme.colors.green,
              textSectionTitleColor: theme.colors.textMuted,
            }}
          />

          {days > 0 && (
            <Text style={styles.daysHint}>
              {i18n.t('period.daysSelected', { count: days })}
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.cancelText}>{i18n.t('period.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.applyBtn, !canApply && styles.disabledBtn]}
              onPress={() => canApply && onApply(from!, to!)}
              disabled={!canApply}
            >
              <Text style={styles.applyText}>{i18n.t('period.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.select({ ios: 40, android: theme.spacing.lg })!,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  daysHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginVertical: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applyBtn: {
    backgroundColor: theme.colors.green,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  cancelText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  applyText: {
    color: '#fff',
    fontWeight: '700',
  },
});
