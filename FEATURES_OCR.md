# OCR Receipt Scanner & Spending Tracker — Feature Specification
> **For Claude (Cursor):** This file extends FEATURES.md. Read both files before writing any code.
> Every section is labeled **[BACKEND]** or **[FRONTEND]**. Build backend endpoints first, test with curl, then build frontend against them.

---

## Overview

A one-tap receipt scanner that reads any financial document using Claude Vision API, extracts structured data, stores it encrypted on device, and visualizes spending patterns with maximum date flexibility.

```
FLOW:
  [FRONTEND] User taps Scan → camera or gallery
       ↓
  [FRONTEND] Resize image to 1024px, base64 encode
       ↓
  [BACKEND]  POST /ocr — validates image, calls Claude Vision, sanitizes response
       ↓
  [FRONTEND] Confirmation sheet — user reviews + edits extracted data
       ↓
  [FRONTEND] Save confirmed transaction to encrypted SQLite on device
       ↓
  [FRONTEND] Dashboard reads SQLite, renders charts for any date range 1–365 days
```

---

## Supported Receipt Types

| Type | Examples | Key Fields Extracted |
|---|---|---|
| Remittance | SentBe, GME, Hanpass | provider, sent KRW, fee, recipient amount, currency, rate |
| ATM / Bank | Hana, Shinhan, KB, Woori | bank name, amount withdrawn, balance after |
| Convenience Store | CU, GS25, 7-Eleven | merchant, total, items list |
| Restaurant / Food | Any Korean restaurant | merchant, total, date |
| Utility Bills | Electric, gas, water, phone | biller, amount due, billing period |
| Transport | T-money top-up, subway | amount, type |
| Medical | Clinic, pharmacy | merchant, amount |
| Any other bill | Rent, insurance, etc. | merchant, amount, date, category |

---

---

# ════════════════════════════════════════
# BACKEND
# ════════════════════════════════════════

> **Location:** `remittance-backend/` (existing FastAPI project)
> **New file:** `ocr_router.py`
> **Change to existing:** `main.py` (one line to include router)
> **Deployed on:** Railway
> **Key stored in:** Railway environment variables only — never in code

---

## New Packages [BACKEND]

Add to `requirements.txt`:
```
anthropic>=0.40.0
```

---

## New File: `ocr_router.py` [BACKEND]

Create this file inside `remittance-backend/`. It contains the entire OCR feature on the backend side.

### Complete implementation

