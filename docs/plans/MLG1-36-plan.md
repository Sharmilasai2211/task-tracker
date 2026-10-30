# MLG1-36 — Backend: Add pageable task listing endpoint with filter & sort query params

Jira: https://ksharmilasai2k.atlassian.net/browse/MLG1-36  
Epic: https://ksharmilasai2k.atlassian.net/browse/MLG1-31

## Goal
Update `GET /api/tasks` to support **server-side pagination, filtering, and sorting**, returning a **paged response envelope**:

```json
{
  "items": [/* Task */],
  "page": 0,
  "size": 20,
  "totalItems": 123,
  "totalPages": 7
}
```

while keeping task item JSON consistent with the existing `Task` shape: `id,title,description,status`.

## Current repo reality (grounding)
Backend is Spring Boot (Java) under `backend/`.

- Controller: `backend/src/main/java/com/example/backend/controller/TaskController.java`
  - `GET /api/tasks` currently returns `List<Task>` via `taskService.getAllTasks()`.
- Service: `backend/src/main/java/com/example/backend/service/TaskService.java`
  - `getAllTasks()` delegates to `taskRepository.findAll()`.
- Repository: `backend/src/main/java/com/example/backend/repository/TaskRepository.java`
  - `extends JpaRepository<Task, Long>` only.
- Status enum: `backend/src/main/java/com/example/backend/model/TaskStatus.java` (`TODO`, `IN_PROGRESS`, `DONE`).
- Existing exception handling: `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java`
  - Handles validation (`MethodArgumentNotValidException`) and `ResourceNotFoundException`.
- Existing integration tests hit `GET /api/tasks` and assert array indexing (`$[0].title`).

## Proposed API contract
### Endpoint
`GET /api/tasks`

### Query parameters
- `page` (integer, default `0`, must be `>= 0`)
- `size` (integer, default `20`, must be `>= 1` and (optionally) `<= 100` to prevent abuse)
- `status` (enum: `TODO|IN_PROGRESS|DONE`)
- `q` (string; free-text match against **title OR description**, case-insensitive)
- `sort` (Spring style): e.g. `sort=title,asc` or `sort=title,desc`
  - If not provided: use a deterministic default, e.g. `sort=id,desc`.

### Response
- 200 with a JSON object containing: `items`, `page`, `size`, `totalItems`, `totalPages`.

### Validation errors
- Invalid `status` (e.g. `INVALID`) => 400
- Negative page => 400

> Note: Spring will naturally return 400 for invalid enum values and type conversion errors; we will ensure `page/size` constraints are enforced with explicit validation.

## Implementation plan

### 1) Add a reusable paged response DTO
**Add new file**:
- `backend/src/main/java/com/example/backend/dto/PagedResponse.java`

Proposed structure (record):
- `List<T> items`
- `int page`
- `int size`
- `long totalItems`
- `int totalPages`

This keeps controller output stable and decouples from Spring’s `Page` JSON.

### 2) Extend repository to support filtering/search + paging
**Modify**:
- `backend/src/main/java/com/example/backend/repository/TaskRepository.java`

Option A (recommended for flexibility):
- Extend `JpaSpecificationExecutor<Task>`

```java
public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {}
```

This enables composition of optional filters (`status`, `q`) while still using Spring Data paging/sorting.

> Dependency: will also require adding a small `TaskSpecifications` helper.

**Add new file**:
- `backend/src/main/java/com/example/backend/repository/TaskSpecifications.java`

Specifications:
- `hasStatus(TaskStatus status)`
- `matchesQuery(String q)` where query matches `lower(title)` OR `lower(description)` using `like`.
  - Must handle `description` being `null` (use `coalesce` or allow null-safe predicate).

### 3) Add service method for paged listing
**Modify**:
- `backend/src/main/java/com/example/backend/service/TaskService.java`

Add method:
- `Page<Task> getTasks(TaskStatus status, String q, Pageable pageable)`

Implementation:
- Build `Specification<Task>` from optional filters.
- Delegate to `taskRepository.findAll(spec, pageable)`.

Keep existing `getAllTasks()` for now (or deprecate), but controller will switch to paged method.

### 4) Update controller to accept query params and return `PagedResponse<Task>`
**Modify**:
- `backend/src/main/java/com/example/backend/controller/TaskController.java`

