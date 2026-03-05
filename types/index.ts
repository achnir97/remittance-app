export interface ProviderResult {
  provider: string;
  rank: number;
  exchange_rate: number;
  mid_market_rate: number;
  markup_percent: number;
  transfer_fee_krw: number;
  recipient_gets: number;
  total_debited_krw: number;
  reverse_rate: number;
  transfer_speed: string;
  extra: {
    rate_expression: string;
    min_send_krw: number;
    max_send_krw: number;
  };
  collected_at: string;
  source: string;
}

export interface RatesResponse {
  from_currency: string;
  to_currency: string;
  send_amount: number;
  providers: ProviderResult[];
  best_recipient: number;
  fetched_at: string;
  stale: boolean;
  cache_ttl_mins: number;
}

export interface HistoryBucket {
  timestamp: string;
  provider: string;
  exchange_rate: number;
}

export interface HistoryResponse {
  from_currency: string;
  to_currency: string;
  days: number;
  data: HistoryBucket[];
}

export interface Corridor {
  from: string;
  to: string;
  flag: string;
  label: string;
}

export type Language = 'en' | 'ko' | 'ne' | 'vi' | 'bn' | 'fil' | 'zh' | 'km' | 'th';

export type ProviderName = 'SentBe' | 'GME' | 'Hanpass';

export type SpendingCategory =
  | 'Remittance'
  | 'Food & Groceries'
  | 'Transport'
  | 'Phone & Internet'
  | 'Housing & Utilities'
  | 'Medical'
  | 'Cash Withdrawal'
  | 'Other';

export interface OCRResult {
  type: 'remittance' | 'atm' | 'store' | 'restaurant' | 'utility' | 'transport' | 'medical' | 'other';
  date: string | null;
  merchant: string | null;
  amount_krw: number | null;
  category: SpendingCategory;
  remittance?: {
    provider: string | null;
    sent_krw: number | null;
    fee_krw: number | null;
    recipient_gets: number | null;
    recipient_currency: string | null;
    exchange_rate: number | null;
  };
  atm?: {
    bank: string | null;
    balance_after_krw: number | null;
    transaction_type: 'withdrawal' | 'deposit' | null;
  };
  items?: string[] | null;
  error?: 'not_a_receipt';
}

export type ExpenseCategory =
  | 'food'
  | 'transportation'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'other'
  | 'misc';

export interface ExpenseEntry {
  id: string;
  timestamp: string;
  amount_krw: number;
  merchant?: string;
  category: ExpenseCategory;
  city?: string;
  country?: string;
  source: 'ocr';
  image_url?: string;
  raw_text?: string;
}

export interface ScanReceiptResponse {
  entries: ExpenseEntry[];
}

// ─── Legal AI ────────────────────────────────────────────────

export type LegalDomain = 'employment' | 'visa' | 'injury' | 'contract' | 'realestate' | 'general';

export interface LegalHotline {
  name: string;
  number: string;
  hours: string;
  languages: string[];
}

export interface LegalResponse {
  summary: string;
  explanation: string;
  action_steps: string[];
  important_note?: string;
  hotline: LegalHotline;
  disclaimer: string;
  // Document-specific fields
  document_type?: string;
  full_translation?: string;
  key_clauses?: ClauseAnalysis[];
  answer_to_question?: string;
}

export interface ClauseAnalysis {
  clause: string;
  explanation: string;
  concern_level: 'ok' | 'warning' | 'violation';
}

export interface LegalChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: LegalResponse;
  emergency?: boolean;
  timestamp: number;
}

export interface HotlineEntry {
  name: string;
  number: string;
  hours: string;
  languages: string[];
}

export interface LegalHotlinesResponse {
  emergency: HotlineEntry[];
  labor: HotlineEntry[];
  immigration: HotlineEntry[];
  legal_aid: HotlineEntry[];
  housing: HotlineEntry[];
}