```python
"""
ocr_router.py — Receipt OCR via Claude Vision API
==================================================
Endpoint:  POST /ocr
Security:  validates image bytes, enforces size limit, sanitizes all Claude output
Key:       reads ANTHROPIC_API_KEY from environment — never hardcoded
"""

import base64
import json
import logging
from datetime import date, datetime

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

log = logging.getLogger(__name__)

ocr_router = APIRouter()

# ── Constants ─────────────────────────────────────────────────

MAX_SIZE_BYTES = 5 * 1024 * 1024   # 5MB hard limit

MAGIC_BYTES = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png":  b"\x89PNG",
    "image/webp": b"RIFF",
}

VALID_CATEGORIES = {
    "Remittance", "Food & Groceries", "Transport",
    "Phone & Internet", "Housing & Utilities",
    "Medical", "Cash Withdrawal", "Other",
}

VALID_TYPES = {
    "remittance", "atm", "store", "restaurant",
    "utility", "transport", "medical", "other",
}

VALID_PROVIDERS  = {"SentBe", "GME", "Hanpass"}
VALID_CURRENCIES = {"PHP", "NPR", "VND", "IDR", "BDT", "MNT", "USD", "MYR", "THB", "CNY"}

OCR_PROMPT = """
You are a receipt scanner for a financial tracking app used by foreign workers in South Korea.

Extract data from this receipt image and return ONLY a valid JSON object.
No explanation, no markdown, no backticks — just the raw JSON.

Return this exact structure:
{
  "type": "remittance" | "atm" | "store" | "restaurant" | "utility" | "transport" | "medical" | "other",
  "date": "YYYY-MM-DD or null if not visible",
  "merchant": "name of store, bank, provider, or biller",
  "amount_krw": integer total amount paid in Korean Won (no symbols, integers only),
  "category": one of exactly: "Remittance" | "Food & Groceries" | "Transport" | "Phone & Internet" | "Housing & Utilities" | "Medical" | "Cash Withdrawal" | "Other",
  "remittance": {
    "provider": "SentBe" | "GME" | "Hanpass" | null,
    "sent_krw": integer | null,
    "fee_krw": integer | null,
    "recipient_gets": number | null,
    "recipient_currency": "PHP" | "NPR" | "VND" | "IDR" | "BDT" | "MNT" | "USD" | "MYR" | "THB" | "CNY" | null,
    "exchange_rate": number | null
  },
  "atm": {
    "bank": string | null,
    "balance_after_krw": integer | null,
    "transaction_type": "withdrawal" | "deposit" | null
  },
  "items": ["item1", "item2"] | null
}

Rules:
- If this is NOT a receipt or financial document: return {"error": "not_a_receipt"}
- If a field cannot be clearly read: set it to null — never guess
- amounts: integers only, no commas, no currency symbols
- remittance object: only populate when type is "remittance", otherwise set to null
- atm object: only populate when type is "atm", otherwise set to null
- items: only for store/restaurant, max 20 items, null otherwise
"""


# ── Request / Response models ─────────────────────────────────

class OCRRequest(BaseModel):
    image:      str             # base64 encoded image
    media_type: str = "image/jpeg"


# ── Main endpoint ─────────────────────────────────────────────

@ocr_router.post("/ocr")
async def ocr_receipt(req: OCRRequest):
    """
    Receives a base64 image from the mobile app.
    Validates it, calls Claude Vision API, sanitizes the response.
    The Anthropic API key never leaves this server.
    """

    # 1. Validate media type
    if req.media_type not in MAGIC_BYTES:
        raise HTTPException(400, f"Unsupported media type: {req.media_type}")

    # 2. Decode base64
    try:
        raw_bytes = base64.b64decode(req.image)
    except Exception:
        raise HTTPException(400, "Invalid base64 image data")

    # 3. Enforce size limit
    if len(raw_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(400, "Image too large — max 5MB")

    # 4. Verify magic bytes (confirm it is actually an image)
    expected_magic = MAGIC_BYTES[req.media_type]
    if not raw_bytes.startswith(expected_magic):
        raise HTTPException(400, "Invalid image format — file does not match declared type")

    # 5. Call Claude Vision API
    log.info(f"OCR: calling Claude Vision, image size={len(raw_bytes):,} bytes")
    raw_result = await _call_claude_vision(req.image, req.media_type)

    # 6. Sanitize Claude's output before returning
    clean_result = _sanitize(raw_result)
    log.info(f"OCR: result type={clean_result.get('type')} category={clean_result.get('category')}")

    return {"result": clean_result}


# ── Claude Vision API call ────────────────────────────────────

async def _call_claude_vision(image_b64: str, media_type: str) -> dict:
    client = anthropic.AsyncAnthropic()   # reads ANTHROPIC_API_KEY from env automatically

    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=600,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type":       "base64",
                        "media_type": media_type,
                        "data":       image_b64,
                    },
                },
                {
                    "type": "text",
                    "text": OCR_PROMPT,
                },
            ],
        }],
    )

    text = message.content[0].text.strip()

    try:
        # Strip accidental markdown fences if Claude adds them
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except json.JSONDecodeError:
        log.warning(f"OCR: Claude returned non-JSON: {text[:100]}")
        return {"error": "not_a_receipt"}


# ── Sanitize Claude's response ────────────────────────────────

def _sanitize(raw: dict) -> dict:
    """
    Validate and clean Claude's raw output.
    Never trust LLM output directly — enforce types, ranges, and whitelists.
    """

    # Pass through the not-a-receipt signal safely
    if raw.get("error") == "not_a_receipt":
        return {"error": "not_a_receipt"}

    # type
    receipt_type = raw.get("type", "other")
    if receipt_type not in VALID_TYPES:
        receipt_type = "other"

    # date
    date_str = _safe_date(raw.get("date"))

    # amount_krw
    amount = _safe_int(raw.get("amount_krw"), min_val=0, max_val=100_000_000)

    # category
    category = raw.get("category", "Other")
    if category not in VALID_CATEGORIES:
        category = "Other"

    # merchant
    merchant = raw.get("merchant")
    merchant = str(merchant)[:100] if merchant else None

    # remittance sub-object (only when type is remittance)
    remittance = None
    if receipt_type == "remittance" and isinstance(raw.get("remittance"), dict):
        r = raw["remittance"]
        remittance = {
            "provider":           r.get("provider") if r.get("provider") in VALID_PROVIDERS else None,
            "sent_krw":           _safe_int(r.get("sent_krw"), 0, 100_000_000),
            "fee_krw":            _safe_int(r.get("fee_krw"), 0, 1_000_000),
            "recipient_gets":     _safe_float(r.get("recipient_gets")),
            "recipient_currency": r.get("recipient_currency") if r.get("recipient_currency") in VALID_CURRENCIES else None,
            "exchange_rate":      _safe_float(r.get("exchange_rate")),
        }

    # atm sub-object (only when type is atm)
    atm = None
    if receipt_type == "atm" and isinstance(raw.get("atm"), dict):
        a = raw["atm"]
        atm = {
            "bank":              str(a.get("bank"))[:50] if a.get("bank") else None,
            "balance_after_krw": _safe_int(a.get("balance_after_krw"), 0, 1_000_000_000),
            "transaction_type":  a.get("transaction_type") if a.get("transaction_type") in ("withdrawal", "deposit") else None,
        }

    # items (only for store/restaurant)
    items = None
    if receipt_type in ("store", "restaurant") and isinstance(raw.get("items"), list):
        items = [str(i)[:50] for i in raw["items"][:20]]

    return {
        "type":       receipt_type,
        "date":       date_str,
        "merchant":   merchant,
        "amount_krw": amount,
        "category":   category,
        "remittance": remittance,
        "atm":        atm,
        "items":      items,
    }


# ── Helper validators ─────────────────────────────────────────

def _safe_int(val, min_val: int = 0, max_val: int = 100_000_000) -> int | None:
    try:
        v = int(float(str(val).replace(",", "")))
        return v if min_val <= v <= max_val else None
    except (ValueError, TypeError, AttributeError):
        return None

def _safe_float(val) -> float | None:
    try:
        return round(float(val), 8)
    except (ValueError, TypeError):
        return None

def _safe_date(val) -> str:
    today = date.today().isoformat()
    if not val:
        return today
    try:
        dt = datetime.strptime(str(val), "%Y-%m-%d").date()
        if dt > date.today() or dt.year < 2020:
            return today
        return dt.isoformat()
    except ValueError:
        return today
```

---

## Change to `main.py` [BACKEND]

Add two lines only:

```python
# At the top of main.py — add this import
from ocr_router import ocr_router

# Inside create_app() or at module level — add this line
app.include_router(ocr_router)
```

---

## Environment Variable [BACKEND]

```bash
# Set in Railway dashboard → Variables
# NEVER put this in .env or any file committed to git
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
```

Add to `.gitignore`:
```
.env
*.env
.env.local
```

---

## Backend File Summary

```
remittance-backend/
  main.py          ← CHANGE: add 2 lines (import + include_router)
  ocr_router.py    ← NEW: entire backend OCR feature
  requirements.txt ← CHANGE: add anthropic>=0.40.0
```

---

## Backend API Contract

