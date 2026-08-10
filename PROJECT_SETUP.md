# Project Setup — Rate Limiter Backend

This file documents the setup steps and decisions used to create the initial project in this repository. It collects the instructions you provided and the work performed.

Summary of requested features

- Simple Express backend
- NeonDB (Postgres) connectivity
- Convert project to TypeScript and use a proper `src/` folder structure
- Add Winston for logging
- Use Drizzle ORM with a `pg` Pool
- Centralized global error handling middleware
- Add `nodemon` / dev tooling and hot-reload scripts
- Add a DB-backed health check endpoint (`/healthz`)
- Add Swagger/OpenAPI docs served via Swagger UI at `/docs`
- Log a successful DB connection on startup

Repository structure (created)

- `package.json` — scripts, dependencies
- `tsconfig.json` — TypeScript configuration (includes `resolveJsonModule`)
- `src/`
  - `index.ts` — server bootstrap
  - `app.ts` — Express app, middleware and route mounting
  - `logger.ts` — Winston logger configuration
  - `db/index.ts` — `pg` Pool + `drizzle` setup and startup connection check
  - `routes/`
    - `root.ts` — `GET /` and `GET /health` example routes
    - `healthz.ts` — `GET /healthz` DB-backed health endpoint
    - `docs.ts` — mounts Swagger UI at `/docs`
  - `middleware/`
    - `asyncHandler.ts` — wrapper for async route handlers
    - `errorHandler.ts` — centralized global error handler
  - `openapi.json` — minimal OpenAPI spec used by Swagger UI
- `.env.example` — environment variables example
- `README.md` — quick run instructions
- `.gitignore`

Key configuration and notes

- Environment variables
  - `NEON_DATABASE_URL` or `DATABASE_URL` — Postgres connection string (Neon provides this)
  - `PORT` — server port (default `3000`)
  - `LOG_LEVEL` — optional Winston log level (default `info`)

- `drizzle-orm` version: pinned to a published version (`^0.45.2`) during setup to avoid a non-existent `2.0.0` tag.

- The DB helper (`src/db/index.ts`) creates a `pg` `Pool` with `ssl: { rejectUnauthorized: false }` (common for Neon), registers `pool.on('error')`, and runs an initial `SELECT now()` to log a successful connection or a failure.

- Logging: `src/logger.ts` uses Winston with timestamp, error stacks, and JSON output by default; console transport uses a simple format for development.

- Error handling: `src/middleware/errorHandler.ts` logs errors via Winston and returns a JSON error response. Routes use `asyncHandler` to forward async errors to the global handler.

Dev and run commands

Install dependencies:

```bash
npm install
```

Run in development (hot reload with `ts-node-dev`):

```bash
npm run dev
```

Alternative dev (nodemon + ts-node):

```bash
npm run nodemon
```

Build and run production bundle:

```bash
npm run build
npm start
```

Notes and next steps

- To test DB connectivity, set `NEON_DATABASE_URL` in `.env` and start the app; the app logs a successful DB connection with the returned `now()` timestamp.
- If you prefer the server to fail fast on DB connection errors, modify `src/db/index.ts` to `process.exit(1)` on startup failure.
- Address `npm audit` findings as needed (run `npm audit` and `npm audit fix`).
- Consider adding tests, CI pipeline, and a small migration script for Drizzle models if you plan to persist schemas.

If you want, I can:

- Make the server exit on DB connection failure.
- Add a Drizzle schema example and migration steps.
- Wire Swagger docs to include more detailed endpoints and models.
