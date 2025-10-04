import type { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import database from '@lib/db/database.js';
import { Repository } from '@lib/db/repository.js';

declare module 'fastify' {
  interface FastifyInstance {
    repo: Repository;
  }
}

const repo: FastifyPluginCallback = (fastify) => {
  const repo = new Repository(database);
  fastify.decorate('repo', repo);
};

export default fastifyPlugin(repo, {
  name: 'repo',
});
