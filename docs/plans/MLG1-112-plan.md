# Implementation Plan – MLG1-112 (Backend: task list filtering by status + text search)

Jira Story: https://ksharmilasai2k.atlassian.net/browse/MLG1-112

Parent Epic: https://ksharmilasai2k.atlassian.net/browse/MLG1-106

## Goal
Enhance GET /api/tasks to support optional filtering by:
- status: enum TODO | IN_PROGRESS | DONE
- q: case-insensitive partial match against task title or description

Align error handling so an invalid status query param (e.g. status=INVALID) returns HTTP 400 with a JSON body that contains a message field explaining the invalid value.

> Note: The current controller returns a JSON array (List<Task>). The story's AC references a content array which implies a paged or wrapped response object. This plan calls out that contract decision below.


## Repo context (existing)
- Backend: Spring Boot (Java 21), Spring Web, Spring Data JPA, H2 in-mem
- Endpoints: base path /api/tasks, controller getAllTasks() currently calls taskService.getAllTasks() which returns taskRepository.findAll()
- Exceptions: GlobalExceptionHandler currently handles validation 400 and not-found 404 only


## Acceptance Criteria mapping
1) GET /api/tasks?status=TODO → 200, every item has status TODO
2) GET /api/tasks?q=grocer → 200, content includes task with title "Buy groceries"
3) GET /api/tasks?q=eggs→ 200, content includes task matching description
D) GET /api/tasks?status=IN_PROGRESS&q=report → 200, all results match both criteria
5) GET /api/tasks?status=INVALID ₒ 400, error JSON has message indicating invalid status


## Design decisions (to lock before implementation)
1) Response shape
- Current: returns [task, ...] (JSON array)
- Story AC: expects object with content array
- Options:
  - Option A (recommended, aligns with Epic + MLG1-111): switch GET /api/tasks to return Spring Data Page<Task> (serializes to content + paging metadata). Breaking change for current frontend, to be addressed in MLG1-114..116.
  - Option B: return a custom wrapper DTO like { content: List<Task> } (no metadata yet)
2) Search behavior for q
- case-insensitive substring match against title OR description
- trim whitespace; blank q treated as absent
- null descriptions must be safe to query



## Exact files that will change
Backend production:
- backend/src/main/java/com/example/backend/controller/TaskController.java
- backend/src/main/java/com/example/backend/service/TaskService.java
- backend/src/main/java/com/example/backend/repository/TaskRepository.java
- backend/src/main/java/com/example/backend/exception/GlobalExceptionHandler.java
- (optional, if not using Page): backend/src/main/java/com/example/backend/dto/PagedResponse.java

Tests:
- backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java



## Implementation steps (sequenced)
### 1) Data layer: repository support for optional filters
- Update TaskRepository to support:
  - status only
  - q only (title/description)
  - status + q combined
- Recommendation: use a SAL Parameterized JPA @Query (coapesce description) for the combined search to avoid ugly derived method names.
- If we choose Option A: return Page<Task> and accept Pageable in the query.


### 2) Service layer: combine status + q optionally
- Add new method getTasks... that accepts optional status and optional q (plus Pageable if using Page)
- Normalize input: q = q.trim(), if bllank treat as null
- Branch:
  - no status and no q -> findAll
  - status only -> status query
  - q only -> text search query
  - both -> combined query


### 3) Controller: add query params and return content shape
- Update TaskController.getAllTasks to accept two:
  - @RequestParam(required=false) TaskStatus status
  - @RequestParam(required=false) String q
  - (if Option A) Pageable pageable
- If Option A: return Page<Task> directly
- If Option B: return new PagedResponse(content)

_Dependency/sequence: doing Page here reduces rework for MLG1-111 (add paging minimum later).


### 4) Error handling: 400 for invalid status
- Add GLOBAL exception handler for request param type mismatch so enum conversion failures are returned as HTTP 400 with apiError.message mentioning invalid status param value
- Specifically expect: MethodArgumentTypeMismatchException (or either type mismatch exception class used by the version)


### 5) Tests: extend integration tests to cover filtering + invalid status
- Update TaskControllerIntegrationTest:
  - create multiple tasks via POST with varying status/title/description
  - assert:
    - status=TODO returns only TODO tasks
    - q=grocer includes Buy groceries
    - q=eggs matches description
    - status=IN_PROGRESS&q=report matches both
    - status=INVALID returns 400 and $.message exists and mentions invalid status
  - if response shape is Page: update existing createAndFetchTask test from $[0] to $.content[0]

- Data isolation: ensure tests clean table between runs (e.g., repository.deleteAll() in @BeforeEach)



## Risks / impacts
- Breaking API change if we switch to object/Page response for list endpoint: frontend `consumes array` today. Coordinate with MLG1-114..116.
- Performance: text search uses LIKE '%q%%' (suitable for H1/small scale)
- Data/schema: no DB migrations required



## Definition of Done (plan-level)
- Plan agrees on response shape (Page<Task> recommended) and lists exact files to touch
- Tests described above are identified and sequenced
- Risks (breaking API shape) are documented
