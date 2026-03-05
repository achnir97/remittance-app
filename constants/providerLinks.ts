import { ProviderName } from '../types';

interface ProviderLink {
  ios: string;
  android: string;
  web: string;
}

export const PROVIDER_LINKS: Record<ProviderName, ProviderLink> = {
  SentBe: {
    ios: 'sentbe://',
    android: 'com.sentbe.app',
    web: 'https://sentbe.com',
  },
  GME: {
    ios: 'gmeremit://',
    android: 'com.gmeremit.android',
    web: 'https://online.gmeremit.com',
  },
  Hanpass: {
    ios: 'hanpass://',
    android: 'com.hanpass.app',
    web: 'https://www.hanpass.com',
  },
};
