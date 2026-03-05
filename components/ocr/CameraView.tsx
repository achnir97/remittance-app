import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

const { width: SCREEN_W } = Dimensions.get('window');
const GUIDE_W = SCREEN_W * 0.78;
const GUIDE_H = GUIDE_W * 1.42; // receipt-like aspect ratio

interface Props {
  visible: boolean;
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export function CameraView({ visible, onCapture, onClose }: Props) {
  const cameraRef = useRef<ExpoCameraView>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            {i18n.t('scan.permissionCamera')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } catch {
      // ignore capture errors
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <ExpoCameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          flash={flashOn ? 'on' : 'off'}
        />

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* Dashed guide rectangle */}
        <View style={styles.guideOverlay}>
          <View style={styles.guideDash}>
            <Text style={styles.guideText}>Align receipt here</Text>
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setFlashOn((f) => !f)}
          >
            <Text style={styles.controlBtnText}>{flashOn ? '🔦 On' : '🔦 Off'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>

          <View style={{ width: 80 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideDash: {
    width: GUIDE_W,
    height: GUIDE_H,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: theme.spacing.md,
  },
  guideText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: theme.fontSize.sm,
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  controlBtn: {
    width: 80,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  permissionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  permissionButton: {
    backgroundColor: theme.colors.green,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.sm,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: theme.fontSize.md,
  },
  cancelLink: {
    marginTop: theme.spacing.sm,
  },
  cancelLinkText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
  },
});
