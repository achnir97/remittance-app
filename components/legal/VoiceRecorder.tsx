// Requires: npx expo install expo-av
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { VoiceStatus } from '../../hooks/useLegalVoice';
import { i18n } from '../../locales/i18n';

interface Props {
  status: VoiceStatus;
  onPressIn: () => void;
  onPressOut: () => void;
  error: string | null;
}

export function VoiceRecorder({ status, onPressIn, onPressOut, error }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isRecording = status === 'recording';

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const statusLabel = () => {
    if (status === 'recording') return i18n.t('legal.voice.recording');
    if (status === 'processing') return i18n.t('legal.voice.processing');
    if (status === 'playing') return i18n.t('legal.voice.playing');
    return i18n.t('legal.holdToSpeak');
  };

  const isDisabled = status === 'processing' || status === 'playing';

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pulse, isRecording && { transform: [{ scale: pulseAnim }] }]}>
        <Pressable
          style={[styles.btn, isRecording && styles.btnRecording, isDisabled && styles.btnDisabled]}
          onPressIn={isDisabled ? undefined : onPressIn}
          onPressOut={isDisabled ? undefined : onPressOut}
          disabled={isDisabled}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic-outline'}
            size={22}
            color={isRecording ? '#fff' : '#9B72FF'}
          />
        </Pressable>
      </Animated.View>
      <Text style={styles.label}>{statusLabel()}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  pulse: {
    borderRadius: theme.radius.full,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#9B72FF',
    backgroundColor: 'rgba(155, 114, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRecording: {
    backgroundColor: '#9B72FF',
    borderColor: '#9B72FF',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  error: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.red,
    textAlign: 'center',
  },
});
