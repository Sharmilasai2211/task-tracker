# MLG1-22 — Pagination/Sorting/Filtering for task listing (`/api/tasks`) — Implementation Plan

Jira Epic: **MLG1-22** (label: `ai-sdlc-pipeline`)

Child stories in scope:
- **MLG1-27** — Backend: paginated/sortable/filterable `GET /api/tasks`
- **MLG1-28** — Backend: repository/service support for `status` + `q` filters
- **MLG1-29** — Backend: controller integration tests updated for paginated response
- **MLG1-30** — Frontend: list controls (search/status) and consume paginated tasks API

## 1) Repo reality check (detected)

- Backend: Spring Boot (Java 21) under `backend/`.
  - Controller: `backend/src/main/java/com/example/backend/controller/TaskController.java`
  - Service: `backend/src/main/java/com/example/backend/service/TaskService.java`
  - Repository: `backend/src/main/java/com/example/backend/repository/TaskRepository.java`
  - Entity/enum: `backend/src/main/java/com/example/backend/model/Task.java`, `TaskStatus.java`
  - Error shape: `backend/src/main/java/com/example/backend/exception/ApiError.java`
  - Global exception handling: `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java` (currently handles validation + not found only)
  - Integration tests: `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`
  - Unit tests: `backend/src/test/java/com/example/backend/service/TaskServiceTest.java`

- Frontend: React + Vite under `frontend/`.
  - API client: `frontend/src/api.js` (`getTasks()` currently returns an **array**)
  - UI: `frontend/src/App.jsx` loads all tasks and passes to `frontend/src/components/TaskTable.jsx`

## 2) Target API contract (new)

### Endpoint
`GET /api/tasks`

### Query params
- `page` (int, default `0`)
- `size` (int, default `20`)
- `sort` (Spring format, e.g. `title,asc`)
- `status` (enum `TaskStatus`, optional)
- `q` (string, optional; case-insensitive substring match on title)

### Response (JSON object, not array)
Use Spring Data `Page<Task>` serialization (or an explicit DTO wrapper if needed), containing at least:
- `content` (array of tasks)
- `page` (current page index)
- `size` (page size)
- `totalElements`
- `totalPages`

> Note: Spring’s default `Page` JSON may not include `page` and `size` as top-level fields (often nested under `pageable`), depending on configuration.
> To satisfy the acceptance criteria precisely, we will likely introduce an explicit response DTO to guarantee fields: `content,page,size,totalElements,totalPages`.

### Error for unknown `status`
- `400 Bad Request`
- Body: `ApiError` JSON containing fields `status`, `error`, `message` (timestamp/fieldErrors can remain but are not required by AC)

This will require additional exception handling beyond what currently exists (see risks/notes).

## 3) Implementation approach (backend)

### 3.1 Data access: filtering + pagination/sort support (MLG1-28)

**Goal:** Implement a single repository method that can combine optional filters and accept `Pageable` (pagination + sorting).

Preferred approach in this repo:
- Extend `TaskRepository` to also implement `JpaSpecificationExecutor<Task>`.
- Use Specifications to conditionally add predicates for:
  - `status` equality
  - `title` contains (case-insensitive) for `q`

This avoids needing multiple derived query methods and supports combinations cleanly.

**Files to change**
- `backend/src/main/java/com/example/backend/repository/TaskRepository.java`
  - Change signature to:
    - `public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {}`
- `backend/src/main/java/com/example/backend/service/TaskService.java`
  - Add a new list method such as:
    - `public Page<Task> listTasks(TaskStatus status, String q, Pageable pageable)`
  - Keep existing `getAllTasks()` temporarily for backwards compatibility (see sequencing), but it will become unused after controller change.
- Add new specification helper:
  - `backend/src/main/java/com/example/backend/repository/TaskSpecifications.java` (new)
    - `Specification<Task> hasStatus(TaskStatus status)`
    - `Specification<Task> titleContainsIgnoreCase(String q)`

