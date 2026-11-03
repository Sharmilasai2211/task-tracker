# Implementation Plan â€“ MLG1-92

Jira: https://ksharmilasai2k.atlassian.net/browse/MLG1-92
Frontend reference (for contract): https://ksharmilasai2k.atlassian.net/browse/MLG1-94

Repo: https://github.com/Sharmilasai2211/task-tracker

## Goal
Add `createdAt` and `updatedAt` timestamps to the backend `Task` entity, persist them to the H2 database, and expose them in the JSON responses for `POST /api/tasks`, `PUT /api/tasks/{id}`, and `GET /api/tasks`.

This story is backend-focused; the UI. story (MLG1-94) will consume and display the new fields.

## Repo grounding (current state)
- Entity: `backend/src/main/java/com/example/backend/model/Task.java` has `id, title, description, status`.
- Controller: `backend/src/main/java/com/example/backend/controller/TaskController.java` returns `List<Task>`/`Task` directly (no DTO for responses).
- Service: `backend/src/main/java/com/example/backend/service/TaskService.java` uses `repository.save()` on create/update.
- DBL autoupdate: `backend/src/main/resources/application.properties` has `spring.jpa.hibernate.ddl-auto=update`.

- Gap: no accepted created/updated timestamps stored or serialized.

## Proposed approach

Use Spring Data JPA Auditing to automatically populate createdAt/updatedAt on persistence events. This minimizes manual timestamp logic in the service layer and ensures consistency.

- Add `Instant` fields to `Task`.
- Annotate with `@CreatedDate` and `@LastModifiedDate`.
m Add `@EntityListeners@(AuditingEntityListener.class)` to wire the auditing hooks. 
- Enable audenting via `@EnableJpaAuditing`.
- Rely on Spring Boot Jackson defaults to serialize `java.time.Instant` as ISO-8601 strings.

This epic also has overlapping wire-up stories (MLG1-954/MLG1-96); this plan includes wire-up necessary to satisfy MLG1-92 acceptance criteria.

## File-level change list (exact paths)

### Backend production code
1) `backend/src/main/java/com/example/backend/model/Task.java`
- Add fields: `createdAt and `updatedAt (type `java.time.Instant`).
- Add annotations and listener:
  - `@CreatedDate` on `createdAt
  - `@@LastModifiedDate` on `updatedAt
  - `@EntityListeners(AuditingEntityListener.class)` on class
- Add getters for both fields (convention matches existing code).

Ø¤‰…­•¹½ÍÉŒ½µ…¥¸½©…Ù„½½´½•á…µÁ±”½‰…­•¹½	…­•¹‘ÁÁ±¥…Ñ¥½¸¹©…Ù…€(´‘¹…‰±•)Á…Õ‘¥Ñ¥¹€Ñ¼•¹…‰±”…Õ‘¥Ñ¥¹œ±½‰…±±ä¸((ŒŒ…Ñ…‰…Í”½Í¡•µ„¥µÁ…Ð(´áÁ•Ñ•¹•Ü½±Õµ¹Ì¥¸Ñ…Í­Í€Ñ…‰±”™½ÈÑ¥µ•ÍÑ…µÁÌ€¡”¹œ¸É•…Ñ•‘}…Ñ€°ÕÁ‘…Ñ•‘}…Ð¤¸€(´]¥Ñ 	0µ…ÕÑ¼õÕÁ‘…Ñ•€°!¥‰•É¹…Ñ”Ý¥±°…‘½±Õµ¹Ì½¸ÍÑ…ÉÐ¥¸ È¸((ŒŒA$/contract impact
- Adds `createdAt`, `updatedAt` to all Task responses (create, update, list).
- Backwards compatible for clients that ignore new fields.

## Test plan (to satisfy AC)
Apdate existing MockMvc integration tests:

1) `backend/src/test/java/com/example/backend/controller/TaskControllerIntegrationTest.java`
- Create task: assert `$.createdAt` and `$.updatedAt` exist and are strings.
- Create task then UPDATE: assert createdAt fixed, and updatedAt >= previous value.
- GET list: assert first element contains both fields.

Annotation for strict ISO-6861 validation: if we need to assert format, parse the string with `JavaTime Instant.parse().

## Sequencing
- Step 1: Model changes (Task)
- Step 2: Enable auditing (Application class or config)
- Step 3: Update MockMvc tests to enforce AC
- Step 4: Manual verify: run backend, hit `/api/tasks`, observe timestamps

## Risks / notes
- Time-based assertions can be flaky; assert `updatedAt >= ahead (instead of strict greater) and add tiny delay if needed.
- PRod: spring.jpa.hibernate.ddl-auto=update is dev-friendly but not ideal for real migrations; plan assumes H2 development mode as stated in AC.

## Definition of Done
- All MLG1-92 Acceptance Criteria pass via tests and verifiable API responses.
