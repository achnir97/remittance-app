import { ProviderName } from '../types';

interface ProviderMeta {
  color: string;
  lightBg: string;
  badge: string;
  fee: number;
}

export const PROVIDERS: Record<ProviderName, ProviderMeta> = {
  SentBe: { color: '#00C896', lightBg: 'rgba(0, 200, 150, 0.1)', badge: 'Most Popular', fee: 3500 },
  GME: { color: '#F5A623', lightBg: 'rgba(245, 166, 35, 0.1)', badge: 'EPS Workers', fee: 8000 },
  Hanpass: { color: '#1B6FEB', lightBg: 'rgba(27, 111, 235, 0.1)', badge: 'Fastest ⚡', fee: 2500 },
};

export const PROVIDER_NAMES: ProviderName[] = ['SentBe', 'GME', 'Hanpass'];
