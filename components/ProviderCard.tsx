import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PROVIDERS } from '../constants/providers';
import { PROVIDER_LINKS } from '../constants/providerLinks';
import { theme } from '../constants/theme';
import { platformTheme } from '../constants/platformTheme';
import { ProviderResult, ProviderName } from '../types';
import { i18n } from '../locales/i18n';

const MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  result: ProviderResult;
  sendAmount: number;
  index: number;
}

function getMarkupColor(markup: number): string {
  if (markup < 1) return theme.colors.green;
  if (markup <= 2) return theme.colors.amber;
  return theme.colors.red;
}

export const ProviderCard = React.memo(function ProviderCard({
  result,
  sendAmount,
  index,
}: Props) {
  const providerMeta = PROVIDERS[result.provider as ProviderName];
  const links = PROVIDER_LINKS[result.provider as ProviderName];
  const color = providerMeta?.color ?? theme.colors.textPrimary;
  const lightBg = providerMeta?.lightBg ?? theme.colors.background;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const recipientGets = Math.round(sendAmount * result.exchange_rate);
  const hasFee =
    typeof result.transfer_fee_krw === 'number' && !Number.isNaN(result.transfer_fee_krw);
  const safeFee = hasFee ? result.transfer_fee_krw : 0;
  const totalDebited = sendAmount + safeFee;

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(async () => {
    if (!links) return;
    const appUrl = Platform.OS === 'ios' ? links.ios : `intent://${links.android}#Intent;end`;
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(links.web);
    }
  }, [links]);

  const hasMarkup = typeof result.markup_percent === 'number' && !Number.isNaN(result.markup_percent);
  const safeMarkup = hasMarkup ? result.markup_percent : 0;
  const markupColor = getMarkupColor(safeMarkup);
  const rateExpression = result.extra?.rate_expression ?? '';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
      >
        <View style={styles.card}>
          {/* Header row */}
          <View style={styles.header}>
            <Text style={styles.medal}>{MEDALS[index] ?? ''}</Text>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{result.provider}</Text>
              {providerMeta?.badge ? (
                <View style={[styles.badge, { backgroundColor: lightBg }]}>
                  <Text style={[styles.badgeText, { color }]}>
                    {providerMeta.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            {hasMarkup ? (
              <View style={[styles.markupBadge, { backgroundColor: `${markupColor}18` }]}>
                <Text style={[styles.markupText, { color: markupColor }]}>
                  {safeMarkup.toFixed(2)}%
                </Text>
              </View>
            ) : null}
          </View>

          {/* Hero: recipient amount */}
          <View style={styles.heroRow}>
            <Text style={styles.heroLabel}>{i18n.t('provider.recipientGets')}</Text>
            <Text style={[styles.heroAmount, { color }]}>
              {recipientGets.toLocaleString()}
            </Text>
          </View>

          {/* Rate info */}
          <View style={styles.rateRow}>
            {rateExpression ? (
              <Text style={styles.rateExpression}>{rateExpression}</Text>
            ) : null}
            <Text style={styles.speed}>{result.transfer_speed}</Text>
          </View>

          {/* Detail rows */}
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{i18n.t('provider.transferFee')}</Text>
            <Text style={styles.detailValue}>
              ₩{safeFee.toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{i18n.t('provider.totalYouPay')}</Text>
            <Text style={[styles.detailValue, styles.detailValueBold]}>
              ₩{totalDebited.toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: platformTheme.cardRadius,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...platformTheme.cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  medal: {
    fontSize: 24,
  },
  providerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  providerName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  markupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  markupText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  heroRow: {
    marginBottom: theme.spacing.xs,
  },
  heroLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroAmount: {
    fontSize: theme.fontSize.hero,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 44,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  rateExpression: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  speed: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  detailValueBold: {
    fontWeight: '600',
  },
});
