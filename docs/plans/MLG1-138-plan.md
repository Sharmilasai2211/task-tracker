# Implementation Plan – MLG1-138: Configurable API base URL (remove hardcoded localhost)

JIRA: [MLG1-138](https://ksharmilasai2k.atlassian.net/browse/MLG1-138)

## Goal

Remove the hardcoded `BASE_URL = 'http://localhost:8050/api'` in the frontend and make the API base URL CONFIGURABLE via a Vite env var, while preserving the current default behavior. Update root documentation to explain how to set the var for local dev and preview/prod builds.

This plan covers only story MLG1-138 (Frontend configurable API base URL) and does not include other enhancements (CORS, error handling, new endpoints, etc.).

## Acceptance criteria coverage

1) **Base URL can be overridden by env var:**
    - Use `import.meta.env.VITE_API_BASE_URL` when non-empty.
    - All calls in `frontend/src/api.js` must build URLs using that base (e.g. `${VITE_API_BASE_URL}/tasks`).

2) **Sane default preserved:**
    - If the var is unset or empty (including whitespace): fall back to `'http://localhost:8050/api'`.

3) **Documentation updated:**
    - Root `README.md` contains a short section describing how to set `VITE_API_BASE_URL for local dev and for preview/prod build.

## Repo discovery (grounded)

- Frontend: React + Vite, API client is a small `fetch` wrapper in `frontend/src/api.js`.
- Docs: Root `README.md` currently states the frontend talks to hardcoded `http://localhost:8050/api`, and Troubleshooting instructs to edit `frontend/src/api.js` for port changes. This story will replace that with env-var guidance.

## Files/modules changed (exact)

### Frontend

- `frontend/src/api.js`
  - Change the constant base URL to be derived from `VITE_API_BASE_URL  with a default.

    Proposed logic (preserves AC2 exactly):
    ```js
    const DEFAULT_BASE_URL = 'http://localhost:8050/api'
    const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
    const BASE_URL = rawBase || DEFAULT_BASE_URL
    ```
    - The `trim()` ensures an env var of '  ' is treated as empty (meets AC2).
    - Do not auto-append `/api` – the acceptance criteria expects `VITE_API_BASE_URL` to be the base (e.g. `http://host:port/api`).
    - Keep the existing call shapes and `http://localhost:8050/api/tasks` default when var not set.
    - Leave `handleResponse` intact (not part of this story).