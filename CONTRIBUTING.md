# Contributing to Bridge

## Development Setup

1. Fork and clone the repo
2. `npm install`
3. `cp .env.example .env` and fill in values
4. `npm start` to run the dev server

## Folder Conventions

| What | Where |
|------|-------|
| New screen | `app/(tabs)/your-screen.tsx` or new group folder |
| New component | `components/your-feature/YourComponent.tsx` |
| New hook | `hooks/useYourHook.ts` |
| New service/API call | `services/your-service.ts` |
| New DB table/query | `services/db/your-module.ts`, export via `services/db/index.ts` |
| New constant | `constants/yourConstants.ts`, export via `constants/index.ts` |
| New type | `types/index.ts` |
| New utility | `utils/formatters.ts` or `utils/validators.ts` |

## Naming Conventions

- **Screens**: `kebab-case.tsx` (matches URL slug)
- **Components**: `PascalCase.tsx`
- **Hooks**: `useCamelCase.ts` — always prefixed with `use`
- **Services/utils**: `camelCase.ts`
- **Constants**: `SCREAMING_SNAKE_CASE` for values, `PascalCase` for types
- **Types/interfaces**: `PascalCase`

## Import Style

Always use the `@/` path alias (not relative `../`):

```typescript
// Good
import { theme } from '@/constants';
import { useRates } from '@/hooks';
import { getDb } from '@/services/db';

// Avoid
import { theme } from '../../constants/theme';
```

## Adding a New Feature Screen

1. Create the screen file: `app/(tabs)/your-screen.tsx`
2. Add tab entry in `app/(tabs)/_layout.tsx` (use `href: null` to hide from tab bar)
3. Create feature components in `components/your-feature/`
4. Create a hook in `hooks/useYourFeature.ts` for data logic
5. Export the hook from `hooks/index.ts`
6. Add translations in all 9 locale files under `locales/`

## Adding a New DB Table

1. Add types to `services/db/types.ts`
2. Add migration SQL in `services/db/connection.ts` (increment version)
3. Create query functions in a new `services/db/your-table.ts`
4. Export from `services/db/index.ts`
5. Write tests in `__tests__/services/db.test.ts`

## Testing

- Write tests for all new hooks and services
- Minimum target: 70% coverage on `services/` and `hooks/`
- Run `npm test` before pushing
- Mock external dependencies (Supabase, SQLite) — see `jest.setup.js`

## Code Style

- Prettier runs on save (see `.prettierrc.json`)
- ESLint enforces import order, no-any, exhaustive deps
- Run `npx eslint . --fix` before PRs

## Commit Messages

Follow conventional commits:

```
feat: add savings goal screen
fix: correct currency formatting for JPY
refactor: split db.ts into feature modules
test: add useOCR retry logic tests
chore: update expo sdk to 55.1
```

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Add tests for new logic
- Update `README.md` if you add new env vars or change architecture
- Request review from at least one team member
