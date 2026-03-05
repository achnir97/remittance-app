// Bridge data visualization palette — all pass WCAG AA on ink-800 background
export const CATEGORIES = {
  'Remittance':          { icon: '💸', color: '#3B8BFF' },
  'Food & Groceries':    { icon: '🍱', color: '#00C896' },
  'Transport':           { icon: '🚇', color: '#F5A623' },
  'Phone & Internet':    { icon: '📱', color: '#9B72FF' },
  'Housing & Utilities': { icon: '🏠', color: '#00E5AC' },
  'Medical':             { icon: '💊', color: '#FF6B8A' },
  'Cash Withdrawal':     { icon: '🏧', color: '#6B8AAA' },
  'Other':               { icon: '📦', color: '#8A96AA' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export const CATEGORY_COLORS = Object.values(CATEGORIES).map((c) => c.color);