**Unit tests**
- Update/add tests in `backend/src/test/java/com/example/backend/service/TaskServiceTest.java`.
  - Since current service tests use Mockito and the repository is mocked, tests will validate that:
    - For `status` only: service calls `taskRepository.findAll(spec, pageable)` with a spec that includes status.
    - For `q` only: spec includes title predicate.
    - For combined: spec includes both.

Because validating the internal composition of a `Specification` is awkward with pure mocks, prefer one of:
1) **Switch `TaskServiceTest` to a slice/integration test** using H2 and real repository (recommended for correctness), OR
2) Keep Mockito but assert *behavioral outcomes* by capturing the `Specification` and running it against a CriteriaBuilder is non-trivial.

**Plan choice:** Convert/extend with a lightweight `@DataJpaTest` (or `@SpringBootTest`) focused on repository/service filtering behavior.
- Option A: Add new test class `backend/src/test/java/com/example/backend/service/TaskServiceFilteringTest.java` using Spring context + H2.
- Keep existing Mockito tests for create/update/delete behaviors.

### 3.2 Controller: new GET `/api/tasks` signature + response DTO (MLG1-27)

**Goal:** Implement pagination defaults, sorting passthrough, and filters.

**Files to change**
- `backend/src/main/java/com/example/backend/controller/TaskController.java`
  - Replace current `getAllTasks(): List<Task>` with a paginated method.
  - Accept query params:
    - `@RequestParam(defaultValue = "0") int page`
    - `@RequestParam(defaultValue = "20") int size`
    - `@RequestParam(required = false) TaskStatus status`
    - `@RequestParam(required = false, name = "q") String q`
    - `@RequestParam(required = false) String[] sort` OR rely on Spring `Pageable` binding.

**Pagination + sorting binding**
- Use `PageRequest.of(page, size, Sort.by(...))`.
- Prefer letting Spring bind `sort` parameters via `Pageable` only if we can also guarantee the response shape fields required by AC.

**Response DTO to guarantee shape**
- Add new DTO:
  - `backend/src/main/java/com/example/backend/dto/PagedResponse.java` (new) or `TaskPageResponse` (new).
  - Fields: `List<T> content`, `int page`, `int size`, `long totalElements`, `int totalPages`.
  - Controller returns `PagedResponse<Task>` built from returned `Page<Task>`.

### 3.3 Error handling for invalid `status` query param (part of MLG1-27 AC)

Currently `GlobalExceptionHandler` does not handle:
- `MethodArgumentTypeMismatchException` (e.g., invalid enum in query param)
- Potentially `HttpMessageNotReadableException` (invalid JSON)

To satisfy AC #6 for `status=NOT_A_STATUS`:
- Update `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java`
  - Add `@ExceptionHandler(MethodArgumentTypeMismatchException.class)`
  - Return `ApiError` with:
    - `status=400`
    - `error="Bad Request"` (or similar)
    - `message` describing invalid value for `status`.

> Note: This overlaps with Epic **MLG1-25** (error handling improvements). For this plan we only add what is required to satisfy MLG1-22 acceptance criteria (unknown status).

## 4) Backend integration tests updates (MLG1-29)

**Goal:** Update test expectations for new response shape and add coverage for pagination/sorting/filtering.

**Files to change**
- `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`

**Test changes**
1) Update `createAndFetchTask`:
   - After `GET /api/tasks`, assert:
     - `$.content[0].title == "Buy groceries"`
2) Add pagination test:
   - Create 3 tasks.
   - `GET /api/tasks?page=0&size=2` assert:
     - `$.content.length() == 2`
     - `$.page == 0`, `$.size == 2`
     - `$.totalElements >= 3`
3) Add status filtering test:
   - Create TODO and DONE.
   - `GET /api/tasks?status=DONE` assert all content statuses DONE.
4) Add q filtering test:
   - Create titles "Buy groceries" and "Write report".
   - `GET /api/tasks?q=gro` assert all titles contain gro (case-insensitive). (In JSONPath, use regex or lowercase compare; simplest: just assert the non-matching title is absent and at least one match exists.)
