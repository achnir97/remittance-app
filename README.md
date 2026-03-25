# Bridge — Life in Korea, Simplified

A mobile app for foreigners living in Korea. Bridge helps with money remittance comparison, legal rights, expense tracking, and more — personalized by your visa/residency type.

Built with React Native + Expo SDK 55.

---

## Features

| Feature | Status |
|---------|--------|
| Remittance rate comparison (SentBe, GME, Hanpass) | Live |
| OCR receipt scanning (offline queue) | Live |
| Expense dashboard with charts | Live |
| Legal rights AI chat | Live |
| 9-language support | Live |
| Health & Community sections | Coming Soon |

---

## Tech Stack

- **Framework**: Expo SDK ~55, React Native 0.83.2
- **Navigation**: expo-router (file-based)
- **State**: Zustand 5 + TanStack React Query 5
- **Database**: expo-sqlite (async API)
- **Auth**: Supabase
- **UI**: NativeWind (Tailwind for RN), react-native-svg
- **i18n**: i18n-js, 9 locales

---

## Project Structure

```
remittance-app/
├── app/                    # Expo Router screens (file = route)
│   ├── _layout.tsx         # Root layout + auth routing guard
│   ├── (auth)/             # Login, signup, forgot password
│   ├── (onboarding)/       # User-type selection (first launch)
│   ├── (tabs)/             # Main tab screens
│   └── legal/              # Legal feature nested routes
├── components/
│   ├── dashboard/          # Chart & summary components
│   ├── ocr/                # Camera & scan flow components
│   ├── legal/              # Legal AI chat components
│   └── *.tsx               # Shared reusable components
├── constants/              # Theme, corridors, providers, categories
├── hooks/                  # Custom React hooks (data + features)
├── lib/                    # Third-party SDK setup (Supabase)
├── locales/                # i18n config + 9 JSON translation files
├── services/
│   ├── db/                 # SQLite: connection, migrations, queries
│   │   ├── connection.ts   # Singleton + versioned migrations
│   │   ├── transactions.ts # Transaction CRUD + aggregate queries
│   │   ├── income.ts       # Income queries
│   │   ├── savings.ts      # Savings goals
│   │   ├── types.ts        # Database row types
│   │   └── index.ts        # Re-exports (public API)
│   ├── api.ts              # Axios HTTP client
│   ├── ocr.ts              # OCR backend integration
│   ├── imageProcessor.ts   # Image resize + compress
│   └── legal.ts            # Legal API wrapper
├── store/                  # Zustand stores (app state, auth)
├── types/                  # Shared TypeScript interfaces
└── utils/                  # Formatters, validators, helpers
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`

### Installation

```bash
git clone https://github.com/achnir97/remittance-app.git
cd remittance-app
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Fill in your values in .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |

### Running Locally

```bash
# Start Expo dev server
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests live in `__tests__/` and mirror the source structure:
- `__tests__/store/` — Zustand store tests
- `__tests__/services/` — API + database tests
- `__tests__/screens/auth/` — Auth screen tests

---

## Building for Production

### Configure EAS (first time only)

```bash
eas build:configure
```

### Build Profiles

```bash
# Development build (simulator)
eas build --profile development --platform ios

# Preview build (internal testing)
eas build --profile preview --platform all

# Production build (App Store / Play Store)
eas build --profile production --platform all
```

### Submit to Stores

```bash
eas submit --platform ios
eas submit --platform android
```

---

## Key Architecture Decisions

**Auth flow**: Supabase session → `useAuthStore` → protected routing in `app/_layout.tsx`

**Offline-first OCR**: Scans queue in SQLite when offline; retry on foreground + connectivity restore (`hooks/useOCR.ts`)

**Personalization**: User selects type (worker/student/tourist/resident) once at onboarding. `useAppStore` persists this; `app/(tabs)/home.tsx` renders a different layout per type.

**Database**: expo-sqlite with versioned migrations in `services/db/connection.ts`. All queries are parameterized.

---

## Manual Tasks Before Launch

- [ ] Rotate Supabase anon key (previous key was committed)
- [ ] Update Supabase redirect URL to `bridge://auth/callback`
- [ ] Set production API URL in EAS environment
- [ ] Run `eas build:configure` to get real project ID
- [ ] Create and host privacy policy
- [ ] Design 1024×1024 app icon

---

## License

Private — all rights reserved.