```
POST /ocr
Content-Type: application/json

Request body:
{
  "image":      "<base64 string>",
  "media_type": "image/jpeg" | "image/png" | "image/webp"
}

Response 200 — receipt detected:
{
  "result": {
    "type":       "remittance",
    "date":       "2026-03-04",
    "merchant":   "Hanpass",
    "amount_krw": 1002500,
    "category":   "Remittance",
    "remittance": {
      "provider":           "Hanpass",
      "sent_krw":           1000000,
      "fee_krw":            2500,
      "recipient_gets":     99611,
      "recipient_currency": "NPR",
      "exchange_rate":      0.09961142
    },
    "atm":   null,
    "items": null
  }
}

Response 200 — not a receipt:
{
  "result": { "error": "not_a_receipt" }
}

Response 400 — validation errors:
{ "detail": "Image too large — max 5MB" }
{ "detail": "Invalid base64 image data" }
{ "detail": "Invalid image format — file does not match declared type" }
{ "detail": "Unsupported media type: image/gif" }
```

---

## Backend Test Commands

```bash
# Encode a receipt image
BASE64=$(base64 -i hanpass_receipt.jpg | tr -d '\n')

# Test 1: valid receipt
curl -s -X POST http://localhost:8000/ocr \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$BASE64\",\"media_type\":\"image/jpeg\"}" | python3 -m json.tool

# Test 2: invalid base64 → expect 400
curl -s -X POST http://localhost:8000/ocr \
  -H "Content-Type: application/json" \
  -d '{"image":"not-valid!!!","media_type":"image/jpeg"}'

# Test 3: wrong magic bytes (text file disguised as image) → expect 400
FAKE=$(base64 -i README.md | tr -d '\n')
curl -s -X POST http://localhost:8000/ocr \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$FAKE\",\"media_type\":\"image/jpeg\"}"

# Test 4: non-receipt photo (e.g. landscape) → expect not_a_receipt
BASE64_OTHER=$(base64 -i landscape.jpg | tr -d '\n')
curl -s -X POST http://localhost:8000/ocr \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$BASE64_OTHER\",\"media_type\":\"image/jpeg\"}"
```

---

---

# ════════════════════════════════════════
# FRONTEND
# ════════════════════════════════════════

> **Framework:** React Native + Expo
> **All financial data:** stored only on device (encrypted SQLite)
> **Backend calls:** only for OCR (`POST /ocr`) — charts and stats are computed locally from SQLite

---

## New Packages [FRONTEND]

```bash
npx expo install expo-camera
npx expo install expo-image-picker
npx expo install expo-image-manipulator
npx expo install expo-file-system
npx expo install expo-crypto
npx expo install expo-secure-store
npx expo install expo-sharing
npx expo install @react-native-community/netinfo
npm install @op-engineering/op-sqlite
npm install react-native-calendars
```

---

## New File Structure [FRONTEND]

```
app/(tabs)/
  scan.tsx                        ← Scan tab: camera + gallery + recent scans
  dashboard.tsx                   ← Dashboard tab: all charts + transaction list

components/
  ocr/
    CameraView.tsx                ← camera with dashed guide rectangle overlay
    GalleryPicker.tsx             ← expo-image-picker wrapper
    ConfirmationSheet.tsx         ← bottom sheet: review + edit before saving
    ReceiptTypeIcon.tsx           ← emoji icon per receipt type
    RecentScanRow.tsx             ← one row in recent scans list
    PrivacyNotice.tsx             ← one-time bottom sheet shown on first scan
    OfflineBadge.tsx              ← badge on tab icon showing pending count
  dashboard/
    PeriodSelector.tsx            ← preset pills + Custom button
    CalendarRangePicker.tsx       ← full calendar with range highlight
    SummaryCard.tsx               ← total spent / sent home / saved KPIs
    DonutChart.tsx                ← spending by category (Victory Native XL)
    SpendingBarChart.tsx          ← bars: auto-switches daily/weekly/monthly
    SpendingVsIncome.tsx          ← line chart: income vs total spending
    RemittanceTimeline.tsx        ← bars: amount sent home per period
    SavingsProgress.tsx           ← progress bar toward monthly goal
    CategoryCard.tsx              ← expandable card per category → transactions
    TransactionRow.tsx            ← single row: icon, merchant, date, amount
    EmptyState.tsx                ← shown when no data for selected range

hooks/
  useOCR.ts                       ← calls POST /ocr with retry + offline queue
  useTransactions.ts              ← SQLite CRUD: insert, delete, update, query
  useSpendingStats.ts             ← useMemo: stats computed from transactions array

services/
  db.ts                           ← encrypted SQLite: schema, migrations, queries
  imageProcessor.ts               ← resize to 1024px + base64 encode

store/
  useAppStore.ts                  ← add: selectedPeriod, customDateRange, pendingCount
```

---

## Encrypted SQLite Setup [FRONTEND]

`services/db.ts`

```ts
import { open } from "@op-engineering/op-sqlite"
import * as SecureStore from "expo-secure-store"
import * as Crypto from "expo-crypto"

// Encryption key stored in device keychain (never in AsyncStorage)
async function getOrCreateDbKey(): Promise<string> {
  let key = await SecureStore.getItemAsync("db_encryption_key")
  if (!key) {
    const bytes = await Crypto.getRandomBytesAsync(32)
    key = Buffer.from(bytes).toString("hex")
    await SecureStore.setItemAsync("db_encryption_key", key)
  }
  return key
}

// Call once on app startup in app/_layout.tsx
export async function openDb() {
  const key = await getOrCreateDbKey()
  const db = open({ name: "remittance.db", encryptionKey: key })
  await runMigrations(db)
  return db
}
```

---

## Database Schema [FRONTEND]

`services/db.ts` — run inside `runMigrations()`

