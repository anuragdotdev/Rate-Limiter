export type RateLimitStrategy = 'sliding-window' | 'token-bucket';

export interface RateLimitDecision {
  allowed: boolean;
  remainingRequests?: number;
  remainingTokens?: number;
  retryAfterMs: number;
  resetAt: number;
}

export interface RateLimiterService {
  consume(key: string, now?: number): RateLimitDecision;
  reset(key: string): void;
  getLimit(): number;
}

export interface RateLimitStore<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
}

export class InMemoryRateLimitStore<T> implements RateLimitStore<T> {
  private readonly store = new Map<string, T>();

  get(key: string): T | undefined {
    return this.store.get(key);
  }

  set(key: string, value: T): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

export interface SlidingWindowConfig {
  limit: number;
  windowMs: number;
  store?: RateLimitStore<number[]>;
}

export interface TokenBucketConfig {
  capacity: number;
  refillRatePerSecond: number;
  store?: RateLimitStore<TokenBucketState>;
}

export interface TokenBucketState {
  availableTokens: number;
  lastRefillAt: number;
}

export function createSlidingWindowCheck({
  limit,
  windowMs,
  timestamps,
  now,
}: {
  limit: number;
  windowMs: number;
  timestamps: number[];
  now: number;
}): RateLimitDecision {
  const activeTimestamps = timestamps
    .filter((timestamp) => timestamp > now - windowMs && timestamp <= now)
    .sort((a, b) => a - b);

  const allowed = activeTimestamps.length < limit;
  const remainingRequests = allowed ? Math.max(0, limit - activeTimestamps.length - 1) : 0;
  const retryAfterMs = allowed
    ? 0
    : Math.max(0, activeTimestamps[0] + windowMs - now);

  return {
    allowed,
    remainingRequests,
    retryAfterMs,
    resetAt: activeTimestamps.length > 0 ? activeTimestamps[0] + windowMs : now,
  };
}

export function createTokenBucketCheck({
  capacity,
  refillRatePerSecond,
  availableTokens,
  lastRefillAt,
  now,
}: {
  capacity: number;
  refillRatePerSecond: number;
  availableTokens: number;
  lastRefillAt: number;
  now: number;
}): RateLimitDecision {
  if (refillRatePerSecond <= 0) {
    return {
      allowed: false,
      remainingTokens: 0,
      retryAfterMs: Number.POSITIVE_INFINITY,
      resetAt: now,
    };
  }

  const elapsedMs = Math.max(0, now - lastRefillAt);
  const refilledTokens = (elapsedMs / 1000) * refillRatePerSecond;
  const updatedTokens = Math.min(capacity, availableTokens + refilledTokens);

  if (updatedTokens >= 1) {
    const remainingTokens = updatedTokens - 1;
    return {
      allowed: true,
      remainingTokens,
      retryAfterMs: 0,
      resetAt: now,
    };
  }

  const deficit = 1 - updatedTokens;
  const retryAfterMs = Math.ceil((deficit / refillRatePerSecond) * 1000);

  return {
    allowed: false,
    remainingTokens: 0,
    retryAfterMs,
    resetAt: now + retryAfterMs,
  };
}

export class SlidingWindowRateLimiter implements RateLimiterService {
  private readonly store: RateLimitStore<number[]>;
  readonly limit: number;
  readonly windowMs: number;

  constructor(config: SlidingWindowConfig) {
    this.store = config.store ?? new InMemoryRateLimitStore<number[]>();
    this.limit = config.limit;
    this.windowMs = config.windowMs;
  }

  consume(key: string, now = Date.now()): RateLimitDecision {
    const timestamps = this.store.get(key) ?? [];
    const activeTimestamps = timestamps
      .filter((timestamp) => timestamp > now - this.windowMs && timestamp <= now)
      .sort((a, b) => a - b);

    const allowed = activeTimestamps.length < this.limit;
    const nextTimestamps = allowed ? [...activeTimestamps, now] : activeTimestamps;
    this.store.set(key, nextTimestamps);

    return createSlidingWindowCheck({
      limit: this.limit,
      windowMs: this.windowMs,
      timestamps: nextTimestamps,
      now,
    });
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  getLimit(): number {
    return this.limit;
  }
}

export class TokenBucketRateLimiter implements RateLimiterService {
  private readonly store: RateLimitStore<TokenBucketState>;
  readonly capacity: number;
  readonly refillRatePerSecond: number;

  constructor(config: TokenBucketConfig) {
    this.store = config.store ?? new InMemoryRateLimitStore<TokenBucketState>();
    this.capacity = config.capacity;
    this.refillRatePerSecond = config.refillRatePerSecond;
  }

  consume(key: string, now = Date.now()): RateLimitDecision {
    const current = this.store.get(key) ?? {
      availableTokens: this.capacity,
      lastRefillAt: now,
    };

    const elapsedMs = Math.max(0, now - current.lastRefillAt);
    const refilledTokens = (elapsedMs / 1000) * this.refillRatePerSecond;
    const availableTokens = Math.min(this.capacity, current.availableTokens + refilledTokens);

    const decision = createTokenBucketCheck({
      capacity: this.capacity,
      refillRatePerSecond: this.refillRatePerSecond,
      availableTokens,
      lastRefillAt: now,
      now,
    });

    if (decision.allowed) {
      const nextState = {
        availableTokens: decision.remainingTokens ?? 0,
        lastRefillAt: now,
      };
      this.store.set(key, nextState);
      return {
        ...decision,
        remainingTokens: nextState.availableTokens,
      };
    }

    const nextState = {
      availableTokens,
      lastRefillAt: now,
    };
    this.store.set(key, nextState);
    return { ...decision, resetAt: now + (decision.retryAfterMs || 0) };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  getLimit(): number {
    return this.capacity;
  }
}

export function createSlidingWindowRateLimiter(config: SlidingWindowConfig): SlidingWindowRateLimiter {
  return new SlidingWindowRateLimiter(config);
}

export function createTokenBucketRateLimiter(config: TokenBucketConfig): TokenBucketRateLimiter {
  return new TokenBucketRateLimiter(config);
}
