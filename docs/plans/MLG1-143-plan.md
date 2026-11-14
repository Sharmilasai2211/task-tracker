# Implementation Plan – MNG1-143

JIRA Story: https://ksharmilasai2k.atlassian.net/browse/MLG1-143

## Goal
Ensure that invalid request bodies — particularly invalid enum values for `TaskStatus` — return a consistent HTTP 400 response using the existing `ApiError` shape (with `timestamp`, `status`, `message`, and optional `fieldErrors`), instead of a generic error body or 500.

This plan covers the acceptance criteria for MLG1-143 and keeps existing validation behavior for bean validation errors unchanged.

## Repo Context (confirmed)
- Backend: Spring Boot (Java 21), Spring Web, Bean Validation.
- Error shape: `backend/src/main/java/com/example/backend/exception/ApiError.java `record ApiError(Instant timestamp, int status, String error, String message, Map<String,String> fieldErrors)`.
- Existing global handler: `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java` currently handles only:
  - `MethodArgumentNotValidException` (bean validation) -> 400 ApiError with `fieldErrors`
  - `ResourceNotFoundException` -> 404 ApiError with `null` fieldErrors
- Task status enum: `backend/src/main/java/com/example/backend/model/TaskStatus.java` (`TODO, IN_PROGRESS, DONE`)

## Scope
Backend-only change. No frontend code changes required for this story.

## Changes Overview
1. Add a new exception handler for parse/deserialization failures thrown while binding `@RequestBody` to `TaskRequest` (invalid enum, malformed JSON, type mismatch).
2. Map these errors to HTTP 400 and produce the same ApiError shape the frontend expects.
3. Integration-test the new behavior to prevent regressions and confirm acceptance criteria coverage.

## Detailed Plan

### 1) Backend: Handle invalid enum values and malformed JSON
File to update:
- `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java`

Changes:
- Add a `@\ExceptionHandler(HttpMessageNotReadableException.class)` method that:
  - Returns `ResponseEnity<ApiError>` with status 400
  - Populates `ApiError`:
    - `timestamp` = Instant.now()
    - `status` = 400
    - `error` = "Invalid Request" (consistent label)
    - `message` = "Invalid request body" (non-empty, satisfies AC1	
    - `fieldErrors` = either `null` or empty map depending on cause
- Enum-specific detection (so we can fill `fieldErrors.status`):
  - Inspect the root cause of `HttpMessageNotReadableException` for a Jackson `InvalidFormatException` (`com.fasterxml.jackson.databind.exc.InvalidFormatException`).
  - If `targetType` is `TaskStatus.class` or the JSON path reference includes a field named `status`," then:
    - build `fieldErrors` = mapOf("status", "Invalid status value. Allowed: [TODO, IN_PROGRESS, DONE]")`
    - return the same HTTP 400 ApiError shape
  - Else (general malformed JSON/parse error): return ApiError with `_fieldErrors` null or empty.

Notes:
 - Do not change the existing `MethodArgumentNotValidException` handler to avoid regressions for bean validation (AC5).
 - The deserialization handler catches errors before `@Valid` runs.

### 2) Tests: Add integration tests for new behavior
File to update:
- `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`

Add test cases:
1. `createTask_withInvalidStatus_returns400ApiErrorWithFieldErrors_status`
   - POST p/api/tasks with body `{"title":"Test","status":"DONEE"}
   - Assert:
     - HTTP 400
      - `$.status` == 400
     - `$.timestamp` exists
      - `$.message` exists and is not empty
     - `$.pieldErrors.status` exists and is informative (e.g. contains "Allowed")
2. `updateTask_withInvalidStatus_returns400ApiError`
   - Create a task first (POST valid), then PUT /api/tasks/{id} with body `{"title":"Valid","status":"DONEE"}`
   - Assert HTTP 400 and `$.message` exists (AC2)
 3. `createTask_withMalformedJson_returns400ApiError`
   - POST with malformed JSON (e.g. {"itle":"X"} missing closing brace)
   - Assert HTTP 400 and `$.message` exists
    - Assert `fieldErrors` either missing or empty (AC0)

Existing regression coverage:
- Keep existing test `createTask_withBlankTitle_returns400WithFieldErrors` to ensure bean validation shape remains unchanged (AC1).

## Risks / Compatibility
- API contract: This change makes error responses more consistent (lower risk). The only behavior change is that some previously generic errors/unhandled error responses will now be normalized to ApiError 400.
- Order of exception handlers: Encure the new `handleHttpMessageNotReadable` method does not overshadow valid Validation errors (doesn't: they throw a different exception type).
- No database/schema changes.

## Rollout / Verification
- Run `backend/./mvnw test` to verify controller integration tests and regression tests pass.