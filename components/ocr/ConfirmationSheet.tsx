import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { OCRResult, SpendingCategory } from '../../types';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';
import { CATEGORY_KEYS } from '../../constants/categories';

const TYPES: OCRResult['type'][] = [
  'remittance', 'atm', 'store', 'restaurant', 'utility', 'transport', 'medical', 'other',
];

interface Props {
  visible: boolean;
  ocr: OCRResult | null;
  onDiscard: () => void;
  onSave: (edited: OCRResult) => void;
}

function isValidDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const ts = Date.parse(str);
  return !isNaN(ts);
}

export function ConfirmationSheet({ visible, ocr, onDiscard, onSave }: Props) {
  const [local, setLocal] = useState<OCRResult | null>(null);
  const [dateError, setDateError] = useState(false);

  useEffect(() => {
    if (ocr) {
      setLocal(ocr);
      setDateError(false);
    }
  }, [ocr]);

  if (!local) return null;

  const patch = (p: Partial<OCRResult>) => setLocal({ ...local, ...p });

  const handleDateChange = (text: string) => {
    patch({ date: text || null });
    setDateError(text.length > 0 && !isValidDate(text));
  };

  const canSave = !dateError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDiscard}
    >
      <View style={styles.backdrop}>
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>✅ {i18n.t('scan.confirm')}</Text>

          {/* Type picker */}
          <Text style={styles.label}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, local.type === t && styles.chipActive]}
                onPress={() => patch({ type: t })}
              >
                <Text style={[styles.chipText, local.type === t && styles.chipTextActive]}>
                  {i18n.t(`receiptTypes.${t}`, { defaultValue: t })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Merchant */}
          <View style={styles.field}>
            <Text style={styles.label}>Merchant</Text>
            <TextInput
              style={styles.input}
              value={local.merchant ?? ''}
              onChangeText={(text) => patch({ merchant: text || null })}
              placeholder="Store / Bank / Provider"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={styles.label}>Amount (KRW)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={local.amount_krw != null ? String(local.amount_krw) : ''}
              onChangeText={(text) =>
                patch({ amount_krw: text ? parseInt(text.replace(/[^0-9]/g, ''), 10) || 0 : null })
              }
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, dateError && styles.inputError]}
              value={local.date ?? ''}
              onChangeText={handleDateChange}
              placeholder="2026-03-04"
              placeholderTextColor={theme.colors.textMuted}
            />
            {dateError && (
              <Text style={styles.errorText}>Enter a valid date (YYYY-MM-DD)</Text>
            )}
          </View>

          {/* Category picker */}
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {CATEGORY_KEYS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, local.category === cat && styles.chipActive]}
                onPress={() => patch({ category: cat as SpendingCategory })}
              >
                <Text style={[styles.chipText, local.category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.discardButton]} onPress={onDiscard}>
              <Text style={styles.discardText}>{i18n.t('scan.discard')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, !canSave && styles.saveButtonDisabled]}
              onPress={() => canSave && onSave(local)}
              disabled={!canSave}
            >
              <Text style={styles.saveText}>{i18n.t('scan.save')} ✓</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '85%',
  },
  sheetContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.select({ ios: 40, android: theme.spacing.lg })!,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: 6,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: theme.colors.green,
    borderColor: theme.colors.green,
  },
  chipText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  field: {
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: Platform.select({ ios: 10, android: 8 })!,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    alignItems: 'center',
  },
  discardButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.green,
  },
  discardText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: theme.fontSize.md,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.fontSize.md,
  },
  inputError: {
    borderColor: theme.colors.red,
  },
  errorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.red,
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
});