```sql
CREATE TABLE IF NOT EXISTS schema_version (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT    NOT NULL,
  date         TEXT    NOT NULL,          -- YYYY-MM-DD
  merchant     TEXT,
  amount_krw   INTEGER NOT NULL,
  category     TEXT    NOT NULL,
  raw_ocr_json TEXT,                      -- full backend response for debugging
  image_path   TEXT,                      -- documentDirectory/receipts/<uuid>.jpg
  status       TEXT    DEFAULT 'confirmed',  -- 'confirmed' | 'pending' | 'failed'
  notes        TEXT,
  created_at   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS remittances (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id      INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  provider            TEXT,
  sent_krw            INTEGER,
  fee_krw             INTEGER,
  recipient_gets      REAL,
  recipient_currency  TEXT,
  exchange_rate       REAL
);

CREATE TABLE IF NOT EXISTS income (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT    NOT NULL,           -- YYYY-MM (month start)
  amount_krw  INTEGER NOT NULL,
  source      TEXT,
  notes       TEXT,
  created_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  target_krw INTEGER NOT NULL,
  period     TEXT    NOT NULL,            -- 'monthly' | 'weekly'
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tx_date     ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_tx_status   ON transactions(status);
```

### Migration runner

```ts
const CURRENT_SCHEMA_VERSION = 1

export async function runMigrations(db: DB) {
  const row = await db.getFirstAsync<{version: number}>(
    "SELECT MAX(version) as version FROM schema_version"
  ).catch(() => null)

  const current = row?.version ?? 0

  if (current < 1) {
    await db.execAsync(CREATE_ALL_TABLES_SQL)
    await db.runAsync(
      "INSERT INTO schema_version VALUES (1, ?)",
      [new Date().toISOString()]
    )
  }
  // Add future migrations here:
  // if (current < 2) { await db.execAsync("ALTER TABLE transactions ADD COLUMN ...") }
}
```

---

## Key SQLite Queries [FRONTEND]

`services/db.ts`

```ts
// Atomic insert — both tables or neither (never partial)
export async function insertTransaction(db: DB, data: OCRResult, imagePath: string): Promise<number> {
  await db.runAsync("BEGIN TRANSACTION")
  try {
    const r = await db.runAsync(
      `INSERT INTO transactions (type,date,merchant,amount_krw,category,raw_ocr_json,image_path,created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [data.type, data.date, data.merchant, data.amount_krw,
       data.category, JSON.stringify(data), imagePath, new Date().toISOString()]
    )
    const txId = r.insertId

    if (data.type === "remittance" && data.remittance) {
      const rem = data.remittance
      await db.runAsync(
        `INSERT INTO remittances (transaction_id,provider,sent_krw,fee_krw,recipient_gets,recipient_currency,exchange_rate)
         VALUES (?,?,?,?,?,?,?)`,
        [txId, rem.provider, rem.sent_krw, rem.fee_krw,
         rem.recipient_gets, rem.recipient_currency, rem.exchange_rate]
      )
    }
    await db.runAsync("COMMIT")
    return txId
  } catch (e) {
    await db.runAsync("ROLLBACK")
    throw e
  }
}

// Spending by category — for DonutChart
export async function getSpendingByCategory(db: DB, from: string, to: string) {
  return db.getAllAsync(
    `SELECT category, SUM(amount_krw) as total, COUNT(*) as count
     FROM transactions WHERE date BETWEEN ? AND ? AND status='confirmed'
     GROUP BY category ORDER BY total DESC`,
    [from, to]
  )
}

// Daily totals — for 1–31 day ranges
export async function getDailyTotals(db: DB, from: string, to: string) {
  return db.getAllAsync(
    `SELECT date, SUM(amount_krw) as total FROM transactions
     WHERE date BETWEEN ? AND ? AND status='confirmed'
     GROUP BY date ORDER BY date ASC`,
    [from, to]
  )
}

// Weekly totals — for 32–90 day ranges
export async function getWeeklyTotals(db: DB, from: string, to: string) {
  return db.getAllAsync(
    `SELECT strftime('%Y-W%W', date) as week, SUM(amount_krw) as total
     FROM transactions WHERE date BETWEEN ? AND ? AND status='confirmed'
     GROUP BY week ORDER BY week ASC`,
    [from, to]
  )
}

// Monthly totals — for 91–365 day ranges
export async function getMonthlyTotals(db: DB, from: string, to: string) {
  return db.getAllAsync(
    `SELECT strftime('%Y-%m', date) as month, SUM(amount_krw) as total
     FROM transactions WHERE date BETWEEN ? AND ? AND status='confirmed'
     GROUP BY month ORDER BY month ASC`,
    [from, to]
  )
}

// All remittances with joined detail — for RemittanceTimeline
export async function getRemittances(db: DB, from: string, to: string) {
  return db.getAllAsync(
    `SELECT t.*, r.provider, r.sent_krw, r.fee_krw,
            r.recipient_gets, r.recipient_currency, r.exchange_rate
     FROM transactions t LEFT JOIN remittances r ON r.transaction_id = t.id
     WHERE t.type='remittance' AND t.date BETWEEN ? AND ? AND t.status='confirmed'
     ORDER BY t.date DESC`,
    [from, to]
  )
}

// Pending queue — for offline retry
export async function getPendingScans(db: DB) {
  return db.getAllAsync(
    "SELECT * FROM transactions WHERE status='pending' ORDER BY created_at ASC"
  )
}
```

---

## Image Processor [FRONTEND]

`services/imageProcessor.ts`

```ts
import * as ImageManipulator from "expo-image-manipulator"
import * as FileSystem from "expo-file-system"
import * as Crypto from "expo-crypto"

export async function prepareImageForOCR(uri: string): Promise<{
  base64: string
  localPath: string
  mediaType: "image/jpeg"
}> {
  // 1. Resize to max 1024px width, compress to JPEG
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  )

  // 2. Save local copy using UUID (collision-safe)
  const uuid = Crypto.randomUUID()
  const dir  = `${FileSystem.documentDirectory}receipts/`
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  const localPath = `${dir}${uuid}.jpg`
  await FileSystem.copyAsync({ from: resized.uri, to: localPath })

  return { base64: resized.base64!, localPath, mediaType: "image/jpeg" }
}
```

---

## OCR Hook [FRONTEND]

`hooks/useOCR.ts`

```ts
import { useState } from "react"
import NetInfo from "@react-native-community/netinfo"
import { prepareImageForOCR } from "@/services/imageProcessor"
import { insertTransaction } from "@/services/db"

