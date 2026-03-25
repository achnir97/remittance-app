// Requires: npx expo install expo-av
import { useState, useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import { legalApi } from '../services/legal';
import { LegalChatMessage, LegalDomain } from '../types';
import { useAppStore } from '../store/useAppStore';
import { i18n } from '../locales/i18n';

// Lazy-load expo-av so the app doesn't crash in Expo Go if ExponentAV
// native module is not bundled. All audio calls are guarded at runtime.
let Audio: typeof import('expo-av').Audio | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Audio = require('expo-av').Audio;
} catch {
  // ExponentAV native module not available in this environment (e.g. Expo Go).
  // Voice features will be gracefully disabled.
}

export type VoiceStatus = 'idle' | 'recording' | 'processing' | 'playing' | 'error';

function isNativeModuleMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /ExponentAV|native module|Cannot find native/.test(msg);
}

export function useLegalVoice(domain: LegalDomain) {
  const language = useAppStore((s) => s.language);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<InstanceType<typeof Audio.Recording> | null>(null);
  const soundRef = useRef<InstanceType<typeof Audio.Sound> | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    if (!Audio) {
      setError(i18n.t('legal.errors.voiceUnavailable'));
      setStatus('error');
      return false;
    }
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError(i18n.t('legal.errors.audioPermission'));
        return false;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setStatus('recording');
      return true;
    } catch (err) {
      console.warn('[useLegalVoice] Failed to start recording:', err);
      setError(
        isNativeModuleMissing(err)
          ? i18n.t('legal.errors.voiceUnavailable')
          : i18n.t('legal.errors.recordingFailed')
      );
      setStatus('error');
      return false;
    }
  }, []);

  const stopAndProcess = useCallback(async (
    onResult: (msg: LegalChatMessage, audioB64: string | null) => void
  ) => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        setError(i18n.t('legal.errors.recordingFailed'));
        setStatus('error');
        return;
      }

      setStatus('processing');

      // Read audio as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const data = await legalApi.voice({ audio: base64, language, domain });

      // Build chat message from voice result
      const msg: LegalChatMessage = {
        id: `${Date.now()}-voice-ai`,
        role: 'assistant',
        content: data.response.summary,
        response: data.response,
        emergency: data.emergency,
        timestamp: Date.now(),
      };

      onResult(msg, data.audio_response);

      // Play audio response if present
      if (data.audio_response && Audio) {
        setStatus('playing');
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
        const audioUri = `data:audio/mp3;base64,${data.audio_response}`;
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        soundRef.current = sound;
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded && s.didJustFinish) {
            setStatus('idle');
            sound.unloadAsync();
          }
        });
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.warn('[useLegalVoice] Voice processing failed:', err);
      setError(i18n.t('legal.errors.recordingFailed'));
      setStatus('error');
      recordingRef.current = null;
    }
  }, [language, domain]);

  const stopPlayback = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setStatus('idle');
  }, []);

  return { status, error, startRecording, stopAndProcess, stopPlayback };
}