Change `@GetMapping` method to:
- Accept `@RequestParam(required=false) TaskStatus status`
- Accept `@RequestParam(required=false) String q`
- Accept pagination via either:
  - Explicit `@RequestParam(defaultValue="0") int page`, `@RequestParam(defaultValue="20") int size`, and `@RequestParam(defaultValue="id,desc") String sort` parsed into `PageRequest` with `Sort`, **or**
  - `Pageable pageable` + `@PageableDefault(size=20, page=0, sort="id", direction=DESC)` and rely on Spring’s `sort` parameter parsing.

Given the acceptance criteria explicitly uses `sort=title,asc`, using `Pageable` is the simplest.

Add validation:
- Annotate controller with `@Validated`.
- Validate `page` and `size`:
  - If using explicit ints: add `@Min(0)` for page, `@Min(1)` for size (and optional `@Max(100)`).
  - If using `Pageable`, use explicit params rather than `Pageable` if we need bean validation on `page` directly (Spring doesn’t automatically validate pageable fields with `@Min`).

Return:
- Convert `Page<Task>` to `PagedResponse<Task>`.

### 5) Ensure 400s are returned for invalid params
We already have `GlobalExceptionHandler` for bean validation on request bodies, but not for query param validation/conversion failures.

**Modify**:
- `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java`

Add exception handlers for:
- `org.springframework.web.method.annotation.MethodArgumentTypeMismatchException` (e.g. invalid enum `status=INVALID`)
- `org.springframework.web.bind.MissingServletRequestParameterException` (optional)
- `org.springframework.web.bind.MethodArgumentNotValidException` already exists (covers body) but query param validation is typically `ConstraintViolationException` when using `@Validated` + `@RequestParam` constraints
- `jakarta.validation.ConstraintViolationException`

All should respond with the existing `ApiError` envelope and status 400.

> Note: This story’s AC only requires 400, not specific body shape, but keeping consistent `ApiError` is preferable and aligns with existing patterns.

### 6) Update/extend tests
**Modify**:
- `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`

Update existing `createAndFetchTask()` to match new response envelope:
- After create, `GET /api/tasks` should assert `$.items[0].title` instead of `$[0].title`.

Add new integration tests per AC:
1. Pagination default
   - `GET /api/tasks` returns `page=0`, `size=20`, keys exist.
2. Pagination explicit
   - Create >10 tasks, then `GET /api/tasks?page=0&size=10` => `$.items.length() <= 10` and totals reflect created.
3. Filtering by status
   - Create tasks with `TODO` and `DONE`, request `status=DONE`, assert each returned has DONE.
4. Filtering by q
   - Create `Buy groceries`, `Write report` with description/title containing string, query `q=grocer`, assert at least one match and all matches contain substring in title/description (case-insensitive).
5. Sorting
   - Create tasks with known titles, `sort=title,asc` and check order, and `sort=title,desc`.
6. Validation
   - `GET /api/tasks?status=INVALID` => 400
   - `GET /api/tasks?page=-1` => 400

Optionally also add a small unit test for `TaskSpecifications` if desired, but integration coverage is sufficient.

### 7) Documentation (optional but helpful)
**Modify**:
- `README.md` (root)

Update API overview to reflect that `GET /api/tasks` is now paged and accepts query params; add example requests.

## Sequencing / dependencies
1. Add `PagedResponse` DTO (no dependencies).
2. Update repository to include `JpaSpecificationExecutor`.
3. Add `TaskSpecifications`.
4. Add service method using specifications.
5. Update controller to accept params and return `PagedResponse`.
6. Update exception handling for query param validation/type mismatch.
7. Update integration tests.
8. (Optional) Update README.

## Risks / notes
- **Breaking API change**: `GET /api/tasks` response changes from JSON array to JSON object (`items` + metadata). This will break the current frontend and existing tests until updated (frontend work is in later stories MLG1-38/39).
- **Validation behavior**: Spring’s default 400 for conversion errors may not match `ApiError` unless we add explicit exception handlers.
- **Search semantics**: “title or description containing query string case-insensitively” requires careful handling of null descriptions.
- **Sorting field allowlist** (optional hardening): By default Spring allows sorting on entity properties. If needed, restrict to a safe set (`id,title,status`) to avoid unexpected errors.

## Definition of done checklist (for this story)
- [ ] `GET /api/tasks` supports `page,size,status,q,sort` and returns paged envelope.
- [ ] Defaults: `page=0`, `size=20`.
- [ ] Filtering and sorting works as per AC.
- [ ] Invalid `status` and `page<0` return 400.
- [ ] Integration tests updated and new tests added for pagination/filter/sort/validation.
