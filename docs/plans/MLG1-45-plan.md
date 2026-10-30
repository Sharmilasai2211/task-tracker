# MLG1-45 — Backend: Add GET `/api/tasks/{id}` endpoint

Jira: https://ksharmilasai2k.atlassian.net/browse/MLG1-45  
Epic: https://ksharmilasai2k.atlassian.net/browse/MLG1-40

## Goal
Add an endpoint to retrieve a single task by id:

- `GET /api/tasks/{id}` returns `200` and the `Task` JSON when present.
- When missing, return `404` with the existing `ApiError` payload via `GlobalExceptionHandler`.
- Add an integration test covering the happy path and not-found path.

## Repo context (verified)
Backend is Spring Boot with:
- `backend/src/main/java/com/example/backend/controller/TaskController.java` provides list/create/update/delete.
- `backend/src/main/java/com/example/backend/service/TaskService.java` handles persistence via `TaskRepository`.
- `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java` already maps `ResourceNotFoundException` → 404 `ApiError`.
- `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java` uses `MockMvc` + `@SpringBootTest` and currently tests list/create/validation/404 on update+delete.

## Implementation plan

### 1) Service: add read-by-id method
**File:** `backend/src/main/java/com/example/backend/service/TaskService.java`

Add a method:
- `public Task getTaskById(Long id)`
  - Uses `taskRepository.findById(id)`.
  - If empty, throws `new ResourceNotFoundException("Task not found with id " + id)`.

Notes:
- Keep the error message consistent with existing update/delete paths to maintain predictable 404 messaging.

### 2) Controller: expose `GET /api/tasks/{id}`
**File:** `backend/src/main/java/com/example/backend/controller/TaskController.java`

Add a handler:
- `@GetMapping("/{id}")`
- `public Task getTaskById(@PathVariable Long id)` delegates to `taskService.getTaskById(id)`.

No DTO is necessary because existing endpoints return the `Task` entity directly.

### 3) Integration tests: cover retrieve-by-id
**File:** `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`

Add/extend tests:

1. **Happy path**
   - Create task via `POST /api/tasks`.
   - Extract the created `id` from the response.
     - Preferred: use `jsonPath("$.id")` with `andReturn()` and parse, or use `ObjectMapper` to deserialize.
   - Call `GET /api/tasks/{id}`.
   - Assert:
     - `200 OK`
     - `$.id` equals created id
     - `$.title` equals submitted title
     - `$.status` equals default `TODO` (if not provided)

2. **Not found**
   - `GET /api/tasks/999999`.
   - Assert:
     - `404 Not Found`
     - Body matches `ApiError` shape used by `GlobalExceptionHandler`:
       - `$.status == 404`
       - `$.error == "Not Found"`
       - `$.message` contains `"Task not found with id"`

### 4) (Optional) Unit tests
Not required by acceptance criteria, but if desired for completeness:

**File:** `backend/src/test/java/com/example/backend/service/TaskServiceTest.java`
- Add a test to assert `getTaskById` throws `ResourceNotFoundException` when repository returns empty.

## Sequencing / dependencies
1. Implement `TaskService#getTaskById` first (controller depends on it).
2. Add controller mapping.
3. Add integration test(s) and ensure green.

## Risks / compatibility notes
- **API surface change:** Adds a new endpoint; no breaking changes expected.
- **404 behavior:** Relies on existing `GlobalExceptionHandler` mapping for `ResourceNotFoundException`. If message formatting changes later, tests that assert message substring may need updates.
- **Entity exposure:** Returning the JPA entity is consistent with existing API, but if future work introduces DTOs, this endpoint should be updated alongside other endpoints.

## Definition of done checklist
- [ ] `GET /api/tasks/{id}` exists and returns 200 + task JSON when present.
- [ ] Missing id returns `404` with `ApiError` payload.
- [ ] `TaskControllerIntegrationTest` covers create → get-by-id.
- [ ] All backend tests pass (`./mvnw test`).
