# Frugeasy — Backlog

_Status: Active_

Use priorities:
- P0 = critical
- P1 = high
- P2 = normal
- P3 = nice-to-have

Use statuses:
- TODO
- IN_PROGRESS
- BLOCKED
- DONE

---

## Queue

### P1
- [TODO] Add basic lint setup
  - Owner: agent
  - Why: maintain code consistency
  - Acceptance:
    - Lint command exists
    - CI runs lint

### P2
- [TODO] Improve UX polish for v1
  - Owner: agent
  - Why: usability
  - Acceptance:
    - Basic validation/error states
    - Currency formatting
    - Empty-state text on summary

### P3
- [TODO] Add previous/next month navigation
  - Owner: agent
  - Why: extra insight beyond current month
  - Acceptance:
    - User can view summary for other months

---

## Completed

- [DONE] 2026-02-24 — Created SPEC.md, BACKLOG.md, AGENT_LOOP.md templates
- [DONE] 2026-02-24 — Captured initial app requirements from Artem (2 screens, iOS + Android, income/expense entry + monthly summary)
- [DONE] 2026-02-25 — Scaffolded React Native Expo TypeScript app and documented local run instructions
- [DONE] 2026-02-25 — Built Screen 1: add income/expense transaction input and save flow
- [DONE] 2026-02-25 — Built Screen 2: current month summary with income/expenditure/net + transaction list
- [DONE] 2026-02-25 — Migrated local persistence to SQLite (`expo-sqlite`)
- [DONE] 2026-02-25 — Refactored app into modules (screens/domain/storage)
- [DONE] 2026-02-25 — Added unit tests for summary math
- [DONE] 2026-02-25 — Added GitHub Actions CI (typecheck + tests)

---

## Task Template

```md
- [TODO] <short title>
  - Priority: P1
  - Owner: agent
  - Why: <value>
  - Acceptance:
    - ...
    - ...
  - Notes:
    - ...
```
