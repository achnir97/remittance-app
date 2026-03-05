import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { platformTheme } from '../../constants/platformTheme';
import { i18n } from '../../locales/i18n';
import { useOCR } from '../../hooks/useOCR';
import { useRecentTransactions, useSaveTransactionFromOCR } from '../../hooks/useTransactions';
import { ConfirmationSheet } from '../../components/ocr/ConfirmationSheet';
import { RecentScanRow } from '../../components/ocr/RecentScanRow';
import { CameraView } from '../../components/ocr/CameraView';
import { PrivacyNotice } from '../../components/ocr/PrivacyNotice';
import { OfflineBadge } from '../../components/ocr/OfflineBadge';
import { pickFromGallery } from '../../components/ocr/GalleryPicker';
import { OCRResult } from '../../types';
import { useAppStore } from '../../store/useAppStore';

function showToast(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
}

export default function ScanScreen() {
  const language = useAppStore((s) => s.language);
  void language; // Re-render when language changes so i18n strings update
  const { status, result, localPath, scanImage, reset } = useOCR();
  const { data: recent = [], isLoading: loadingRecent } = useRecentTransactions(20);
  const saveMutation = useSaveTransactionFromOCR();

  const privacyNoticeSeen = useAppStore((s) => s.privacyNoticeSeen);
  const setPrivacyNoticeSeen = useAppStore((s) => s.setPrivacyNoticeSeen);
  const pendingCount = useAppStore((s) => s.pendingCount);
  const incrementPending = useAppStore((s) => s.incrementPendingCount);

  const [showCamera, setShowCamera] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [pendingSource, setPendingSource] = useState<'camera' | 'gallery' | null>(null);

  // Ask to show privacy notice on first scan
  const requestScan = useCallback((source: 'camera' | 'gallery') => {
    if (!privacyNoticeSeen) {
      setPendingSource(source);
      setShowPrivacy(true);
    } else {
      startScan(source);
    }
  }, [privacyNoticeSeen]);

  const startScan = useCallback(async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      setShowCamera(true);
    } else {
      const uri = await pickFromGallery();
      if (uri) await doScan(uri);
    }
  }, []);

  const handlePrivacyConfirm = useCallback(() => {
    setShowPrivacy(false);
    setPrivacyNoticeSeen(true);
    if (pendingSource) startScan(pendingSource);
    setPendingSource(null);
  }, [pendingSource]);

  const handleCameraCapture = useCallback(async (uri: string) => {
    setShowCamera(false);
    await doScan(uri);
  }, []);

  const doScan = useCallback(async (uri: string) => {
    await scanImage(uri);
  }, [scanImage]);

  // React to OCR status changes
  React.useEffect(() => {
    if (status === 'not_receipt') {
      showToast(i18n.t('scan.notReceipt'));
      reset();
    } else if (status === 'queued') {
      showToast(i18n.t('scan.queued'));
      incrementPending();
      reset();
    } else if (status === 'error') {
      showToast(i18n.t('scan.scanFailed'));
      reset();
    }
  }, [status]);

  const handleDiscard = () => {
    reset();
  };

  const handleSave = async (edited: OCRResult) => {
    if (!localPath) return;
    await saveMutation.mutateAsync({
      ocr: edited,
      imagePath: localPath,
      confirmed: true,
    });
    reset();
  };

  const isProcessing = status === 'processing';
  const showSheet = status === 'success' && !!result;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.kicker}>{i18n.t('scan.kicker')}</Text>
          <Text style={styles.title}>
            {i18n.t('scan.heroTitle')}
            <Text style={styles.titleAccent}>{i18n.t('scan.heroTitleAccent')}</Text>
          </Text>
          <Text style={styles.subtitle}>
            {i18n.t('scan.subtitle')}
          </Text>
        </View>
        <OfflineBadge count={pendingCount} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero summary card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{i18n.t('dashboard.totalSpent')}</Text>
          <Text style={styles.heroAmount}>₩0</Text>
          <Text style={styles.heroHint}>{i18n.t('scan.processing')}</Text>
        </View>

        {/* Empty / primary CTA */}
        <View style={styles.emptyCard}>
          <View style={styles.emptyInner}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="receipt-outline" size={28} color={theme.colors.amberGold} />
            </View>
            <Text style={styles.emptyTitle}>{i18n.t('dashboard.noData')}</Text>
            <Text style={styles.emptySubtitle}>
              {i18n.t('scan.subtitle')}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => requestScan('camera')}
              activeOpacity={platformTheme.touchOpacity}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.primaryButtonText}>
                    {i18n.t('scan.processing')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="camera-outline" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>
                    {i18n.t('scan.takePhoto')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => requestScan('gallery')}
              activeOpacity={platformTheme.touchOpacity}
              disabled={isProcessing}
            >
              <Text style={styles.linkText}>{i18n.t('scan.chooseGallery')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{i18n.t('scan.recentScans')}</Text>
        </View>

        <View style={styles.card}>
          {loadingRecent && (
            <View style={styles.center}>
              <ActivityIndicator color={theme.colors.green} />
            </View>
          )}
          {!loadingRecent && recent.length === 0 && (
            <Text style={styles.emptyText}>{i18n.t('dashboard.noData')}</Text>
          )}
          {!loadingRecent &&
            recent.map((tx) => <RecentScanRow key={tx.id} tx={tx} />)}
        </View>
      </ScrollView>

      <CameraView
        visible={showCamera}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />

      <PrivacyNotice
        visible={showPrivacy}
        onConfirm={handlePrivacyConfirm}
      />

      <ConfirmationSheet
        visible={showSheet}
        ocr={result}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.ink,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  kicker: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  titleAccent: {
    color: theme.colors.sapphire,
  },
  subtitle: {
    marginTop: 2,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  heroCard: {
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.bg2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    marginTop: 6,
    fontSize: theme.fontSize.hero,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  heroHint: {
    marginTop: 6,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  primaryButton: {
    width: '100%',
    height: platformTheme.primaryButtonHeight,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.sapphire,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    shadowColor: theme.colors.sapphire,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  linkText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
  sectionHeader: { marginBottom: theme.spacing.sm },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  emptyCard: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg2,
  },
  emptyInner: {
    alignItems: 'center',
  },
  emptyIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg1,
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
});
