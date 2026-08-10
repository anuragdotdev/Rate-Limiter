import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { pool } from '../db';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // Raw query via pool to return current DB time
    const { rows } = await pool.query('SELECT now() as now');
    return res.json({ status: 'ok', now: rows[0]?.now });
  })
);

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default router;
