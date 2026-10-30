# Implementation Plan – MLG1-27

Jira: https://ksharmilasai2k.atlassian.net/browse/MLG1-27


## Scope
Add pagination, sorting, and basic filtering to the existing `GET /api/tasks` endpoint. The endpoint must stop returning a raw JSON array and instead return a paged response object with metadata.

Current behavior
- `GET /api/tasks` returns `List<Task>` from `TaskController#getAllTasks` which calls `TaskService#getAllTasks` → `TaskRepository.findAll()`.

---

## Changes by file (exact)


## Backend
1) `backend/src/main/java/com/example/backend/controller/TaskController.java`
- Change `GetMapping` method signature to accept query params: `page`, `size`, `sort`, `status`, `q` .
 - Change return type from `List<Task>` to a paged response object (AC: must be a JSON object containing `content, page, size, totalElements, totalPages`).

2)`backend/src/main/java/com/example/backend/service/TaskService.java`
- Replace or overload `getAllTasks()` with a new method that supports paging/sorting and filtering:
  - Inputs: page, size, sort field + direction, optional status, optional free-text q
  - Defaults: page=0, size=20
  - Validate `status`: map to `TaskStatus` enum; unknown value → return 400 with `ApiError`
  - Implement q filter: title contains query case-insensitive (AC#5 specifies title only)

3) `backend/src/main/java/com/example/backend/repository/TaskRepository.java`
- Add paged query methods to support filter/search:
  - `Page<Task> findByStatus(TaskStatus status, Pageable pageable)`
  - `Page<Task> findByTitleContainingIgnoreCase(String title, Pageable pageable)`
  - (If needed) combined: `findByStatusAndTitleContainingIgnoreCase(...)`
  - Alternative if method combinations explode: extend `JpaSpecificationExecutor<Task>` and build Specifications in service (only if required)

4) New file: `backend/src/main/java/com/example/backend/dto/PagedTaskResponse.java`
- DTO for paged output to match AC#1 and AC#2:
  - content: List<Task>
  - page: int
  - size: int
  - totalElements: long
  - totalPages: int

-5) `backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.jav`
- Add exception handling for invalid query parameters (esp. invalid status) → HTTP 400 with `ApiError` body (fields status, error, message; extra fields ok).


## Tests
6) backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java
- Update existing GET /api/tasks assertions because response is now object: use $.content[0].title instead of $[0].title
- Add new integration tests to cover ACs 1-6: defaults, pagination; sort=title,asc; status=DONE; q=gro; unknown status returns 400 ApiError

---

## Implementation details (behavior)

### Query parameters & defaults
- page: default 0
- size: default 20
- sort: optional; parse `?sort=field,dir` (support title,asc for AC38)
- status: optional; must map to TaskStatus enum, invalid → 400 ApiError
- q: optional; case-insensitive substring match on title only

### Response shape (AC#1)
Return JSON object:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

---

## Risks / Compatibility notes
- Breaking change: GET /api/tasks changes from array → object. Any client (frontend) expecting a list must be updated.

- API contract: invalid status param must return 400 with ApiError
- No DB/schema changes.

## Dependencies / Sequencing
1) Create PagedTaskResponse DTO
2) Add repository paged queries (status, q, combined)
3) Add service method to select query + create PageRequest
4) Update controller to take query params and return PagedTaskResponse
5) Add global exception mapping for bad status params
6) Update/add integration tests
