# MLG1-15 — Frontend: Update `getTasks()` to pass paging/sort/filter query params

Jira: https://ksharmilasai2k.atlassian.net/browse/MLG1-15

## Summary
The frontend currently fetches tasks via `GET http://localhost:8050/api/tasks` with **no** query string (`frontend/src/api.js:getTasks`).

This plan updates the frontend API helper `getTasks()` to accept an **options** object and translate it into the query parameters expected by the backend API contract described in the story:

- Paging: `?page=<number>&size=<number>`
- Sorting: `?sort=<field>,<direction>` (e.g. `sort=title,asc`)
- Filtering: arbitrary supported filters (per story examples: `status`, `title`)
- Backward compatibility: no options ⇒ no query string

No backend code changes are required for this story (it is strictly the URL construction in the frontend helper).

## Repo context (grounding)
- Frontend is React + Vite using `fetch` (no axios): `frontend/package.json`.
- API helper module: `frontend/src/api.js`
  - `BASE_URL = 'http://localhost:8050/api'`
  - `getTasks()` currently: `fetch(`${BASE_URL}/tasks`).then(handleResponse)`
- App uses `getTasks()` with no args and passes tasks to `TaskTable`: `frontend/src/App.jsx`.

## Acceptance Criteria mapping
1. **Paging**: `getTasks({ page: 0, size: 10 })` ⇒ URL includes `?page=0&size=10`.
2. **Sorting**: `getTasks({ sort: { field: "title", direction: "asc" } })` ⇒ URL includes `?sort=title,asc`.
3. **Filtering**: `getTasks({ status: "DONE", title: "report" })` ⇒ URL includes `status=DONE` and `title=report`.
4. **No options**: `getTasks()` ⇒ URL remains `/tasks` (no `?`) and returns data.

## Implementation plan

### 1) Update API helper: build query string from options
**File:** `frontend/src/api.js`

**Change:**
- Update signature to `export function getTasks(options = undefined)`.
- Build the request URL using `URL` + `URLSearchParams` (or `URLSearchParams` alone) to avoid manual string concatenation and ensure proper encoding.

**Proposed behavior:**
- If `options` is `null`/`undefined`/empty object with no recognized keys ⇒ call the existing endpoint exactly: `GET ${BASE_URL}/tasks`.
- Supported keys:
  - `page` (number, including 0) ⇒ `page=<value>`
  - `size` (number) ⇒ `size=<value>`
  - `sort` (object) with:
    - `field` (string)
    - `direction` (string, expected `asc|desc`)
    - serialized as a single param: `sort=<field>,<direction>`
  - Filters: include known filter keys directly as query parameters.
    - At minimum, implement `status` and `title` to satisfy AC.
    - (Optional but safe) allow additional scalar keys beyond the reserved paging/sort keys to pass through as filters.

**Reserved keys (not treated as filters):** `page`, `size`, `sort`.

**Edge cases / encoding:**
- Do not drop `page=0` due to falsy checks; check for `!== undefined && !== null`.
- Only include filter keys when value is not `undefined`/`null` and (for strings) not empty after trim, to avoid sending `title=` accidentally.
- Ensure commas in sort param remain unescaped in the value; `URLSearchParams` will encode as needed. The server should accept `sort=title%2Casc` equivalently, but AC expects literal `sort=title,asc`. To align with AC precisely, build sort as a raw string and append via `searchParams.set('sort', `${field},${direction}`)`; most browsers will keep the comma unescaped in the URL string representation (commas are allowed). If it ends up encoded, consider using string concatenation for the final URL (see Risks section).

**Pseudo-structure:**
- `const url = new URL(`${BASE_URL}/tasks`)`
- `if (options) { ... set url.searchParams ... }`
- `const finalUrl = url.search ? url.toString() : `${BASE_URL}/tasks``
- `return fetch(finalUrl).then(handleResponse)`

### 2) Keep `App.jsx` compatible (no change required)
**File:** `frontend/src/App.jsx`

- No changes required for AC, since `getTasks()` remains callable with no args.
- Future work (out of scope) could pass UI state (page/sort/filter) once controls exist.

### 3) Add/adjust frontend unit tests (if test harness exists)
The repo currently contains backend JUnit tests but no frontend test runner configuration (no Jest/Vitest in `frontend/package.json`).

**Plan:**
- If adding tests is desired, introduce Vitest and add focused tests for URL generation. However, this story does not require new tooling.
- In lieu of automated tests, verify manually via browser devtools Network tab:
  - `getTasks()` hits `/api/tasks` with no `?`.
  - temporary call `getTasks({page:0,size:10})` hits `.../tasks?page=0&size=10`.
  - `getTasks({sort:{field:'title',direction:'asc'}})` hits `.../tasks?sort=title,asc`.
  - `getTasks({status:'DONE', title:'report'})` hits `.../tasks?status=DONE&title=report`.

(If the team standard requires automated tests, add them in a follow-up story.)

## Sequencing / dependencies
1. Modify `frontend/src/api.js` (`getTasks` signature + query building).
2. Sanity-check `frontend/src/App.jsx` compile/runtime behavior (no signature break).
3. Manual validation against running backend.

No cross-module dependency changes.

## Risks / notes
- **URL encoding of comma in `sort`:** Depending on how the URL string is produced, commas may be percent-encoded. Many servers accept encoded commas; however the AC checks the URL includes `?sort=title,asc` literally. If strict string matching is used in tests/expectations, ensure the URL string contains the comma unencoded (potentially by manual string concatenation for the `sort` piece rather than relying on `URL.toString()` normalization).
- **Backend support:** This story assumes the backend supports these query params. If it doesn’t yet, frontend will send them but results may not change. That’s acceptable per story scope, but coordinate with backend stories.
- **Breaking change avoidance:** Keep `getTasks()` default behavior unchanged when no options are passed.

## Definition of Done (verification)
- `getTasks({ page: 0, size: 10 })` requests `/api/tasks?page=0&size=10`.
- `getTasks({ sort: { field: 'title', direction: 'asc' } })` requests `/api/tasks?sort=title,asc`.
- `getTasks({ status: 'DONE', title: 'report' })` requests `/api/tasks?status=DONE&title=report`.
- `getTasks()` requests `/api/tasks` with no query string and renders tasks successfully.
