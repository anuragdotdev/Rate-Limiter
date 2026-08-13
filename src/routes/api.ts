import { Router } from 'express';
import createRateLimiter from '../middleware/rateLimiter';

const apiRouter = Router();

apiRouter.use(
  createRateLimiter({
    strategy: 'token-bucket',
    capacity: 5,
    refillRatePerSecond: 1,
  })
);

apiRouter.get('/ping', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

export default apiRouter;
