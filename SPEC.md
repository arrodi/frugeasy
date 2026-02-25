# Frugeasy — Product & Engineering Spec

_Status: Active v1 definition_
_Last updated: 2026-02-24 (UTC)_

## 1) Product Goal

Build a simple mobile app (iOS + Android) for tracking income and expenses with a clear monthly summary.

## 2) Target Users

- Primary: Individuals managing personal finances with minimal friction
- Secondary: Students/freelancers who need quick monthly cashflow visibility

## 3) Core User Problems

1. Logging income/expense quickly is annoying in complex finance apps.
2. Users want one place to see monthly totals for income vs expenditure.
3. Users need a lightweight app that works on both iOS and Android.

## 4) Scope

### In Scope (v1)
- Two-screen app:
  1) Entry screen: input an amount and mark as income or expense
  2) Monthly summary screen: totals for monthly income, expenditure, and net
- Local data persistence on device
- Basic transaction list (current month)

### Out of Scope (for now)
- Bank integrations/sync
- Accounts, categories, budgets, recurring transactions, cloud sync, auth

## 5) Tech Stack

- Frontend: React Native + Expo (TypeScript)
- Backend: None (local-first)
- Database: Local SQLite (`expo-sqlite`)
- Auth: None for v1
- Hosting/Infra: Expo EAS build/distribution for iOS + Android
- CI/CD: GitHub Actions (lint + tests)

## 6) Engineering Standards

- Code style: keep components/functions small and readable.
- Add tests for calculation logic.
- Prefer incremental PRs over large rewrites.
- Keep docs updated when behavior changes.
- No secrets in repo.

## 7) Definition of Done (DoD)

A task is done when:
- [ ] Feature works locally in Expo
- [ ] Tests pass
- [ ] Lint/type checks pass
- [ ] Docs/README updated (if needed)
- [ ] Commit message is clear

## 8) Branching & Merge Policy

- Default mode: PR-based
- Branch naming: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`
- Merge strategy: squash merge
- Direct pushes to `main`: only if explicitly approved

## 9) Autonomous Development Policy

The agent may:
- pick the highest-priority unblocked task from `BACKLOG.md`
- implement small, reversible increments
- open/update PRs with concise summaries

The agent must ask before:
- breaking data model changes
- major dependency upgrades
- deleting significant code paths
- changing core UX of the two-screen flow

## 10) Open Questions

- Currency format and locale defaults?
- Should monthly summary include previous months navigation in v1?
- Should we allow editing/deleting transactions in v1?

## 11) Decisions Log

- 2026-02-24: Initial project scaffolding docs created.
- 2026-02-24: Confirmed v1 scope = two-screen mobile app (entry + monthly summary) for iOS/Android.
- 2026-02-25: Chose SQLite (`expo-sqlite`) for local persistence.
- 2026-02-25: Refactored into modular architecture (screens/domain/storage) and added summary unit tests + CI.
