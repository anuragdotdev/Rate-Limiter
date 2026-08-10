# Rate Limiter Backend (Express + NeonDB/Postgres)

Simple Express backend with a Neon/Postgres connection via `pg`.

Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example` and set `NEON_DATABASE_URL` and `LOG_LEVEL`.

3. Run:

```bash
npm start
```

Endpoints

- `GET /` — runs `SELECT now()` against the database and returns current time.
- `GET /health` — returns HTTP 200 with `{ status: 'ok' }`.

Notes

- For Neon DB use the provided connection string from the Neon dashboard and set it as `NEON_DATABASE_URL` in your `.env`.
- The `db.js` helper uses `ssl: { rejectUnauthorized: false }` which is commonly required for Neon-hosted Postgres.
