import { runner as migration_runner } from 'node-pg-migrate';
import { Pool } from 'pg';

import { envVar } from '@lib/util.js';

const CONNECTION_TIMEOUT_MS = 1000 * 10; // 10 secs
const IDLE_TIMEOUT_MS = 1000 * 60; // 60 secs

const database = new Pool({
  connectionString: envVar('DATABASE_URL'),
  connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  idleTimeoutMillis: IDLE_TIMEOUT_MS,
});

const dbClient = await database.connect();
await migration_runner({
  dbClient,
  migrationsTable: 'migrations',
  dir: 'migrations',
  direction: 'up',
});
dbClient.release();

export default database;
