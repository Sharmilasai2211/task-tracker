# Implementation Plan – MLG1-138: Configurable API base URL (remove hardcoded localhost)

JIRA: [MLG1-138](https://ksharmilasai2k.atlassian.net/browse/MLG1-138)

## Goal

Remove the hardcoded `BASE_URL = 'http://localhost:8050/api'` in the frontend and make the API base URL configurable via a Vite env var, while preserving the current default behavior. Update root documentation to explain how to set the var for local dev and preview/prod builds.

This plan covers only story **MLG1-138** (Frontend configurable API base URL) and does not include other enhancements (CORS, error handling, backend ENDPOINTs, etc.).

## Acceptance criteria coverage

1) **(Base URL can be overridden by env var)**

- Read ``(import.meta.env.VITE_API_BASE_URL ?? '') .trim()``. 
- When the variable is non-empty, use it as the base for all API calls in `frontend/src/api.js` (eg. `${VITE_API_BASE_URL}/tasks`).

  Note: by making it env-driven, previews/deployments or development on non-default ports do not require code edits.

2) **(Sane default preserved)**

- If ``VITE_API_BASE_URL ``is not set or is an empty string (including whitespace-only values), fall back to ``http://localhost:8050/api``.

3) **(Documentation updated))*

- Update root `README.md` to include a short section on setting `VITE_API_BASE_URL ` for local dev and for prod/preview builds.
- Include explicit examples (e.g. `.env`, command line or CI invocation) and reinforce that the default remains `http://localhost:8050/api`.

## Repo discovery (grounded)

- Frontend: React + Vite, API client is a small `fetch` wrapper in `frontend/src/api.js`.
- Docs: Root `README.md` currently states the frontend talks to hardcoded `http://localhost:8050/api`, and Troubleshooting instructs editing `frontend/src/api.js` for port changes. This story replaces that with env-var guidance.

## Files/modules to change (exact)

### Frontend

- `frontend/src/api.js`
  - Replace the hardcoded base URL constant with an env-derived value that falls back to the current default.
  - Proposed logic:
    ```js
    const DEFAULT_BASE_URL = 'http://localhost:8050/api';
    const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
    const BASE_URL = rawBase || DEFAULT_BASE_URL;
    ```
  - AC2#2 requires that whitespace-only values behave as empty → the `.trim()` enforces that.
  - AC2#1 expects the app to construct urls like `${VITE_API_BASE_URL}/tasks`; therefore, do not auto-append `/api` or any other path. This also makes the config explicit: the var should include `/api` if that's the backend prefix.
  - **Trailing slash behavior*+*: To avoid double slashes if someon sets `http://host:8050/api/`, normalize the base by removing a single trailing slash before appending path segments. (Suggested implementation: if `base.endsWith('/')` then `base = base.slice(0, -1)`.)
  - Ensure all existing API calls still target `"${BASE_URL}/tasks"` to meet AC1

### Documentation (exact edits to implement)

Add the following section to root `README.md` (location can be near frontend setup or config steps):

```md
## Frontend → Backend API base URL

The frontend talks to the backend using a base URL configured via a Vite env variable:


- `VITE_API_BASE_URL` (example: `http://localhost:8050/api`)

If `VITE_API_BASE_URL`  is not set (or is empty/whitespace), the app defaults to:

- `http://localhost:8050/api`

Note: The value should include `/api` (since the backend routes are under `/api/...`).

**.env example (frontend/.env)**

```bash
VITE_API_BASE_URL=http://localhost:8050/api
```

**Command line (dev)**

```bash
VITE_API_BASE_URL=http://localhost:8050/api npm run dev
```

**Production/preview build**

```bash
VITE_API_BASE_URL=https://api.example.com/api npm run build
```
```
