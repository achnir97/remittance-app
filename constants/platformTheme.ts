import { Platform } from 'react-native';
import { theme } from './theme';

export const platformTheme = {
  cardRadius: Platform.select({
    ios: theme.radius.lg,
    android: theme.radius.md,
    default: theme.radius.md,
  })!,
  cardShadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 0,
    },
    android: {
      elevation: 3,
      shadowColor: 'rgba(0,0,0,0.2)',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    },
    default: {
      elevation: 1,
      shadowColor: 'rgba(15,23,42,0.08)',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
    },
  })!,
  /** Softer, premium elevation for dark-theme cards */
  cardShadowPremium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.28,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
      elevation: 0,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 4,
    },
  })!,
  touchOpacity: Platform.select({
    ios: 0.7,
    android: 0.8,
    default: 0.75,
  })!,
  primaryButtonHeight: Platform.select({
    ios: 44,
    android: 48,
    default: 46,
  })!,
  smallRipple: Platform.OS === 'android',
};

