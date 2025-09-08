import fastifyPostgres from '@fastify/postgres';
import { FastifyPluginAsync } from 'fastify';
import * as util from '../util.js';
import { runner as migration_runner } from 'node-pg-migrate';
import fastifyPlugin from 'fastify-plugin';

const CONNECTION_TIMEOUT_MS = 1000 * 10; // 10 secs
const IDLE_TIMEOUT_MS = 1000 * 60; // 60 secs

const db: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyPostgres, {
    connectionString: util.envVar('DATABASE_URL'),
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
  });

  await fastify.after();

  await migration_runner({
    dbClient: await fastify.pg.connect(),
    migrationsTable: 'migrations',
    dir: 'migrations',
    direction: 'up',
  });
};

export default fastifyPlugin(db);
