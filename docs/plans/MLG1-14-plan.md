# MLG1-14 — Plan: Add filtering to `GET /api/tasks` (status, title contains)

## Story summary
Add optional query parameters to `GET /api/tasks` to filter tasks by:
- `status` (exact `TaskStatus` match)
- `title` (case-insensitive substring match)

Must support each filter individually and combined. Invalid `status` must return `400` with a helpful error message.

## Repo grounding (what exists today)
Backend is a Spring Boot (Java 21) app under `backend/`.

Current endpoint:
- `backend/src/main/java/com/example/backend/controller/TaskController.java`
  - `@GetMapping public List<Task> getAllTasks()` delegates to `TaskService.getAllTasks()`.

Current service:
- `backend/src/main/java/com/example/backend/service/TaskService.java`
  - `getAllTasks()` calls `taskRepository.findAll()`.

Current repository:
- `backend/src/main/java/com/example/backend/repository/TaskRepository.java`
  - Extends `JpaRepository<Task, Long>` with no custom queries.

Current error handling:
- `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java`
  - Handles `MethodArgumentNotValidException` (400) and `ResourceNotFoundException` (404).
  - No handler for query parameter type mismatches (e.g., invalid enum).

Existing tests:
- `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`
  - Covers create/list, validation errors, not-found for update/delete.

## API contract changes
`GET /api/tasks` will accept optional query params:
- `status`: string, must be one of `TODO|IN_PROGRESS|DONE`
- `title`: string, matches tasks whose `title` contains provided text (case-insensitive)

Response remains `200` with JSON array of `Task`.

Invalid `status` returns `400` with a JSON error body (same `ApiError` shape), and `message` indicating the `status` parameter is invalid.

## Implementation approach
### Key design choices
1. **Controller accepts optional query params** via `@RequestParam(required=false)`.
2. **Service performs filtering query selection** based on which params are present.
3. **Repository adds derived query methods** to support:
   - status-only
   - title-only (case-insensitive contains)
   - status + title combined
4. **Global exception handler returns 400 for invalid enum query param** by handling Spring’s argument conversion/type mismatch exception.

This keeps logic simple, avoids adding Specifications/Criteria APIs unless needed.

## Files to change (exact)
### 1) `backend/src/main/java/com/example/backend/controller/TaskController.java`
- Update `getAllTasks()` signature to accept query params:
  - `@RequestParam(required = false) TaskStatus status`
  - `@RequestParam(required = false) String title`
- Delegate to a new/updated service method, e.g. `taskService.getTasks(status, title)`.

Notes:
- Spring will attempt to convert `status` to `TaskStatus`. Invalid values will throw a conversion/type mismatch exception which we will map to 400.
- Trim/normalize `title` in controller or service (treat blank string as “not provided”).

### 2) `backend/src/main/java/com/example/backend/service/TaskService.java`
- Add a new method:
  - `public List<Task> getTasks(TaskStatus status, String title)`
- Implement branching:
  - If `status != null` and `title` is non-blank → repository combined query
  - Else if `status != null` → status query
  - Else if `title` is non-blank → title query
  - Else → `findAll()`

### 3) `backend/src/main/java/com/example/backend/repository/TaskRepository.java`
Add derived query methods:
- `List<Task> findByStatus(TaskStatus status)`
- `List<Task> findByTitleContainingIgnoreCase(String title)`
- `List<Task> findByStatusAndTitleContainingIgnoreCase(TaskStatus status, String title)`

These align with the acceptance criteria (case-insensitive contains).

### 4) `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java`
Add a new handler for invalid request params:
- Handle `org.springframework.web.method.annotation.MethodArgumentTypeMismatchException` (commonly thrown for invalid enum in `@RequestParam`).
  - When `ex.getName().equals("status")` (or when `ex.getRequiredType() == TaskStatus.class`) return:
    - HTTP 400
    - `ApiError` with:
      - `error`: something like `"Bad Request"` or `"Validation Failed"` (choose consistent naming)
      - `message`: e.g. `"Invalid status parameter. Allowed values: TODO, IN_PROGRESS, DONE"`
      - `fieldErrors`: `null`

This satisfies the AC requiring an error message indicating the status parameter is invalid.

### 5) `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`
Add integration tests to cover all acceptance criteria:
1. **Filter by status**
   - Create at least 2 tasks with different statuses (use POST; status provided on one).
   - `GET /api/tasks?status=TODO` → 200 and all returned have `status == "TODO"`.
2. **Filter by title contains (case-insensitive)**
   - Create tasks with titles like `"Buy Groceries"` and `"Write report"`.
   - `GET /api/tasks?title=grocer` → 200 and all returned titles contain `grocer` ignoring case.
3. **Filter by both**
   - Create tasks such that only one matches BOTH (e.g., DONE + "Report").
   - `GET /api/tasks?status=DONE&title=report` → 200 and every result matches both.
4. **Invalid status**
   - `GET /api/tasks?status=INVALID` → 400 and response JSON contains `message` with `"Invalid"` and mentions `status` (assert on a stable substring).

Test hygiene:
- Because tests run against an in-memory DB that may persist across test methods within the same context, ensure each test is self-contained.
- Prefer asserting “every item matches filter” rather than relying on exact array size/order.

Optionally (if flakiness arises due to shared DB state):
- Add `@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)` to the integration test class.

## Sequencing / dependencies
1. Add repository query methods (`TaskRepository`).
2. Add service method that selects the appropriate repository call (`TaskService`).
3. Update controller to accept params and call new service method (`TaskController`).
4. Add exception handler for invalid enum query param (`GlobalExceptionHandler`).
5. Add/extend integration tests (`TaskControllerIntegrationTest`).

## Risks / considerations
- **Breaking change risk**: Low. `GET /api/tasks` remains unchanged when no params are provided.
- **API error contract**: Adding a new 400 error shape for invalid query params should still match existing `ApiError` record.
- **Spring conversion exception type**: In Spring WebMVC, invalid enum `@RequestParam` typically throws `MethodArgumentTypeMismatchException`. If it differs in this Spring Boot version, adjust handler accordingly (e.g., handle `ConversionFailedException`).
- **Title filtering behavior**: Decide treatment of blank `title` (recommended: trim and treat blank as absent) to avoid surprising “contains empty string” behavior.

## Definition of done checklist
- [ ] `GET /api/tasks?status=TODO` filters correctly.
- [ ] `GET /api/tasks?title=grocer` uses case-insensitive contains.
- [ ] Combined filters apply AND logic.
- [ ] `GET /api/tasks?status=INVALID` returns 400 with a clear message.
- [ ] All backend tests pass: `cd backend && ./mvnw test`.
