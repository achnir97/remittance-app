import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Corridor, Language, ProviderResult } from '../types';
import { DEFAULT_CORRIDOR } from '../constants/corridors';
import { i18n, normalizeLocale, SUPPORTED_LOCALES, SupportedLocale } from '../locales/i18n';
import { getLocales } from 'expo-localization';

export type PeriodPreset = 'today' | '7d' | '14d' | '1m' | '2m' | 'custom';
export type UserType = 'worker' | 'student' | 'tourist' | 'resident';

function detectLanguage(): Language {
  const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
  return normalizeLocale(deviceLocale) as Language;
}

interface AppStore {
  corridor: Corridor;
  setCorridor: (c: Corridor) => void;

  sendAmount: number;
  setSendAmount: (n: number) => void;

  language: Language;
  setLanguage: (l: Language) => void;

  cachedRates: Record<string, ProviderResult[]>;
  setCachedRates: (key: string, rates: ProviderResult[]) => void;

  // OCR / Dashboard state
  selectedPeriod: PeriodPreset;
  setSelectedPeriod: (p: PeriodPreset) => void;

  customDateRange: { from: string; to: string } | null;
  setCustomDateRange: (range: { from: string; to: string } | null) => void;

  pendingCount: number;
  setPendingCount: (n: number) => void;
  incrementPendingCount: () => void;
  decrementPendingCount: () => void;

  privacyNoticeSeen: boolean;
  setPrivacyNoticeSeen: (seen: boolean) => void;

  userType: UserType | null;
  setUserType: (type: UserType | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      corridor: DEFAULT_CORRIDOR,
      setCorridor: (c) => set({ corridor: c }),

      sendAmount: 1000000,
      setSendAmount: (n) => set({ sendAmount: n }),

      language: detectLanguage(),
      setLanguage: (l) => {
        const normalized = normalizeLocale(l) as Language;
        i18n.locale = normalized;
        set({ language: normalized });
      },

      cachedRates: {},
      setCachedRates: (key, rates) =>
        set((state) => ({
          cachedRates: { ...state.cachedRates, [key]: rates },
        })),

      selectedPeriod: '1m',
      setSelectedPeriod: (p) => set({ selectedPeriod: p }),

      customDateRange: null,
      setCustomDateRange: (range) => set({ customDateRange: range }),

      pendingCount: 0,
      setPendingCount: (n) => set({ pendingCount: n }),
      incrementPendingCount: () =>
        set((s) => ({ pendingCount: s.pendingCount + 1 })),
      decrementPendingCount: () =>
        set((s) => ({ pendingCount: Math.max(0, s.pendingCount - 1) })),

      privacyNoticeSeen: false,
      setPrivacyNoticeSeen: (seen) => set({ privacyNoticeSeen: seen }),

      userType: null,
      setUserType: (type) => set({ userType: type }),
    }),
    {
      name: 'remittance-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        corridor: state.corridor,
        sendAmount: state.sendAmount,
        language: state.language,
        cachedRates: state.cachedRates,
        selectedPeriod: state.selectedPeriod,
        customDateRange: state.customDateRange,
        privacyNoticeSeen: state.privacyNoticeSeen,
        userType: state.userType,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          i18n.locale = normalizeLocale(state.language);
        }
      },
    }
  )
);
