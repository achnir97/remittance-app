import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from './en.json';
import ko from './ko.json';
import ne from './ne.json';
import vi from './vi.json';
import bn from './bn.json';
import fil from './fil.json';
import zh from './zh.json';
import km from './km.json';
import th from './th.json';

export const SUPPORTED_LOCALES = ['en', 'ko', 'ne', 'vi', 'bn', 'fil', 'zh', 'km', 'th'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Map region codes (ne-NP, ko-KR, etc.) to our supported base locale so lookups always hit our JSON. */
export function normalizeLocale(locale: string): SupportedLocale {
  const base = (locale || 'en').split(/[-_]/)[0].toLowerCase();
  if (SUPPORTED_LOCALES.includes(base as SupportedLocale)) return base as SupportedLocale;
  const regionMap: Record<string, SupportedLocale> = {
    ne: 'ne', ko: 'ko', vi: 'vi', bn: 'bn', fil: 'fil', zh: 'zh', km: 'km', th: 'th',
  };
  return regionMap[base] ?? 'en';
}

export const i18n = new I18n({ en, ko, ne, vi, bn, fil, zh, km, th });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Initial locale: use device language; app layout will sync from store after rehydration
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = normalizeLocale(deviceLocale);

export function getBodyFont(locale: string): string {
  const scriptFonts: Record<string, string> = {
    ko: 'NotoSansKR',
    ne: 'NotoSansDevanagari',
    bn: 'NotoSansBengali',
    zh: 'NotoSansSC',
    km: 'NotoSansKhmer',
    th: 'NotoSansThai',
  };
  return scriptFonts[locale] ?? 'DMSans';
}
