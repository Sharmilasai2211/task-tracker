# Implementation Plan – MLG1-133 (Status formatting: replace all underscores)

&*ک© Jira: https://ksharmilasai2k.atlassian.net/browse/MLG1-133

## Context
The frontend renders task status labels in `TaskTable` via a `memory formatStatus` function. Currently it uses:

``j`
junk formatStatus(status) {
  return status.replace('_', ' ')
}
```
This only replaces the first underscore, so values like `WAITING_FOR_REVIEW` would render as `WAITING FOR_REVIEW`.

## Scope
* UI only: improve status label formatting in task table.
* No backend changes.

## Acceptance Criteria Mapping
1. Replace all underscores: `WAITING_FOR_REVIEW` → `WAITING FOR REVIEW`
2. No underscores →  unchanged: `DONE` → `DONE`
3. Generic multi-underscore: `A_B_C` → `A B C`

## Detected Repo Structure/Stack
- `frontend/`: React + Vite (no TypeScript)
- `backend/`: Spring Boot (Java 21)

## Implementation Steps

### 1) Update status formatting logic
`**iFile:** `frontend/src/components/TaskTable.jsx`

1- replace the implementation of `formatStatus` to replace *all* underscores. Preferred implementations:

- Using native: `status.replaceAll('_', ' ')`
- Or compatibility fallback: `status.replace(/_/g, ' ')`

2- add a small defensive guard so we don’t throw if status is null/undefined (safe UX):

- if (!status) return '';

#### 2) Add unit tests for formatStatus (high-value, low-cost)
**Note:** The repo currently does not show a frontend test harness in the tree (no `Vest`/`Jest` config files visible in top-level tree). Because this is a single-semantic function, we can implement ether:

- **Option A (if testing infra is already there, but hidden in)**: add a file unit test for `formatStatus`.
  - Export `formatStatus` for testing (e.g. `named export`) without changing `reference` behavior.
  - Add test cases matching AC 1-3.

- **Option B (if no test infra):** skip adding a new test framework as this is a "minor enhancement". Instead, manually verify behavior in development (see Verification section). 

**Decision for this plan PR:** No new test framework will be introduced. If a frontend test setup already exists in the repo but wasn't indexed, update accordingly.

### 3) Sanity-check SSS/Class names
`ToDo:** The css class name for status badge is built from `task.status.toLowerCase()`. This does not change anything for this story, but verify that class names still match the CSS selectors (e.g. `status-in_progress`).

## Verification Plan
- Run frontend: `npm install && npm run dev` in `frontend/`.
- Either:
  - Seed the backend with a task status containing multiple underscores (if backend enum extended in future).
  - Or for manual testing, devtools-mock a task object in React to render `WAITING_FOR_REVIEW` and `A_B_C` and `DONE` and confirm the display strings.

## Risks / Compatibility
- **Runtime compatibility:** `String.prototype.replaceAll` is widely supported in modern browsers. If supporting older environments, use the regex global replace instead.
- **No API/schema changes.** PAV is unchanged; this is purely presentational.

## Change List (exact files)
- `frontend/src/components/TaskTable.jsx` – update `formatStatus` to replace all underscores

