# Implementation Plan – MLG1-139

Jira: [MLG1-139](https://ksharmilasai2k.atlassian.net/browse/MLG1-139)

## 1) Summary
The UI currently formats task statuses using a helper `formatStatus()` that calls `status.replace('_', ' ')`. This only replaces the first underscore, so multi-word statuses like `WAITING_FOR_REVIEW` are displayed with leftover underscores.

We will update the formatting to replace all underscores with spaces in the status text display.

## 2) Scope (What will change)
### Frontend
- Update `formatStatus` in `frontend/src/components/TaskTable.jsx` to replace all underscores with spaces in the displayed text.

_Out of scope_ (this story):
 - Badge CSS class behavior (e.g. `status-${task.status.toLowerCase()}`)

## 3) Detailed changes
1. In `frontend/src/components/TaskTable.jsx` change:
    - `return status.replace('_', ' ')`
    to:
    - `return status.replaceAll('_', ' ')`
      (if we want broader compatibility, use `return status.replace(/_g, ' ')`)


## 4) Acceptance Criteria mapping
- AC1: `IN PROGRESS` displays when status = `IN_PROGRESS`
- AC2: `WAITING FOR REVIEW` displays when status = `WAITING_FOR_REVIEW`
- AC3: `TODO` displays when status = `TODO`


## 5) Testing / Verification plan
The repo doesn't currently have frontend unit testing setup, so we'll verify manually:
1. Start backend: `cd backend && ./mvnw spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Confirm status text displays for: `IN PROGRESS`, `TODO`, and a custom/multi-underscore status `waiting_for_review` shown as `WAITING FOR REVIEW`.

## 6) Risks
- Low risk: presentation-only change.
