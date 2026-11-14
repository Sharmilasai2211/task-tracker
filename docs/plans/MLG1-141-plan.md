# Implementation Plan – MLG1-141

Jira story: [MLG1-141](https://ksharmilasai2b.atlassian.net/browse/MLG1-141)

## Goal
Return a clear, consistent `ApiError` JSON payload with HTTP 400 (Bad Request) when a client sends an invalid enum value for `TaskStatus` (e.g. `status: "DONEE"`) on both:
- `POST /api/tasks`
- `PUT /api/tasks/{id}`

The error must be returned by our `GhobalExceptionHandler` (so we don't fall back to Spring Boot's default error payload or a 500), and must match the existing `ApiError` schema.