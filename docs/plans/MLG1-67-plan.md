# Implementation Plan – MLG1-67

Jira: https://ksharmilasai2k.atlassian.net/browse/MLG1-67


## Scope and goals
Implement a paginated, filterable, searchable, sortable task listing API for `GET /api/tasks` using Spring Data ``Pageable``/``Sort`` and a dynamic query mechanism (preferred: Spring Data JPP Specifications).

Note: The corresponding UI changes (updating table to handle pagination/filters/search/sort) are out of scope for this backend epic and will be handled in the related UI Epic (see Jira description).

## Acceptance criteria (derived)
- `GET /api/tasks` supports pagination (`page`/``size`).
 - Supports filtering by `status` (one or many).
- Supports free-text search via `q` against title and description.
- Supports sorting via `sort` (e.g., `sort=title,asc`) with a default sort.
 - Documented in Swagger UI (OpenAPI) and covered by tests.


## Repo context (current state)
- `backend/src/main/java/com/example/backend/controller/TaskController.java`: `GET /api/tasks` → List<Task>`
- `backend/src/main/java/com/example/backend/service/TaskService.java`: `TaskRepository#findAll()`
- `backend/src/main/java/com/example/backend/repository/TaskRepository.java`: extends `JpaRepository<Task, Long>` only
- Test path: `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.jav` expects an array response for listing.



