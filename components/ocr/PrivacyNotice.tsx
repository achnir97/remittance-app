import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  visible: boolean;
  onConfirm: () => void;
}

export function PrivacyNotice({ visible, onConfirm }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onConfirm}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>{i18n.t('scan.privacy.title')}</Text>
          <Text style={styles.body}>{i18n.t('scan.privacy.body')}</Text>
          <TouchableOpacity style={styles.button} onPress={onConfirm}>
            <Text style={styles.buttonText}>{i18n.t('scan.privacy.confirm')}</Text>
          </TouchableOpacity>
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
    padding: theme.spacing.lg,
    paddingBottom: Platform.select({ ios: 40, android: theme.spacing.lg })!,
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  body: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.green,
    borderRadius: theme.radius.full,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.xl,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: theme.fontSize.md,
  },
});