5) Add sorting test:
   - Create "B task" and "A task".
   - `GET /api/tasks?sort=title,asc` assert first item is "A task".

## 5) Frontend updates (MLG1-30)

### 5.1 API client: query params + paginated response

**Files to change**
- `frontend/src/api.js`
  - Update `getTasks` signature to accept an object:
    - `getTasks({ page, size, sort, status, q } = {})`
  - Build URLSearchParams adding only defined params.
  - Parse and return the JSON object (`{content,page,size,totalElements,totalPages}`)

### 5.2 App state: consume `content` and add controls

**Files to change**
- `frontend/src/App.jsx`
  - Maintain list UI state:
    - `page` (default 0)
    - `size` (optional constant, e.g. 10/20)
    - `q` string
    - `status` string
    - `sort` (optional; can default to `title,asc` or leave unset)
    - `pageInfo` (totalPages/totalElements)
  - Update `loadTasks()` to call `getTasks({ page, size, q, status, sort })` and set:
    - `setTasks(data.content)`
    - `setTotalPages(data.totalPages)` etc.
  - Add search input and status select above table.
  - Implement debounce for search (optional) or reload on submit.
  - Implement Next/Prev buttons using `totalPages`.
  - Reset `page` to `0` whenever `q` or `status` changes.

**Files to change (styling)**
- `frontend/src/App.css`
  - Add basic layout styles for new controls and pagination buttons.

> `frontend/src/components/TaskTable.jsx` can remain unchanged as it still receives an array of tasks.

## 6) Sequencing / dependency order

1) **Backend repository/service foundation (MLG1-28)**
   - Add `JpaSpecificationExecutor` + `TaskSpecifications`.
   - Add service method `listTasks(status,q,pageable)`.
   - Add/adjust service/repository tests.

2) **Backend controller change + response DTO + error handling (MLG1-27)**
   - Introduce `PagedResponse<T>` DTO.
   - Update `TaskController.getAllTasks()` to return paged response.
   - Add exception handler for invalid `status` query param.

3) **Backend integration tests (MLG1-29)**
   - Update existing test and add new integration tests.

4) **Frontend API client + UI controls (MLG1-30)**
   - Update `getTasks` to accept query params and return paginated object.
   - Update `App.jsx` to consume paginated response and add controls.

## 7) Risks / breaking changes / compatibility notes

- **Breaking API change:** `GET /api/tasks` response changes from `[]` array to an object with `content` etc.
  - This will break any existing consumers (including the current frontend) until updated.
  - Mitigation: land backend + frontend changes together, or temporarily add a compatibility endpoint (not planned).

- **Page JSON shape risk:** Relying on Spring’s default `Page` JSON may not match acceptance criteria field names.
  - Mitigation: use explicit response DTO (`PagedResponse`).

- **Error handling ownership overlap:** AC requires 400 + `ApiError` for unknown enum.
  - Implement minimal `MethodArgumentTypeMismatchException` handling now; broader error improvements remain for **MLG1-25**.

- **Sorting correctness:** If multiple tasks have equal titles, ordering may be unstable.
  - Mitigation: in tests, use distinct titles and/or add secondary sort by `id` if necessary.

- **Test isolation:** Integration tests create tasks; H2 is in-memory per test context but can leak between tests if context reused.
  - Mitigation: reset DB between tests (e.g., `@DirtiesContext` or delete all via repository). Decide based on existing conventions (none currently).

## 8) Definition of done checklist (per story)

- MLG1-27
  - `GET /api/tasks` supports `page,size,sort,status,q`.
  - Defaults: page=0 size=20.
  - Returns object with required fields.
  - Unknown `status` returns 400 with `ApiError`.

- MLG1-28
  - Repository/service support status/q/combined filtering.
  - Unit/integration tests cover filters.

- MLG1-29
  - Integration tests updated and new ones added for pagination/sorting/filtering.

- MLG1-30
  - `getTasks` supports params.
  - UI has search + status filter + pagination controls.
  - Changing filters resets to page 0.
