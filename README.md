# Frugeasy

Simple personal finance app for **iOS + Android** with swipe-based tabs:

1. **Add** — input amount, choose `income` or `expense`, choose category, tap Save
2. **Monthly** — view month totals + optional deep **Analyze** mode on demand
3. **Budgeting** — monthly budgets and recurring rules
4. **Transactions** — filter/search, edit/delete items, and CSV export
5. **Settings** — currency preference

## Stack

- React Native
- Expo (TypeScript)
- SQLite (`expo-sqlite`) for local persistence

## Run locally

```bash
npm install
npm run start
```

Then open in Expo Go / simulator:

- `npm run android`
- `npm run ios` (macOS required for native iOS simulator)

## Quality checks

```bash
npm run typecheck
npm test
```

## Current data model

```ts
type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: 'Salary' | 'Freelance' | 'Business' | 'Investment' | 'Food' | 'Transport' | 'Housing' | 'Utilities' | 'Other';
  date: string; // ISO
  createdAt: string; // ISO
};
```

## Android release config (Play Store prep)

- Android package id: `com.arrodi.frugeasy`
- Android versionCode: `1` (increment on every Play release)

## Store prep docs

- `STORE_PREP.md` — listing text + asset checklist + policy checklist
- `PRIVACY_POLICY.md` — privacy policy text (publish this at a public URL for Play)

## Notes

- v1 is local-only (no auth, no cloud sync)
- currency display defaults to USD formatting for now
- data is stored in local SQLite DB: `frugeasy.db`
- Analyze mode includes dashboard-style time-series mini charts, category comparison table, month-over-month comparison, burn-rate projection, and largest/unusual transactions
- Transactions tab includes filters/search, delete, and CSV export
