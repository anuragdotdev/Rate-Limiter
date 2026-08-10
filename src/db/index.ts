import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import logger from '../logger';

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  logger.warn('NEON_DATABASE_URL or DATABASE_URL not set. DB operations will fail.');
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

pool.on('error', (err) => {
  logger.error('Unexpected Postgres client error', { err });
});

(async () => {
  try {
    const { rows } = await pool.query('SELECT now() as now');
    logger.info('Successfully connected to database, now=%s', rows[0]?.now);
  } catch (err) {
    logger.error('Failed to connect to database', { err });
  }
})();

export const db = drizzle(pool);
export { pool };
