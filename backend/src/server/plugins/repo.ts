import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import createDatabase from '@/shared/db/database';
import { Repository } from '@/shared/db/repository';

declare module 'fastify' {
  interface FastifyInstance {
    repo: Repository;
  }
}

const repo: FastifyPluginAsync = async (fastify) => {
  const db = await createDatabase();
  const repo = new Repository(db);
  fastify.decorate('repo', repo);
};

export default fastifyPlugin(repo, {
  name: 'repo',
});
