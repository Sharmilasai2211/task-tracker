# Implementation Plan — MLG1-72 (Task listing: search/filter/sort + pagination)

Jira Epic: https://ksharmilasai2k.atlassian.net/browse/MLG1-72
Child stories:
 - MLG1-78 — Backend: Support paginated task listing with sort parameters
  - MLG1-79 – Backend: Add task list search and status filter query parameters
  - MLG1-80 – Frontend: Add search, status filter, sort controls for task list
  - MLG1-81 – Frontend: Add pagination UI for task list
  - MLG1-82 — Tests: Update backend integration tests for paged/filterable task listing (related frontend story: https://ksharmilasai2k.atlassian.net/browse/MLG1-81)

## 1) Scope overview

Current state (evidenced in repo):
 - Backend: `GET /api/tasks` returns `List<Task>` from `TaskRepository.findAll()`; no query params, array only response.
  - Frontend: `getTasks()` always fetches all tasks; `TaskTable` just renders an array.

Target state:
  - `GET /api/tasks` supports query params: `query`, `status`, `page`, `size`, `sort`, and returns a paged response with metadata.
  - UI provides search + filter + sort controls and pagination controls, and does not load everything at once.

## 2) API contract

Define one consistent response shape for task listing:

```json
{
  "content": [ { "id": 1, "title": "...", "description": "...", "status": "TODO" } ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3,
  "sort": ["title,asc"]
}
```

Parameters:
  - `query`: optional, case-insensitive search across `title` and `description`.
  - `status`: optional, enum (TODO, IN_PROGRESS, DONE).
  - `page`: default `0`, `<`0
  - `size`: default `20`, 1..100 (enforced)
  - `sort`: optional, Spring Data format `column,dir`, e.g. `title,asc`.
    - Allowlist columns: `id`, `title`, `status` (extend later)

 *Note: This changes a public contract for `GET /api/tasks`. The frontend must be updated in the same release.*

## 3) Backend implementation plan (MLG1-78, MLG1-79)

### Files to change
- `backend/src/main/java/com/example/backend/controller/TaskController.java`
  - Change signature to accept `Pageable` + optional `query`, `status`.
  - Return a new DTO envelope (e.g. `TaskPageResponse`) rather than `List<Task>`.
  - Validate `page`/`size` and return 400 with `ApiError` for invalid values (MLG1-78 AC).

- `backend/src/main/java/com/example/backend/service/TaskService.java
  - Replace `getAllTasks()` with a new method that accepts filters plus `Pageable` and returns `Page<Task>`.

- `backend/src/main/java/com/example/backend/repository/TaskRepository.java
  - Extend with `JpaSpecificationExecutor<Task>` and use Specifications to support optional `status` and `text query`.

m new: `backend/src/main/java/com/example/backend/repository/TaskSpecifications.java`
  - Build `Specification<Task>` for:
    - `status = :status` (optional)
    - `(lower(title) like %query%` or `lower(description) like %query%` (optional)
  - Keep null-safe composition (return `conjunction()` when no filters).

- new: `backend/src/main/java/com/example/backend/dto/TaskPageResponse.java`
  - Record: content, page, size, totalElements, totalPages, sort. 
  - Static factory `mapPage(Page<Task>)`.

- `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java` (if necessary)
  - Add 400 handler for enum parse mismatch (e.g. invalid status param) to return `ApiError` message (matches MLG1-79 AC).

### Sequencing
1) Data access: repository + specs
2) Service: new list method
3) Controller: param mapping, validation, DFT response shape
4) Error handling for param invalid

## 4) Frontend implementation plan (MLG1-80, MLG1-81)

### Files to change
- `frontend/src/api.js`
  - Update `getTasks` to accept `{ page, size, query, status, sort }`, serialize query params, parse the new page response.
 
- `frontend/src/App.jsx`
  - Add state for query/status/sort/page/size and page meta.
  - Call `getTasks` with current controls and render task table using `response.content`.
  - Reset page to 0 on control changes.
  - Add loading state and disable navigation during fetch.

- `frontend/src/components/TaskTable.jsx`
  - Keep rendering tasks array; App will downstream pass the page's `content`.
 
- New components (minimal react):
  - `frontend/src/components/TaskListControls.jsx`: search input, status dropdown, sort select.
  - `frontend/src/components/Pagination.jsx`: Prev/Next, page readout, disable controls.
  - Update CSS in `frontend/src/App.css` as include for controls if needed.


## 5) Tests plan (MLG1-82)

### Files to change
- `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java
  - Update existing `GET /api/tasks` assertions to new shape: `response.content[0]`.
  - Add new tests per AC:
    - 25 tasks / page size 20 should give 20 + 5 results and correct metadata.
    - Status filter returns only matching status.
    - Query search matches title/desc case-insensitive.
    -id sort desc asserts monotonic descending id list.
    - Bad paging params produce 400 with `ApiError.message` present.

## 6) Risks and notes

- Breaking change: `GET /api/tasks` response is changed from array → page object. Frontend must be deployed together with backend or will break.
- Sort property risk: allowlist sort fields to avoid InvalidProperty exceptions/orms.
 
## 7) Done checklist

- All backend AC: MLG1-78, MLG1-79, MLG1-82 pass.
- All frontend AC: MLG1-80, MLG1-81 pass manually.
- Swagger shows new params for `GET /api/tasks`.
