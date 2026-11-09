# Implementation Plan – MLG1-2 – Improve status formatting (replace all underscores)

&**Item:** Minor enhancement #2 from the discussion: *Improve status formatting (replace all underscores)*.

_Context_: The UI currently renders status values using `formatStatus` which calls `status.replace('_', ' ')`, so only the first underscore is replaced. Statuses like `WAITING_FOR_REVIEW` or synthetic data like `A_B_C` render incorrectly.

---
# Scope

## In scope
- Frontend only: update status label presentation in TaskTable.
- Unit/lightweight test coverage (if test infra exists).

## Out of scope
- Any backend enum/value mapping changes.