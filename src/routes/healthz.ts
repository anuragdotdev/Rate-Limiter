import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { pool } from '../db';

const router = Router();

router.get(
  '/healthz',
  asyncHandler(async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch (e) {
      res.status(503).json({ status: 'unhealthy' });
    }
  })
);

export default router;
