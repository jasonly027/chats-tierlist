import { runner as migration_runner } from 'node-pg-migrate';
import { Pool } from 'pg';

import { env } from '@/config';

export default async function createDatabase() {
  const CONNECTION_TIMEOUT_MS = 1000 * 10; // 10 secs
  const IDLE_TIMEOUT_MS = 1000 * 60; // 60 secs

  const db = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
  });

  const client = await db.connect();
  await migration_runner({
    dbClient: client,
    migrationsTable: 'migrations',
    dir: 'migrations',
    direction: 'up',
  });
  client.release();

  return db;
}
