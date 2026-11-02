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


## Proposed API contract
**ENDPOINT:** `GET /api/tasks`

Query params (optional):
- `page`: 0-based page index (default 0)
- `size`: page size (default 20)
- `status`: one or many values (*check implementation:*
  - recommend: repeated query params `status=TODO&status=DONE` (native Spring binding)
  - alt: comma separated (requires manual parsing))
- `q`: free-text search (contains) on title OR description
- `sort` : Spring Data sort format (`sort=title,asc`). Default to `sort=id,desc`.

Response: Spring Data `Page<Task>` serialized to JSON (standard Page shape with `content`, `totalElements`, `totalPages`, `number`, `size`, etc.).

Compatibility risk: this changes get-list shape from an array to a Page object. Preferred mitigation: add legacy `GET /api/tasks/all` that returns `List<Task>` for a short deprecation period while the UI Epic migrates.


## Concrete changes (exact files)

### 1) Repository – add Specification support
- **Change** `backend/src/main/java/com/example/backend/repository/TaskRepository.java`
  - Extend `JpaSpecificationExecutor<Task>` in addition to `JpaRepository`.
- **Add** `backend/src/main/java/com/example/backend/repository/TaskSpecifications.java`
  - Static builders for Specs: `withStatus(Collection<TaskStatus>)`, `freeTextSearch(String)`.

  

### 2) Service – use specs + pageable
- **Change** `backend/src/main/java/com/example/backend/service/TaskService.java`
  - Add `new method` `Page<Task> getTasks(Collection<TaskStatus> statuses, String q, Pageable pageable)`
  - Implement: create Spec by composing status spec + free-text spec, call `findAll(spec, pageable)`.
  - (Optional) keep existing `getAllTasks()` for legacy `/all` path if we add it.

### 3) Controller – new GET params + Page response
- **Change** `backend/src/main/java/com/example/backend/controller/TaskController.java`
  - Replace current `OGetMapping` method to accept `q`, `status` and `Pageable` with defaults via `PageableDefault(size = 20, sort = "id", direction = DESC)`
  - Return `Page<Task>`
  - (Optional) add `GET /api/tasks/all` handler returning `List<Task>` for back-compat.

### 4) Tests – integration
- **Change** `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`
  - Update existing listing assertion to `jsonPath("$.content[0].title")`.
  - Add tests for pagination, status filter, `q` search, and sorting.

### 5) Docs
- **Change** `README.md`
  - Update API overview to describe new query params and Page response shape.
  - Call out briefly the legacy `/api/tasks/all` (if added) and its deprecation intent.


## Sequencing and dependencies
1. Repository: add SpecificationExecutor and Specs helper. 
2. Service: getTasks paginated method using Specs.
3. Controller: wire query params + Pageable response.
4. Tests: update existing and add new tests.
5. Docs: update README.

## Risk notes
- **Breaking API change:** listing response shape changes (array → Page object). Mitigate with legacy `/all` endpoint during migration and/or coordinate with UI Epic.
- **API contract:** decide and document multi-status input format (repeated query params recommended).
