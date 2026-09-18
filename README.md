# Task Tracker

A simple Task Tracker application with a Spring Boot REST API backend and a React + Vite frontend.

- **Backend**: Java 21, Spring Boot 4.1.1 (Spring Web, Spring Data JPA, H2, Bean Validation), springdoc-openapi/Swagger UI
- **Frontend**: React + Vite, plain `fetch` (no extra HTTP libraries)

## Project layout

```
task-tracker/
├── backend/   # Spring Boot REST API (http://localhost:8050)
└── frontend/  # React + Vite UI (http://localhost:5173)
```

## Prerequisites

- Java 21+ (JDK)
- Node.js 18+ and npm
- No local Maven/Node global install required — the backend ships with the Maven Wrapper (`mvnw`/`mvnw.cmd`)

## Running the backend

```bash
cd backend
./mvnw spring-boot:run       # macOS/Linux
mvnw.cmd spring-boot:run     # Windows
```

The API starts on **http://localhost:8050** with base path `/api`.

Run the backend tests:

```bash
cd backend
./mvnw test
```

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

The UI starts on **http://localhost:5173** and talks to the backend at `http://localhost:8050/api`.

> Start the backend first (or in parallel) — the frontend has nothing to load tasks from until the API is reachable.

## Useful URLs (backend running)

| Tool | URL |
|---|---|
| REST API base | http://localhost:8050/api/tasks |
| Swagger UI | http://localhost:8050/swagger-ui.html |
| OpenAPI JSON | http://localhost:8050/api-docs |
| H2 Console | http://localhost:8050/h2-console |

### H2 Console login

- **JDBC URL**: `jdbc:h2:mem:taskdb`
- **Username**: `sa`
- **Password**: *(leave blank)*

The database is in-memory and resets every time the backend restarts.

## API overview

Base path: `/api`

| Method | Path | Description |
|---|---|---|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/{id}` | Update a task |
| DELETE | `/api/tasks/{id}` | Delete a task |

Task fields: `title` (required, 3–100 chars), `description` (optional, up to 500 chars), `status` (`TODO`, `IN_PROGRESS`, `DONE`).

## Troubleshooting

**Frontend shows a network/fetch error or tasks never load**
Make sure the backend is running on port 8050 first. Check http://localhost:8050/api/tasks directly in a browser — it should return `[]` or a JSON array.

**CORS error in the browser console**
The backend only allows requests from `http://localhost:5173`. If you changed the frontend's dev port, update the allowed origin in `backend/src/main/java/com/example/backend/config/CorsConfig.java`.

**Port 8050 or 5173 already in use**
Stop whatever else is using the port, or change it:
- Backend: add `server.port=<port>` to `backend/src/main/resources/application.properties`.
- Frontend: run `npm run dev -- --port <port>`, and update the base URL in `frontend/src/api.js` plus the CORS origin above to match.

**Validation errors aren't showing in the form**
Check the browser console for the raw response — the backend returns `400` with a `fieldErrors` map (e.g. `{"title": "size must be between 3 and 100"}`), which the frontend renders inline under each field.

**H2 Console won't connect / "Database not found"**
Make sure the JDBC URL exactly matches `jdbc:h2:mem:taskdb` (including `mem`), and that the backend process is still running — the H2 console can only see the database while the same JVM instance is alive.

**`mvnw`/`mvnw.cmd` permission denied (macOS/Linux)**
Run `chmod +x mvnw` in the `backend` directory, then retry.

**Backend fails to start with a port/bean error after code changes**
Stop any previously running instance of the backend (it may still be bound to port 8050) before starting a new one.
