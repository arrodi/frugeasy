# Frugeasy — Agent Execution Loop

This file defines how the assistant continuously contributes code to this repo.

## Mode

Current default: **Manual trigger** (Artem asks, agent executes).

Optional upgrade: scheduled cron execution.

## One Run = One Small Increment

For each run, the agent should:

1. Read `SPEC.md` and `BACKLOG.md`
2. Pick the highest-priority unblocked task
3. Clarify only if requirements are ambiguous
4. Create/update branch for the task
5. Implement minimally viable change
6. Run local checks (lint/test/typecheck if present)
7. Commit with clear message
8. Open/update PR or report diff (depending on policy)
9. Update `BACKLOG.md` status and notes

## Commit Style

Use conventional-ish messages:
- `feat: ...`
- `fix: ...`
- `chore: ...`
- `docs: ...`
- `test: ...`

## Safety Rules

Never do without explicit approval:
- destructive DB migrations
- removing major features
- force-push to shared branches
- exposing secrets or credentials

## Reporting Format

At the end of each run, report:
- Task completed
- Files changed
- Checks run + result
- Next suggested task

## Future: Scheduled Automation (optional)

If Artem enables cron, each scheduled run should follow the same loop and use PR-based delivery by default.

Suggested schedule examples:
- Every 2 hours on weekdays
- Daily at 09:00 UTC

## Notes

- Keep changes small and reversible.
- Prefer momentum over perfect architecture in early stages.
- If blocked, write a clear blocker note in `BACKLOG.md`.
