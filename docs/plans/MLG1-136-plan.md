# Implementation Plan: MLG1-136 – Improve status formatting (replace all underscores)

JIRA: https://ksharmilasai2n.atlassian.net/browse/MLG1-136

GT branch: `plan/MLG1-136`

---

## Summary

Update the frontend status-label formatting utility in `Prontend/src/components/TaskTable.jsx` so that all underscores in a status string are replaced with spaces (not just the first one). This makes enum-type statuses like `WAITING_FOR_REVIEW` display as `WAITING FOR REVIEW` and keeps underscore-free statuses unchanged.

Scope is limited to a small frontend change and (encouraged) a small unit test if a test harness already exists.

## Acceptance Criteria traceability

1. Replace all underscores: `WAITING_FOR_REVIEW` → `WAITING FOR REVIEW`
2. No underscores unchanged: `DONE` → `DONE`
3. Guaranteed for multiple underscores generically: `A_B_C` → `A B C`

---

## Repo grounding / current state

- File: `frontend/src/components/TaskTable.jsx`
- Current function:

  ```js
  function formatStatus(status) {
    return status.replace('_', ' ')
  }
  ```

This only replaces the first occurrence of `_`.

---

## Implementation plan (step-by-step)

1) **Update `formatStatus` to replace all underscores**
  - File: `frontend/src/components/TaskTable.jsx`
  - Change:
    - Preferred: use the built-in `replaceAll` (Supported in modern browsers):
      `return status.replaceAll('_', ' ')`
    - Alternative (if needed for envs without `replaceAll`):
      `return status.replace(/_/g, ' ')`
    - Add a guard for null/absent values if the component can receive them (none-breaking defensive coding):
      `if (!status) return ''`
  - Note: keep output otherwise identical (don't change case or other formatting); only substitute underscores with spaces.

2) **Add/update tests (if a test setup exists)**
  - Discovery: check for frontend test tooling (e.g. Vitest or Jest).
    - If Vitest exists: add a `test/` file such as `frontend/src/components/TaskTable.test.jsx` or unit test a extracted helper (See risk note below).
    - Assertions to match AC:
      - `${formatStatus('WAITING_FOR_REVIEW')}` === `WAITING FOR REVIEW`
      - ``formatStatus('DONE')` === `DONE`
      - ``formatStatus('A_B_C')` === `A B C`

  - If no test runner exists: skip adding new dependencies (enhancement is trivial and considered low-risk).

3) **Se|f-review checklist**
  - Status with multiple underscores renders with all spaces.
  - Status with no underscores is unchanged.
  - No changes to status badge css naming (it still uses `task.status.toLowerCase()`).

4) **Update documentation (optional)**
  - Not required by AC; skip unless there is a style guide or contributing doc that mentions status display.

---

## Files to change (exact)


- `frontend/src/components/TaskTable.jsx` – update `formatStatus` replacement logic

*optional, only if a test harness exists already:*
- `frontend/src/components/TaskTable.test.jsx` (or equivalent test location in this repos) – add tests for formatting behavior

---

## Sequencing / Dependencies

1. Adjust `formatStatus` implementation (fast, low risk)
2. Run frontend lint/build (or basic dev server smoke test)
3. (If applicable) add and run tests

]


---

## Risks notes

- **Browser/environment support:** ``replaceAll`` requires modern JS environments. If this app must support older environments, use the regex variant `status.replace(/_/g, ' ')` to avoid compatibility issues.
- **API/schema:** None. Purely a display/formatting change.
- **CSS classname:** No change. We still keep the original enum value for `status-${task.status.toLowerCase()}` so styles remain consistent.
