# Implementation Plan – MLG1-134 Improve TaskTable status formatting

JIRA: MLG1-134 - Improve TaskTable status formatting (replace all underscores)
Link: https://ksharmilasai2k.atlassian.net/browse/MLG1-134

## Background / current behavior
- File: `frontend/src/components/TaskTable.jsx`
- Current behavior: `formatStatus` uses `status.replace('_', ' ')`, which only replaces the first underscore.
- Impact: statuses with multiple underscores (present or future enum values) render with leftover _ characters (e.g., `WAITING_FOR_REVIEW` → `WAITING FOR_REVIEW`).

## Goal
Ensure all underscores in a status are replaced with spaces when rendered in the TaskTable UI.

## Acceptance Criteria (traceability)
1. `WAITING_FOR_REVIEW` → `WAITING FOR REVIEW`
 2. `DONE` → `DONE` (unchanged)
3. `A_B_C` → `A B C`


## Proposed changes (files and exact edits)
### 1) Update status label formatting
**File: `frontend/src/components/TaskTable.jsx`**

- Modify `formatStatus` to replace all underscores,
  - Preferred (Vite modern browsers): `return status.replaceAll('_', ' ')`;
  - Alternate (if needing max compat): `return status.replace(/_/g, ' ')`;.
- (Optional) add a null/falsy input guard for defensiveness: `if (!status) return ''`;

### 2) (Optional, but recommended) add a minimal unit test
Depending on repo setup, add a small test to lock in behavior. This reduces regression risk since the change is a small frontend rendering detail.

- Search for existing test infrastructure (e.g. Vitest/Jest + React Testing Library) and conventions.
if tests are present:
  - Add a test for `formatStatus` or render a TaskTable row and assert the text content for `WAITING_FOR_REVIEW`, `DONE`, `A_B_C`.
if no test infra present:
  - Skip adding new test harness (out-of-scope for a minor enhancement).


## Sequence / dependencies
1. Confirm current TaskTable usage and that status is a string enum value (e.g. `E__E` form).
2. Implement the one-line change in `formatStatus`.
3. (If applicable) update/add tests.
4. Run frontend lint/build/tests (whatever exists in `frontend/package.json`).


## Risks / compatibility notes
- Low risk: pure presentational change with no API/schema impact.
- Compatibility: `String.prototype.replaceAll` is supported in modern browsers typically targeted by Vite/React. If older browser support is needed, use regex replace.