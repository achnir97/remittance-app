import { useAppStore } from '../../store/useAppStore';
import type { Corridor } from '../../types';

const KRW_PHP: Corridor = { from: 'KRW', to: 'PHP', flag: '🇵🇭', label: 'Philippines' };
const KRW_NPR: Corridor = { from: 'KRW', to: 'NPR', flag: '🇳🇵', label: 'Nepal' };

beforeEach(() => {
  useAppStore.setState({
    sendAmount: 1000000,
    language: 'en',
    cachedRates: {},
    selectedPeriod: '1m',
    customDateRange: null,
    pendingCount: 0,
    privacyNoticeSeen: false,
  });
});

describe('useAppStore', () => {
  describe('initial state', () => {
    it('defaults sendAmount to 1,000,000', () => {
      expect(useAppStore.getState().sendAmount).toBe(1000000);
    });

    it('defaults selectedPeriod to 1m', () => {
      expect(useAppStore.getState().selectedPeriod).toBe('1m');
    });

    it('defaults pendingCount to 0', () => {
      expect(useAppStore.getState().pendingCount).toBe(0);
    });

    it('defaults privacyNoticeSeen to false', () => {
      expect(useAppStore.getState().privacyNoticeSeen).toBe(false);
    });

    it('defaults customDateRange to null', () => {
      expect(useAppStore.getState().customDateRange).toBeNull();
    });
  });

  describe('setCorridor', () => {
    it('updates corridor', () => {
      useAppStore.getState().setCorridor(KRW_NPR);
      expect(useAppStore.getState().corridor).toEqual(KRW_NPR);
    });

    it('can switch corridors', () => {
      useAppStore.getState().setCorridor(KRW_PHP);
      useAppStore.getState().setCorridor(KRW_NPR);
      expect(useAppStore.getState().corridor.to).toBe('NPR');
    });
  });

  describe('setSendAmount', () => {
    it('updates sendAmount', () => {
      useAppStore.getState().setSendAmount(500000);
      expect(useAppStore.getState().sendAmount).toBe(500000);
    });

    it('accepts zero', () => {
      useAppStore.getState().setSendAmount(0);
      expect(useAppStore.getState().sendAmount).toBe(0);
    });
  });

  describe('setLanguage', () => {
    it('updates language', () => {
      useAppStore.getState().setLanguage('ko');
      expect(useAppStore.getState().language).toBe('ko');
    });

    it('accepts all supported locales', () => {
      const langs = ['en', 'ko', 'ne', 'vi', 'bn', 'fil', 'zh', 'km', 'th'] as const;
      langs.forEach((lang) => {
        useAppStore.getState().setLanguage(lang);
        expect(useAppStore.getState().language).toBe(lang);
      });
    });
  });

  describe('cachedRates', () => {
    it('stores rates by key', () => {
      const rates = [{ provider: 'SentBe', exchange_rate: 10.5 }] as any;
      useAppStore.getState().setCachedRates('KRW_PHP', rates);
      expect(useAppStore.getState().cachedRates['KRW_PHP']).toEqual(rates);
    });

    it('merges multiple keys', () => {
      useAppStore.getState().setCachedRates('KRW_PHP', [{ provider: 'SentBe' }] as any);
      useAppStore.getState().setCachedRates('KRW_NPR', [{ provider: 'GME' }] as any);
      const { cachedRates } = useAppStore.getState();
      expect(cachedRates['KRW_PHP']).toBeDefined();
      expect(cachedRates['KRW_NPR']).toBeDefined();
    });
  });

  describe('selectedPeriod', () => {
    it('updates period', () => {
      useAppStore.getState().setSelectedPeriod('7d');
      expect(useAppStore.getState().selectedPeriod).toBe('7d');
    });

    it('accepts all period presets', () => {
      const periods = ['today', '7d', '14d', '1m', '2m', 'custom'] as const;
      periods.forEach((p) => {
        useAppStore.getState().setSelectedPeriod(p);
        expect(useAppStore.getState().selectedPeriod).toBe(p);
      });
    });
  });

  describe('customDateRange', () => {
    it('sets a date range', () => {
      useAppStore.getState().setCustomDateRange({ from: '2026-01-01', to: '2026-01-31' });
      expect(useAppStore.getState().customDateRange).toEqual({
        from: '2026-01-01',
        to: '2026-01-31',
      });
    });

    it('clears date range', () => {
      useAppStore.getState().setCustomDateRange({ from: '2026-01-01', to: '2026-01-31' });
      useAppStore.getState().setCustomDateRange(null);
      expect(useAppStore.getState().customDateRange).toBeNull();
    });
  });

  describe('pendingCount', () => {
    it('sets pending count', () => {
      useAppStore.getState().setPendingCount(5);
      expect(useAppStore.getState().pendingCount).toBe(5);
    });

    it('increments pending count', () => {
      useAppStore.getState().setPendingCount(2);
      useAppStore.getState().incrementPendingCount();
      expect(useAppStore.getState().pendingCount).toBe(3);
    });

    it('decrements pending count', () => {
      useAppStore.getState().setPendingCount(3);
      useAppStore.getState().decrementPendingCount();
      expect(useAppStore.getState().pendingCount).toBe(2);
    });

    it('does not go below 0 on decrement', () => {
      useAppStore.getState().setPendingCount(0);
      useAppStore.getState().decrementPendingCount();
      expect(useAppStore.getState().pendingCount).toBe(0);
    });
  });

  describe('privacyNoticeSeen', () => {
    it('can be set to true', () => {
      useAppStore.getState().setPrivacyNoticeSeen(true);
      expect(useAppStore.getState().privacyNoticeSeen).toBe(true);
    });

    it('can be reset to false', () => {
      useAppStore.getState().setPrivacyNoticeSeen(true);
      useAppStore.getState().setPrivacyNoticeSeen(false);
      expect(useAppStore.getState().privacyNoticeSeen).toBe(false);
    });
  });
});
