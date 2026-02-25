# Frugeasy

Simple personal finance app for **iOS + Android** with two core screens:

1. **Add Transaction** — input amount and choose `income` or `expense`
2. **Monthly Summary** — view current month totals (income, expenditure, net)

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
  date: string; // ISO
  createdAt: string; // ISO
};
```

## Notes

- v1 is local-only (no auth, no cloud sync)
- currency display defaults to USD formatting for now
- data is stored in local SQLite DB: `frugeasy.db`
