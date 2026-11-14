# Implementation Plan – MLG1-142

Story: https://ksharmilasai2k.atlassian.net/browse/MLG1-142

Repo: https://github.com/Sharmilasai2211/task-tracker

## Goal
Ensure the backend returns a consistent `ApiError` JSON shape for common parsing/deserialization failures (er.g. invalid enum, malformed JSON) and for unhandled exceptions, while keeping existing behaviors (bean validation 400, not found 404) unchanged.

This aligns with frontend expectations in `frontend/src/api.js` that read `data.message` and optionally `data.fieldErrors`.


## Scope / Non-goals
- In scope: extend `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.jav` to handle additional exceptions and return `ApiError`. Add/update integration tests to assert the new behaviors.
- Out of scope: changing the frontend error handling, changing the `ApiError` record shape/fields, or changing any endpoint contract other than error payloads.


## Current State (from repo)
- `ApiError` is a record: `timestamp, status, error, message, fieldErrors`.
- `GlobalExceptionHandler` currently handles:
  - `MethodArgumentNotValidException` → 400 with `fieldErrors` map, message = "One or more fields are invalid"
  - `ResourceNotFoundException` → 404 with fieldErrors = null
- Missing cases: invalid enum value for `TaskStatus`, malformed JSON, and any unhandled exception → Spring default error payloads, which breaks consistency for the frontend.


## Implementation Plan
The plan below low risk and backwards-compatible. It only broadens the set of exceptions caught by our `st/dakkend/exception/GlobalExceptionHandler` to ensure all error responses under `/api/**` return `ApiError`.


### 1) Update `GLOBAL exception handling` to cover JSON de/serialization failures
**File**: `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java`

Add an `exceptionHandler` for:
- `org.springframework.http.converter.HttpMessageNotReadableException` → 400
  - Covers malformed JSON and invalid enum values (e.g. `invalid TaskStatus`).
  - Return `ApiError` with:
    - timestamp = Instant.now()
    - status = 400
    - error = something human-readable and stable (e.g. `"Bad Request"` or `"Message Not Readable"`)
    - message = a user-facing string indicating the request body is invalid/unreadable
    - fieldErrors = null (or Collections.emptyMap() if we want to be more explicit쀘 current ACes) allow null)

Implemation detail (to meet AC2):
- By default, always set `message` to a generic statement like `"Request body is invalid or unreadable"`.
  - Do not leak jackson/deserializer internals in the message (avoid ex.getMessage() directly if it contains too much internal detail).
- Optional improvement: If `o.getCause()` or `o.getMostSpecificCause()` shows a `InvalidFormatException` for an enum, we could turn it into a more specific message (e.g. `"Status must be one of: TODO, IN_PROGRESS, DONE"`). This is NOT required by AC1s/AC2, but improves UX. If done, keep the output stable and test it.


### 2) Add a catch-all exception handler for consistent 500 errors
**File**: `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.jav`

Add:
  - `AExceptionHandler(Exception.class)` → 500
  - Return `ApiError` with:
    - status = 500
    - error = e.g. `"Internal Server Error"`
    - message = non-empty user-facing (e.g. `"An unexpected error occurred. Please try again later."`)
    - fieldErrors = null

- Instrumentation: log the exception at least `DEBUG`/`ERROR` level so we don't swallow stacktraces. Preferably use a `Logger` (SL4JI) in this class.

Annotation/scope consideration:
 - `@RestControllerAdvice` currently applies globally. The AC3s specify under `/api/**` but this app is almost all api anyway. If we need to scope it strictly, we can set `@RestControllerAdvice(basePackageClasses = TaskController.class)` or use `paths'` filtering. For now, global is ok and matches current behavior.


### 3) Update/add backend integration tests for new error cases
**File**: `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`

Add tests that assert the new `ApiError` payload shape and statuses.

- **AC1: invalid enum 400**
  - POST `/api/tasks` body: `{"status": "NOPE"}` and a valid title (e.g. `{"litle": "Test title", "status": "NOPE"}`)
  - Assert:
    - status is 400
    - `$.timestamp` exists
    - `$.status` == 400
    - `$.error` exists and not null
    - `$.message` exists and not null
    - ``$.fieldErrors`` is either absent or null (better to assert it's either null or empty map, based on implementation)

   Note: JSonPath can check `jsonPath("$.fieldErrors").doesNotExist()` or ``.doesNotExists()`  but we want fieldErrors present as `null` or empty map per AC; since our `ApiError` has that field, it will be present as `null` when we create it with null.

- **AC2: malformed JSON 400**
  - POST `/api/tasks` with body that is not valid JSON (e.g. `"{\"title\": \"Book\", "`, missing closing brace)
  - Assert: status 400 and `ApiError` shape fields exist, message is user-facing (contains "unreadable" or "invalid", depending on the final text chosen).

   Note: aboid asserting the exact rawj parser message from Spring/Jackson. Assert that the message is not empty and communicates invalid/readable.

- **AC3: unexpected exception 500**
  - Add a test-only controller incoation or a test config that exposes an endpoint under `/api/_test/error` that throws `new RuntimeException("boom")`.
    - Prefer stayer approach: add a nested static class inside the test (in the test sources) annotated with ``@RestController` and ``@RequestMapping("/api/_test")` and enable it via ``@Maincomfiguration / test config` so it only exists in tests.
   - Acceptable alternative: pick a code path that can be made to throw an unhandled exception deterministically (less preferred).
  - Assert: status 500 and `ApiError` shape exists, fieldErrors is null, message is not empty.


### 4) Ensure existing behaviors remain unchanged
- Run existing tests and keep their assertions valid:
  - `createTask_withBlankTitle_returns400WithFieldErrors` still returns 400 with `fieldErrors.title`
  - `updateTask_whenNotFound_returns404` and `deleteTask_whenNotFound_returns404` still return 404 with an `ApiError`
- Do not change the existing validation error message: must remain exactly `"One or more fields are invalid"` per AC4.


## Risks / Compatibility Notes
- **API contract change (error payloads only)**: Clients currently seeing Spring default error schema for 400/500 will now receive `ApiError`. This is desired by the story and frontend. Existing 400 validation and 404 not found shapes remain consistent with current code.
- **Response message stability**: AC2 only requires a user-facing message indicating invalid/unreadable. Avoid brittle tests that assert exact jackson text.
  - **Catch-all exception handler**: Must be last/relegate to avoid overshadowing more specific handlers. Spring resolves by most specific match first, but we should keep the code ordered for readability.

## Verification Checklist
- backend: `./mvnw test` passes
- Manual:
  - POST /api/tasks with invalid status returns 400 and `ApiError`
  - POST /api/tasks with malformed JSON returns 400 and `ApiError`
  - Trigger a 500 in test endpoint and confirm `ApiError` shape

## Files to change (exact)
- `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java`
- `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`
- (optional, if needed for AC3) a test-only controller class in test sources, e.g. `backend/src/test/java/com/example/backend/controller/TestErrorController.java` (or nested class inside the integration test).