export type OCRStatus = "idle" | "processing" | "success" | "error" | "not_receipt" | "queued"

export function useOCR(db: DB) {
  const [status, setStatus] = useState<OCRStatus>("idle")
  const [result, setResult] = useState<OCRResult | null>(null)

  async function scanImage(uri: string) {
    setStatus("processing")
    setResult(null)

    try {
      const { base64, localPath, mediaType } = await prepareImageForOCR(uri)
      const net = await NetInfo.fetch()

      if (!net.isConnected) {
        // Offline — save photo and queue for later
        await insertTransaction(db, {
          type: "other", date: new Date().toISOString().split("T")[0],
          merchant: null, amount_krw: 0, category: "Other",
          status: "pending"
        }, localPath)
        setStatus("queued")
        return
      }

      const ocrResult = await _callWithRetry(base64, mediaType)

      if (ocrResult.error === "not_a_receipt") {
        setStatus("not_receipt")
        return
      }

      setResult(ocrResult)
      setStatus("success")

    } catch (e) {
      setStatus("error")
    }
  }

  return { status, result, scanImage }
}

// Exponential backoff: attempt 1 → 1s wait, attempt 2 → 2s wait, attempt 3 → throw
async function _callWithRetry(base64: string, mediaType: string, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ocr`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ image: base64, media_type: mediaType }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data.result
    } catch (e) {
      if (attempt === maxAttempts) throw e
      await new Promise(r => setTimeout(r, Math.pow(2, attempt - 1) * 1000))
    }
  }
}
```

---

## Offline Queue [FRONTEND]

`app/_layout.tsx` — add this to root layout so it fires every time app comes to foreground:

```ts
import { AppState } from "react-native"
import NetInfo from "@react-native-community/netinfo"
import { getPendingScans, insertTransaction } from "@/services/db"
import { prepareImageForOCR } from "@/services/imageProcessor"

useEffect(() => {
  const sub = AppState.addEventListener("change", async (nextState) => {
    if (nextState === "active") {
      const net = await NetInfo.fetch()
      if (net.isConnected) {
        await retryPendingScans(db)
      }
    }
  })
  return () => sub.remove()
}, [db])

async function retryPendingScans(db: DB) {
  const pending = await getPendingScans(db)
  for (const scan of pending) {
    try {
      // Re-read saved image and retry OCR
      const base64 = await FileSystem.readAsStringAsync(scan.image_path, {
        encoding: FileSystem.EncodingType.Base64
      })
      const result = await _callWithRetry(base64, "image/jpeg")
      if (result && !result.error) {
        // Update status to confirmed + update fields
        await db.runAsync(
          "UPDATE transactions SET status='confirmed', type=?, merchant=?, amount_krw=?, category=? WHERE id=?",
          [result.type, result.merchant, result.amount_krw, result.category, scan.id]
        )
      }
    } catch {
      // Leave as pending, try again next foreground
    }
  }
}
```

---

## Spending Stats Hook [FRONTEND]

`hooks/useSpendingStats.ts`

```ts
import { useMemo } from "react"

export function useSpendingStats(transactions: Transaction[], from: string, to: string) {
  return useMemo(() => {
    const inRange = transactions.filter(
      t => t.date >= from && t.date <= to && t.status === "confirmed"
    )
    const totalSpent   = inRange.reduce((s, t) => s + t.amount_krw, 0)
    const remittances  = inRange.filter(t => t.type === "remittance")
    const sentHome     = remittances.reduce((s, t) => s + t.amount_krw, 0)
    const totalFees    = remittances.reduce((s, t) => s + (t.fee_krw ?? 0), 0)

    const byCategory = inRange.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount_krw
      return acc
    }, {} as Record<string, number>)

    const sorted         = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
    const topCategory    = sorted[0]?.[0] ?? null
    const topCategoryPct = topCategory && totalSpent > 0
      ? Math.round(byCategory[topCategory] / totalSpent * 100) : 0

    return {
      totalSpent,
      sentHome,
      sentHomePct:      totalSpent > 0 ? Math.round(sentHome / totalSpent * 100) : 0,
      totalFees,
      remittanceCount:  remittances.length,
      byCategory,
      topCategory,
      topCategoryPct,
      transactionCount: inRange.length,
    }
  }, [transactions, from, to])
}
```

---

## Screen 1 — Scan Tab [FRONTEND]

`app/(tabs)/scan.tsx`

### Layout

```
┌─────────────────────────────────┐
│  [Header] Scan Receipt          │
├─────────────────────────────────┤
│   ┌─────────────────────────┐   │
│   │  📷  Take a Photo        │   │
│   └─────────────────────────┘   │
│   ┌─────────────────────────┐   │
│   │  🖼   Choose from Gallery│   │
│   └─────────────────────────┘   │
│  ── Recent Scans ────────────── │
│  💸 Hanpass    Mar 4 ₩1,002,500 │
│  🍱 GS25       Mar 3    ₩8,500  │
│  🏧 Hana ATM   Mar 1  ₩300,000  │
│  📱 KT Bill   Feb 28   ₩55,000  │
└─────────────────────────────────┘
```

### Camera overlay

```
┌─────────────────────────────────┐
│                          [✕]    │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│   │  Align receipt here    │   │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│  [🔦 Flash]        [📷 Capture] │
└─────────────────────────────────┘
```

### Processing overlay

```
┌─────────────────────────────────┐
│  🔍 Reading receipt…            │
│  [████████████░░░░  65%]        │
└─────────────────────────────────┘
```

### Confirmation sheet (bottom sheet)

```
┌─────────────────────────────────┐
│  ✅ Receipt Detected             │
│  Type      [Remittance      ▾]  │
│  Provider  [Hanpass         ▾]  │
│  Amount    [₩1,002,500       ]  │
│  Date      [Mar 4, 2026      ]  │
│  Category  [Remittance      ▾]  │
│  [Discard]         [Save ✓]     │
└─────────────────────────────────┘
```

All fields editable. User must tap Save to confirm. Tap Discard → delete local image.

### Scan behavior rules

| Trigger | Action |
|---|---|
| Tap "Take a Photo" | Open `CameraView` |
| Tap "Choose from Gallery" | Open `expo-image-picker` |
| Photo captured | Call `useOCR.scanImage(uri)` |
| `status === "processing"` | Show progress overlay |
| `status === "success"` | Slide up `ConfirmationSheet` with pre-filled fields |
| `status === "not_receipt"` | Toast: `i18n.t("scan.notReceipt")` |
| `status === "error"` | Toast with retry button |
| `status === "queued"` | Toast: `i18n.t("scan.queued")` + badge on tab |
| Tap Save | `insertTransaction()` → close sheet → refresh recent list |
| Tap Discard | Close sheet + delete local image file |
| First ever scan | Show `PrivacyNotice` bottom sheet first |

### Privacy notice (one-time, on first scan)

```
┌─────────────────────────────────┐
│  📱 Your Privacy                 │
│  Receipt photos are processed   │
│  by AI to extract amounts and   │
│  dates. Images are not stored   │
│  on our servers. All financial  │
│  data stays only on this device.│
│           [Got it ✓]            │
└─────────────────────────────────┘
```

---

## Screen 2 — Dashboard Tab [FRONTEND]

`app/(tabs)/dashboard.tsx`

### Layout (scrollable)

```
┌─────────────────────────────────┐
│  [Header] My Spending           │
├─────────────────────────────────┤
│  [PeriodSelector]               │
│  Today|7d|14d|1M|2M|Custom     │
├─────────────────────────────────┤
│  [SummaryCard]                  │
│  Total Spent   ₩2,340,000       │
│  Sent Home     ₩1,002,500 (43%) │
│  Saved         ₩337,500   (14%) │
├─────────────────────────────────┤
│  [DonutChart]                   │
│  Spending by Category           │
│  Tap slice → filter list        │
├─────────────────────────────────┤
│  [SpendingBarChart]             │
│  Auto: daily|weekly|monthly     │
├─────────────────────────────────┤
│  [SpendingVsIncome]             │
│  Income vs Total Spending       │
├─────────────────────────────────┤
│  [RemittanceTimeline]           │
│  How Much You Sent Home         │
├─────────────────────────────────┤
│  [SavingsProgress]              │
│  Goal: ₩500,000/month           │
│  ████████░░░  ₩337,500  67%     │
├─────────────────────────────────┤
│  [CategoryCard] 💸 Remittance   │
│  [CategoryCard] 🍱 Food         │
│  [CategoryCard] 🏧 ATM          │
└─────────────────────────────────┘
```

### PeriodSelector presets + custom calendar

```
Presets: [Today] [7 days] [14 days] [1 month] [2 months] [Custom ▾]

Custom → CalendarRangePicker:
┌─────────────────────────────────┐
│  Select Date Range              │
│  ◀   March 2026   ▶             │
│  Mo Tu We Th Fr Sa Su           │
│   9 10 [11 12 13 14 15]         │ ← highlighted range
│  Mar 11 → Mar 15  (5 days)      │
│  [Cancel]          [Apply]      │
└─────────────────────────────────┘

Range: minimum 1 day, maximum 365 days
```

### Bar chart auto-granularity

| Range | Chart mode | X-axis |
|---|---|---|
| 1–7 days | Daily | Mon / Tue / Wed |
| 8–31 days | Daily | Mar 1 / Mar 2 |
| 32–90 days | Weekly | Week 11 / Week 12 |
| 91–365 days | Monthly | Jan / Feb / Mar |

Never render more than 31 bars. Granularity auto-switches — never show 365 daily bars.

### Transaction list (below charts)

```
💸  Hanpass Remittance     Mar 4    ₩1,002,500
🍱  GS25 Itaewon           Mar 3       ₩8,500
🏧  Hana Bank ATM          Mar 1     ₩300,000
```

- Tap row → detail screen with receipt thumbnail
- Swipe left → Delete (with confirmation alert)
- Long press → edit category or amount
- Tap DonutChart slice → filters this list to that category

---

## Spending Categories Constants [FRONTEND]

`constants/categories.ts`

```ts
export const CATEGORIES = {
  "Remittance":          { icon: "💸", color: "#1565C0" },
  "Food & Groceries":    { icon: "🍱", color: "#0B8F5E" },
  "Transport":           { icon: "🚇", color: "#C95B1A" },
  "Phone & Internet":    { icon: "📱", color: "#7C3AED" },
  "Housing & Utilities": { icon: "🏠", color: "#0891B2" },
  "Medical":             { icon: "💊", color: "#DC2626" },
  "Cash Withdrawal":     { icon: "🏧", color: "#64748B" },
  "Other":               { icon: "📦", color: "#94A3B8" },
} as const
```

---

## Performance Rules [FRONTEND]

- Resize images to max 1024px before sending to backend — never send full resolution
- `useSpendingStats` wrapped in `useMemo` — never recomputes on unrelated renders
- `FlatList` with `getItemLayout` for transaction list — handles 1000+ rows
- Calendar picker loads 3 months at a time — lazy-loads others
- SQLite queries use indexed columns (`date`, `category`, `status`) — never full table scans
- Charts use `useMemo` on data arrays — Victory Native XL does not re-render unless data changes

---

## New Locale Keys [FRONTEND]

Add these keys to all 9 language files (`en.json`, `ko.json`, `ne.json`, `vi.json`, `bn.json`, `fil.json`, `zh.json`, `km.json`, `th.json`):

```json
{
  "scan": {
    "title":            "Scan Receipt",
    "takePhoto":        "Take a Photo",
    "chooseGallery":    "Choose from Gallery",
    "recentScans":      "Recent Scans",
    "processing":       "Reading receipt…",
    "notReceipt":       "Could not read receipt — try better lighting",
    "queued":           "Saved — will process when online",
    "confirm":          "Receipt Detected",
    "discard":          "Discard",
    "save":             "Save",
    "pendingBadge":     "{{count}} pending",
    "permissionCamera": "Camera access is needed to scan receipts",
    "permissionGallery":"Gallery access is needed to choose photos",
    "privacy": {
      "title":   "Your Privacy",
      "body":    "Receipt photos are processed by AI to extract amounts and dates. Images are not stored on our servers. All your financial data stays only on this device.",
      "confirm": "Got it ✓"
    }
  },
  "dashboard": {
    "title":              "My Spending",
    "totalSpent":         "Total Spent",
    "sentHome":           "Sent Home",
    "saved":              "Saved",
    "spendingByCategory": "Spending by Category",
    "weeklySpending":     "Weekly Spending",
    "dailySpending":      "Daily Spending",
    "monthlySpending":    "Monthly Spending",
    "remittanceHistory":  "Sent Home History",
    "savingsGoal":        "Savings Goal",
    "incomeVsSpend":      "Income vs Spending",
    "noData":             "No transactions yet. Scan a receipt to get started.",
    "addIncome":          "Add your monthly income to track savings",
    "transactions":       "Transactions",
    "allCategories":      "All Categories",
    "deleteConfirm":      "Delete this transaction?",
    "deleteYes":          "Delete",
    "deleteNo":           "Cancel"
  },
  "period": {
    "today":        "Today",
    "days7":        "7 days",
    "days14":       "14 days",
    "month1":       "1 month",
    "month2":       "2 months",
    "custom":       "Custom",
    "selectRange":  "Select Date Range",
    "cancel":       "Cancel",
    "apply":        "Apply",
    "daysSelected": "{{count}} days selected"
  },
  "categories": {
    "Remittance":          "Remittance",
    "Food & Groceries":    "Food & Groceries",
    "Transport":           "Transport",
    "Phone & Internet":    "Phone & Internet",
    "Housing & Utilities": "Housing & Utilities",
    "Medical":             "Medical",
    "Cash Withdrawal":     "Cash Withdrawal",
    "Other":               "Other"
  },
  "receiptTypes": {
    "remittance":  "Remittance",
    "atm":         "ATM Withdrawal",
    "store":       "Store Purchase",
    "restaurant":  "Restaurant",
    "utility":     "Utility Bill",
    "transport":   "Transport",
    "medical":     "Medical",
    "other":       "Other"
  }
}
```

---

---

# ════════════════════════════════════════
# TESTING
# ════════════════════════════════════════

---

## Backend Tests (pytest) [BACKEND]

`tests/test_ocr.py`

```python
import base64, pytest
from fastapi.testclient import TestClient
from main import app
from ocr_router import sanitize_ocr_result, _safe_int, _safe_date

client = TestClient(app)

# ── Endpoint validation tests ──────────────────────────────────

def test_rejects_oversized_image():
    big = base64.b64encode(b"A" * (6 * 1024 * 1024)).decode()
    r = client.post("/ocr", json={"image": big, "media_type": "image/jpeg"})
    assert r.status_code == 400

def test_rejects_invalid_base64():
    r = client.post("/ocr", json={"image": "not-valid!!!", "media_type": "image/jpeg"})
    assert r.status_code == 400

def test_rejects_wrong_magic_bytes():
    fake = base64.b64encode(b"this is plain text, not an image").decode()
    r = client.post("/ocr", json={"image": fake, "media_type": "image/jpeg"})
    assert r.status_code == 400

def test_rejects_unsupported_media_type():
    r = client.post("/ocr", json={"image": "abc", "media_type": "image/gif"})
    assert r.status_code == 400

# ── Sanitizer unit tests ───────────────────────────────────────

def test_not_a_receipt_passthrough():
    assert sanitize_ocr_result({"error": "not_a_receipt"}) == {"error": "not_a_receipt"}

def test_negative_amount_becomes_none():
    r = sanitize_ocr_result({"amount_krw": -5000, "category": "Other", "type": "store", "date": "2026-03-04"})
    assert r["amount_krw"] is None

def test_amount_over_100m_becomes_none():
    r = sanitize_ocr_result({"amount_krw": 200_000_000, "category": "Other", "type": "store", "date": "2026-03-04"})
    assert r["amount_krw"] is None

def test_unknown_category_defaults_to_other():
    r = sanitize_ocr_result({"amount_krw": 10000, "category": "Gambling", "type": "store", "date": "2026-03-04"})
    assert r["category"] == "Other"

def test_future_date_becomes_today():
    from datetime import date
    r = sanitize_ocr_result({"amount_krw": 10000, "category": "Other", "type": "store", "date": "2099-01-01"})
    assert r["date"] == date.today().isoformat()

def test_null_date_becomes_today():
    from datetime import date
    r = sanitize_ocr_result({"amount_krw": 10000, "category": "Other", "type": "store", "date": None})
    assert r["date"] == date.today().isoformat()

def test_merchant_truncated_to_100_chars():
    long = "A" * 200
    r = sanitize_ocr_result({"amount_krw": 10000, "category": "Other", "type": "store", "date": "2026-03-04", "merchant": long})
    assert len(r["merchant"]) == 100

def test_invalid_provider_becomes_none():
    r = sanitize_ocr_result({
        "amount_krw": 1000000, "category": "Remittance", "type": "remittance",
        "date": "2026-03-04",
        "remittance": {"provider": "FakeBank", "sent_krw": 1000000, "fee_krw": 2500,
                       "recipient_gets": 99611, "recipient_currency": "NPR", "exchange_rate": 0.09961}
    })
    assert r["remittance"]["provider"] is None

def test_items_capped_at_20():
    items = [f"item{i}" for i in range(50)]
    r = sanitize_ocr_result({"amount_krw": 10000, "category": "Food & Groceries",
                               "type": "store", "date": "2026-03-04", "items": items})
    assert len(r["items"]) == 20
```

---

## Frontend Tests (Jest) [FRONTEND]

`__tests__/spendingStats.test.ts`

```ts
import { renderHook } from "@testing-library/react-hooks"
import { useSpendingStats } from "@/hooks/useSpendingStats"

const TX = [
  { id:1, type:"remittance", date:"2026-03-04", amount_krw:1002500, category:"Remittance", status:"confirmed", fee_krw:2500 },
  { id:2, type:"store",      date:"2026-03-03", amount_krw:8500,    category:"Food & Groceries", status:"confirmed" },
  { id:3, type:"atm",        date:"2026-03-01", amount_krw:300000,  category:"Cash Withdrawal", status:"confirmed" },
  { id:4, type:"store",      date:"2026-02-15", amount_krw:15000,   category:"Transport", status:"confirmed" },
  { id:5, type:"store",      date:"2026-03-05", amount_krw:50000,   category:"Other", status:"pending" },
]

test("sums only transactions within date range", () => {
  const { result } = renderHook(() => useSpendingStats(TX, "2026-03-01", "2026-03-31"))
  expect(result.current.totalSpent).toBe(1311000)   // excludes Feb + pending
})

test("excludes pending transactions", () => {
  const { result } = renderHook(() => useSpendingStats(TX, "2026-03-01", "2026-03-31"))
  expect(result.current.transactionCount).toBe(3)   // not 4 (pending excluded)
})

test("returns 0 not error for empty range", () => {
  const { result } = renderHook(() => useSpendingStats([], "2026-03-01", "2026-03-31"))
  expect(result.current.totalSpent).toBe(0)
  expect(result.current.transactionCount).toBe(0)
})

test("calculates sentHome correctly", () => {
  const { result } = renderHook(() => useSpendingStats(TX, "2026-03-01", "2026-03-31"))
  expect(result.current.sentHome).toBe(1002500)
  expect(result.current.remittanceCount).toBe(1)
})

test("handles single day range", () => {
  const { result } = renderHook(() => useSpendingStats(TX, "2026-03-04", "2026-03-04"))
  expect(result.current.totalSpent).toBe(1002500)
})

test("groups by category correctly", () => {
  const { result } = renderHook(() => useSpendingStats(TX, "2026-03-01", "2026-03-31"))
  expect(result.current.byCategory["Remittance"]).toBe(1002500)
  expect(result.current.byCategory["Food & Groceries"]).toBe(8500)
})

test("topCategory is highest spend category", () => {
  const { result } = renderHook(() => useSpendingStats(TX, "2026-03-01", "2026-03-31"))
  expect(result.current.topCategory).toBe("Remittance")
})
```

---

## Manual QA Checklist

### OCR receipt types

| Receipt | Expected |
|---|---|
| Hanpass receipt (English) | All remittance fields extracted |
| GME receipt (English) | All remittance fields extracted |
| SentBe receipt (English) | All remittance fields extracted |
| Korean ATM slip | amount_krw + bank extracted |
| GS25 receipt (Korean) | total + items extracted |
| Restaurant bill (handwritten) | total extracted or graceful nulls |
| Electric bill (Korean) | amount + biller name extracted |
| Blurry photo | "try better lighting" toast |
| Too dark photo | "try better lighting" toast |
| Photo of phone screen | still extracts correctly |
| Partial receipt (cut off) | readable fields extracted, rest null |
| Selfie / non-receipt image | "not a receipt" toast |
| Image > 5MB | "image too large" backend 400 |
| No internet | queued toast + badge on tab icon |
| Internet returns | pending scan auto-retried |

### Dashboard charts

| Scenario | Expected |
|---|---|
| 0 transactions in range | Empty state shown, no crash |
| 1 transaction only | Single bar + full circle donut |
| All spending one category | Full circle donut, no crash |
| Range = 1 day | Daily bars, 1 bar |
| Range = 365 days | Monthly bars (12 max) |
| Range crosses year boundary | Dec + Jan both correct |
| Savings goal not set | Component hidden, prompt shown |
| Income not entered | SpendingVsIncome hidden, prompt shown |
| Tap donut slice | Transaction list filters to that category |
| Swipe delete + confirm | Removed from list + SQLite |
| Long press + edit | Category updated, chart refreshes |

---

---

# ════════════════════════════════════════
# SECURITY CHECKLIST
# ════════════════════════════════════════

## Backend

- [ ] `ANTHROPIC_API_KEY` in Railway env vars only — not in `.env`, not in code
- [ ] `.env` and `*.env` are in `.gitignore`
- [ ] `/ocr` validates media type whitelist before any processing
- [ ] `/ocr` validates magic bytes (not just file extension)
- [ ] `/ocr` enforces 5MB hard limit
- [ ] All Claude response fields type-checked and range-validated
- [ ] Category whitelisted — never raw Claude string passed to response
- [ ] Merchant name truncated to 100 chars
- [ ] No `print()` or `log.info()` statements containing image data or financial amounts in production

## Frontend

- [ ] DB encryption key in `expo-secure-store` (device keychain) — never AsyncStorage
- [ ] Receipt images saved to `documentDirectory` — not `cacheDirectory`
- [ ] Image filenames use `Crypto.randomUUID()` — not timestamps
- [ ] Privacy notice shown on first scan, never shown again
- [ ] `EXPO_PUBLIC_API_URL` uses `https://` in production build
- [ ] No `console.log()` with financial data in production (`__DEV__` guard)
- [ ] Delete action requires explicit confirmation alert
- [ ] Pending retry only triggers when `NetInfo.isConnected === true`
- [ ] `insertTransaction` uses `BEGIN/COMMIT/ROLLBACK` — atomic writes only
