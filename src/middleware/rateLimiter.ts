import { NextFunction, Request, RequestHandler, Response } from 'express';
import {
  RateLimiterService,
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
} from '../rateLimit';

export type RateLimiterStrategy =
  | {
      strategy: 'sliding-window';
      limit: number;
      windowMs: number;
      keyGenerator?: (req: Request) => string;
    }
  | {
      strategy: 'token-bucket';
      capacity: number;
      refillRatePerSecond: number;
      keyGenerator?: (req: Request) => string;
    };

function getRateLimitKey(req: Request, strategy: RateLimiterStrategy): string {
  if (strategy.keyGenerator) {
    return strategy.keyGenerator(req);
  }

  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded ?? req.socket.remoteAddress;
  return rawIp ?? 'anonymous';
}

export function createRateLimiter(strategy: RateLimiterStrategy): RequestHandler {
  const service: RateLimiterService =
    strategy.strategy === 'token-bucket'
      ? new TokenBucketRateLimiter({
          capacity: strategy.capacity,
          refillRatePerSecond: strategy.refillRatePerSecond,
        })
      : new SlidingWindowRateLimiter({
          limit: strategy.limit,
          windowMs: strategy.windowMs,
        });

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getRateLimitKey(req, strategy);
    const decision = service.consume(key, Date.now());
    const remaining =
      typeof decision.remainingRequests === 'number'
        ? decision.remainingRequests
        : typeof decision.remainingTokens === 'number'
          ? decision.remainingTokens
          : 0;

    res.setHeader('X-RateLimit-Limit', String(service.getLimit()));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', new Date(decision.resetAt).toISOString());

    if (!decision.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil(decision.retryAfterMs / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        error: 'Too many requests',
        retryAfterMs: decision.retryAfterMs,
        resetAt: new Date(decision.resetAt).toISOString(),
      });
      return;
    }

    next();
  };
}

export default createRateLimiter;
