# Implementation Plan – MLG1-135

// Story: Improve status label formatting in TaskTable (replace all underscores)

- Jira: MLG1-135
- Scope: Frontend only
- Target file: `frontend/src/components/TaskTable.jsx`

## Context

Code currently formats statuses with:

```js
function formatStatus(status) {
  return status.replace('_', ' ')
}
```

This only replaces the first underscore, so statuses with multiple underscores render incorrectly (e.g., `WAITING_FOR_REVIEW` displays as `WAITING FOR_REVIEW`).

## Acceptance Criteria coverage
1) Waiting_For_Review –> WAITING FOR REVIEW
2) DONE –> DONE (unchanged)
3) A_B_C –> A B C (generic multi-underscore case)

## Changes to make (files / modules)
### 1) Update status formatting helper
**File:** `frontend/src/components/TaskTable.jsx`

- Update `formatStatus` to replace *all* underscores:
  - Prefer regex for broad compatibility: `return status.replace(/_/g, ' ')`
  - Alternative (also fine in modern browsers): `return status.replaceAll('_', ' ')`
- (Optional) Add a null/falsy guard if status can be missing:
  `return (status ? status.replace(/_/g, ' ') : '')`. (Confirm data shape; current code assumes always present.)

## Sequencing / Dependencies
1) Make the one-line change to `formatStatus` in `TaskTable.jsx`.
2) Run the frontend and verify in the table that:
  - `WAITING_FOR_REVIEW` renders as `WAITING FOR REVIEW`
  - `DONE` renders as `DONE`
  - `A_B_C` renders as `A B C`
3) (If tests are present in repo) add a component-level or unit test for the helper. (No test setup is assumed; if there's no test framework, skip.)

## Risks / Compatibility notes
- Low risk. Frontend-only string formatting change.
- If using `replaceAll`, verify browser support. To avoid any polyfill concerns, prefer `/_/g` regex.
- No API contract changes. No database/schema impact.

## Definition of Done
- All UI status labels display with spaces in place of underscores for any number of segments. No regression for statuses without underscores.

## Links
- Jira: https://ksharmilasai2k.atlassian.net/browse/MLG1-135
