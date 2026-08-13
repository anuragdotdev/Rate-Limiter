import test from 'node:test';
import assert from 'node:assert/strict';

import { createSlidingWindowCheck, createTokenBucketCheck } from './index';

test('token bucket allows requests up to capacity', () => {
  const decision = createTokenBucketCheck({
    capacity: 2,
    refillRatePerSecond: 1,
    availableTokens: 2,
    lastRefillAt: 0,
    now: 1000,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.remainingTokens, 1);
});

test('sliding window blocks once the request budget is exhausted', () => {
  const decision = createSlidingWindowCheck({
    limit: 2,
    windowMs: 1000,
    timestamps: [100, 200],
    now: 900,
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.remainingRequests, 0);
});
