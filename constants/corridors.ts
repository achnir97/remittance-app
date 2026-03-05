import { Corridor } from '../types';

export const CORRIDORS: Corridor[] = [
  { from: 'KRW', to: 'PHP', flag: '🇵🇭', label: 'Philippines' },
  { from: 'KRW', to: 'VND', flag: '🇻🇳', label: 'Vietnam' },
  { from: 'KRW', to: 'NPR', flag: '🇳🇵', label: 'Nepal' },
  { from: 'KRW', to: 'IDR', flag: '🇮🇩', label: 'Indonesia' },
  { from: 'KRW', to: 'BDT', flag: '🇧🇩', label: 'Bangladesh' },
  { from: 'KRW', to: 'MNT', flag: '🇲🇳', label: 'Mongolia' },
  { from: 'KRW', to: 'USD', flag: '🇺🇸', label: 'USA' },
  { from: 'KRW', to: 'MYR', flag: '🇲🇾', label: 'Malaysia' },
  { from: 'KRW', to: 'THB', flag: '🇹🇭', label: 'Thailand' },
  { from: 'KRW', to: 'CNY', flag: '🇨🇳', label: 'China' },
];

export const DEFAULT_CORRIDOR = CORRIDORS[0];
