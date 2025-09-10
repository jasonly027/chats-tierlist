import { Pool } from 'pg';
import * as util from '@lib/util.js';
import { runner as migration_runner } from 'node-pg-migrate';

const CONNECTION_TIMEOUT_MS = 1000 * 10; // 10 secs
const IDLE_TIMEOUT_MS = 1000 * 60; // 60 secs

const database = new Pool({
  connectionString: util.envVar('DATABASE_URL'),
  connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  idleTimeoutMillis: IDLE_TIMEOUT_MS,
});

await migration_runner({
  dbClient: await database.connect(),
  migrationsTable: 'migrations',
  dir: 'migrations',
  direction: 'up',
});

export default database;
