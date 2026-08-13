# Rate Limiter Backend

A reusable Express rate limiter built around two common algorithms:

- Token Bucket
- Sliding Window

The service exposes a reusable middleware and can be configured for different limits per route or client key.

## Concepts

- Redis-ready storage abstraction for shared rate-limit state.
- Token Bucket algorithm for burst-friendly throttling.
- Sliding Window algorithm for precise request budgeting.

## Quick start

```bash
npm install
npm run build
npm run dev
```

The app starts on port `3000` by default and exposes a demo API route with throttling enabled.

## Demo endpoint

```bash
curl http://localhost:3000/api/ping
```

This endpoint is protected by a token-bucket rate limiter configured to allow up to 5 requests per second per client key.

## Middleware contract

The limiter can be created with either strategy:

```ts
createRateLimiter({
  strategy: 'token-bucket',
  capacity: 5,
  refillRatePerSecond: 1,
});
```

```ts
createRateLimiter({
  strategy: 'sliding-window',
  limit: 100,
  windowMs: 60000,
});
```

When the quota is exceeded, the API returns HTTP 429 and includes `Retry-After` and rate-limit headers.

## Files

- `src/rateLimit/index.ts` — reusable limiter service and algorithm implementations
- `src/middleware/rateLimiter.ts` — Express middleware wrapper
- `src/routes/api.ts` — example endpoint protected by the limiter

## Notes

- The storage abstraction supports in-memory defaults for local development.
- A Redis-backed store can be added later for distributed deployments.
